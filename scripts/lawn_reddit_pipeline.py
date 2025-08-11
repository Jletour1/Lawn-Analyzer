
"""
lawn_reddit_pipeline.py
End-to-end Reddit -> SQLite -> OpenAI analysis pipeline for lawn issues.
"""
import argparse, os, time, sqlite3, json, re, sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

import requests
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO

import praw
from openai import OpenAI

DB_PATH = Path("datasets/reddit_lawn_data.db")
DATA_DIR = Path("datasets/reddit_lawns")
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

TARGET_KEYWORDS = [
    "dog urine", "pee spots", "dull blades", "frayed tips", "fertilizer burn",
    "grubs", "chinch bugs", "brown patch", "dollar spot", "fairy ring",
    "rust fungus", "crabgrass", "drought stress", "overwatering",
    "compacted soil", "thatch", "moss", "dandelion", "clover", "ground ivy",
    "nutsedge", "broadleaf weeds", "weeds taking over", "thin lawn", "bare patches"
]

def init_db():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        subreddit TEXT,
        title TEXT,
        selftext TEXT,
        author TEXT,
        created_utc INTEGER,
        url TEXT,
        score INTEGER,
        num_comments INTEGER,
        image_path TEXT,
        post_hint TEXT,
        upvote_ratio REAL,
        collected_at TEXT
    )
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT,
        author TEXT,
        body TEXT,
        score INTEGER,
        created_utc INTEGER
    )
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS analyses (
        post_id TEXT PRIMARY KEY,
        model TEXT,
        root_cause TEXT,
        solutions TEXT,
        confidence TEXT,
        categories TEXT,
        reasoning_json TEXT,
        analyzed_at TEXT
    )
    """)
    con.commit()
    con.close()

def connect_reddit():
    client_id     = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent    = os.getenv("REDDIT_USER_AGENT", "lawn_pipeline/1.0 by u/your_reddit_name")

    if not client_id or not client_secret:
        print("Reddit credentials missing. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET.")
        sys.exit(1)

    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent,
        ratelimit_seconds=5
    )
    return reddit

def save_image(url: str, post_id: str) -> Optional[str]:
    try:
        if not url:
            return None
        headers = {"User-Agent": "lawn-pipeline-img/1.0"}
        resp = requests.get(url, headers=headers, timeout=20, stream=True)
        resp.raise_for_status()
        ext = ".jpg"
        ctype = resp.headers.get("Content-Type", "").lower()
        if "png" in ctype:
            ext = ".png"
        elif "webp" in ctype:
            ext = ".webp"

        path = DATA_DIR / f"{post_id}{ext}"
        with open(path, "wb") as f:
            for chunk in resp.iter_content(8192):
                if chunk:
                    f.write(chunk)
        try:
            Image.open(path).verify()
        except Exception:
            pass
        return str(path)
    except Exception:
        return None

def collect(subs: List[str], limit: int = 200):
    init_db()
    reddit = connect_reddit()
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    for sub in subs:
        print(f"🌿 Collecting from r/{sub} ...")
        sr = reddit.subreddit(sub)
        queries = TARGET_KEYWORDS + ["lawn", "grass problem", "weed", "yellow spots"]
        seen = 0
        per_query = max(5, limit // max(1, len(queries)))
        for q in queries:
            try:
                for post in sr.search(q, sort="relevance", time_filter="all", limit=per_query):
                    pid = post.id
                    cur.execute("SELECT 1 FROM posts WHERE id=?", (pid,))
                    if cur.fetchone():
                        continue

                    image_path = None
                    post_hint = getattr(post, "post_hint", None)
                    url = getattr(post, "url", None)
                    if post_hint in ("image", "link") and url and any(url.lower().endswith(ext) for ext in [".jpg",".jpeg",".png",".webp"]):
                        image_path = save_image(url, pid)

                    cur.execute("""
                        INSERT OR REPLACE INTO posts
                        (id, subreddit, title, selftext, author, created_utc, url, score,
                         num_comments, image_path, post_hint, upvote_ratio, collected_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        pid, sub, post.title or "", getattr(post, "selftext", "") or "",
                        str(post.author) if post.author else "[deleted]",
                        int(getattr(post, "created_utc", time.time())),
                        url, int(getattr(post, "score", 0)), int(getattr(post, "num_comments", 0)),
                        image_path, post_hint, float(getattr(post, "upvote_ratio", 0.0)),
                        datetime.utcnow().isoformat(timespec="seconds")
                    ))

                    try:
                        post.comments.replace_more(limit=0)
                        for c in post.comments[:20]:
                            cur.execute("""
                                INSERT OR REPLACE INTO comments
                                (id, post_id, author, body, score, created_utc)
                                VALUES (?, ?, ?, ?, ?, ?)
                            """, (
                                c.id, pid, str(c.author) if c.author else "[deleted]",
                                c.body or "", int(getattr(c, "score", 0)), int(getattr(c, "created_utc", time.time()))
                            ))
                    except Exception:
                        pass

                    seen += 1
                    if seen % 20 == 0:
                        con.commit()
            except Exception as e:
                print(f"  search error for '{q}': {e}")
        con.commit()
    con.close()
    print("✅ Collection complete.")

ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "root_cause": {"type": "string", "description": "Likely root cause in 1 short sentence."},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
        "categories": {"type": "array", "items": {"type": "string"}},
        "solutions": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["root_cause", "confidence", "categories", "solutions"]
}

def build_prompt(title: str, body: str, comments: List[str]) -> str:
    joined = "\n\n".join([f"Title: {title}", f"Post: {body}", "Top comments:"] + [f"- {c}" for c in comments[:10]])
    instructions = (
        "You are a turfgrass diagnostician. Analyze the issue and return a JSON object ONLY that matches the given schema. "
        "Use evidence from the post and comments. Prefer common, realistic causes. If uncertain, say 'low' confidence."
    )
    return f"{instructions}\n\n{joined}\n"

def analyze(model: str = "gpt-4o-mini", batch: int = 40, dry_run: bool = False):
    init_db()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Set OPENAI_API_KEY in environment or .env")
        sys.exit(1)

    client = OpenAI()  # uses OPENAI_API_KEY

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("""
        SELECT p.id, p.title, p.selftext
        FROM posts p
        LEFT JOIN analyses a ON a.post_id = p.id
        WHERE a.post_id IS NULL
        ORDER BY p.score DESC
        LIMIT 500
    """)
    rows = cur.fetchall()

    for i, (post_id, title, selftext) in enumerate(rows, 1):
        cur.execute("SELECT body FROM comments WHERE post_id=? ORDER BY score DESC LIMIT 15", (post_id,))
        comments = [r[0] for r in cur.fetchall()]

        prompt = build_prompt(title or "", selftext or "", comments)

        if dry_run:
            print(f"--- DRY RUN for {post_id} ---")
            print(prompt[:500] + "...\n")
            continue

        try:
            resp = client.responses.create(
                model=model,
                input=[
                    {"role": "system", "content": "You are a precise lawn care diagnostician."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_schema", "json_schema": {"name": "LawnAnalysis", "schema": ANALYSIS_SCHEMA, "strict": True}},
            )
            try:
                text = resp.output_text
            except Exception:
                parts = getattr(resp, "output", []) or getattr(resp, "content", [])
                if parts and hasattr(parts[0], "text"):
                    text = parts[0].text
                else:
                    text = ""

            data = json.loads(text) if text else {}

            cur.execute("""
                INSERT OR REPLACE INTO analyses
                (post_id, model, root_cause, solutions, confidence, categories, reasoning_json, analyzed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                post_id, model, data.get("root_cause",""),
                json.dumps(data.get("solutions", []), ensure_ascii=False),
                data.get("confidence","low"),
                json.dumps(data.get("categories", [])),
                json.dumps(data, ensure_ascii=False),
                datetime.utcnow().isoformat(timespec="seconds")
            ))
            if i % batch == 0:
                con.commit()
                print(f"🧠 Analyzed {i}/{len(rows)}")
        except Exception as e:
            print(f"Analysis failed for {post_id}: {e}")
            continue

    con.commit()
    con.close()
    print("✅ Analysis complete.")

def export_csv():
    init_db()
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    out = Path("datasets/lawn_analyses_export.csv")
    headers = [
        "post_id","subreddit","title","root_cause","confidence","solutions","categories","url","image_path","score","num_comments"
    ]
    with open(out, "w", encoding="utf-8") as f:
        f.write(",".join(h for h in headers) + "\n")
        cur.execute("""
            SELECT p.id, p.subreddit, REPLACE(REPLACE(p.title, '\n',' '), ',', ' '),
                   a.root_cause, a.confidence, REPLACE(REPLACE(a.solutions, '\n',' '), '\r',' '),
                   REPLACE(REPLACE(a.categories, '\n',' '), '\r',' '),
                   p.url, COALESCE(p.image_path,''), p.score, p.num_comments
            FROM posts p
            JOIN analyses a ON a.post_id = p.id
            ORDER BY p.score DESC
        """)
        for row in cur.fetchall():
            safe = [str(col) if col is not None else "" for col in row]
            f.write(",".join(f'"{cell}"' for cell in safe) + "\n")
    con.close()
    print(f"📤 Exported: {out}")

def main():
    load_dotenv()
    parser = argparse.ArgumentParser(description="Reddit → SQLite → OpenAI lawn analysis pipeline")
    sub = parser.add_subparsers(dest="cmd")

    p_collect = sub.add_parser("collect", help="Collect posts/comments/images from Reddit")
    p_collect.add_argument("--subs", nargs="+", default=["lawncare","landscaping","plantclinic"])
    p_collect.add_argument("--limit", type=int, default=200)

    p_analyze = sub.add_parser("analyze", help="Run OpenAI analysis over collected posts")
    p_analyze.add_argument("--model", type=str, default="gpt-4o-mini")
    p_analyze.add_argument("--dry-run", action="store_true")

    p_export = sub.add_parser("export", help="Export combined results to CSV")

    args = parser.parse_args()

    if args.cmd == "collect":
        collect(args.subs, args.limit)
    elif args.cmd == "analyze":
        analyze(model=args.model, dry_run=args.dry_run)
    elif args.cmd == "export":
        export_csv()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
