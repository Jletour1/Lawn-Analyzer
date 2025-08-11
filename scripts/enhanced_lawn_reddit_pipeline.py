"""
enhanced_lawn_reddit_pipeline.py
Comprehensive Reddit -> SQLite -> OpenAI analysis pipeline for lawn issues.
Includes comment analysis and expanded problem categories.
"""
import argparse, os, time, sqlite3, json, re, sys
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import requests
from dotenv import load_dotenv
from PIL import Image

import praw
from openai import OpenAI

DB_PATH = Path("datasets/reddit_lawn_data.db")
DATA_DIR = Path("datasets/reddit_lawns")
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# ---------- Utilities ----------
def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def safe_str(x: Any) -> str:
    if x is None:
        return ""
    if isinstance(x, (dict, list, tuple)):
        return json.dumps(x, ensure_ascii=False, default=str)
    return str(x)

def safe_json_array(x: Any) -> str:
    if isinstance(x, (list, tuple)):
        return json.dumps(list(x), ensure_ascii=False, default=str)
    # wrap singletons to array
    return json.dumps([x], ensure_ascii=False, default=str)

# ---------- Keywords ----------
TARGET_KEYWORDS: Dict[str, List[str]] = {
    # High confidence visual problems
    "dog_urine_spots": ["dog urine", "pet damage", "round dead patches", "dark green rings", "circular brown spots", "dog pee spots"],
    "dull_mower_blades": ["dull mower blades", "frayed grass", "shredded grass", "brown tips", "ragged edges", "torn grass"],
    "fertilizer_burn": ["fertilizer burn", "over fertilized", "yellow streaks", "chemical burn", "nitrogen burn", "fertilizer stripes"],
    "grubs": ["grubs", "white grubs", "grass peels like carpet", "animals digging", "soft lawn", "grub damage"],
    "chinch_bugs": ["chinch bugs", "sunny area damage", "spreading brown patches", "small bugs", "chinch bug damage"],

    # Disease issues
    "brown_patch_disease": ["brown patch", "circular brown spots", "smoky edge", "fungal disease", "humid", "brown patch disease"],
    "dollar_spot": ["dollar spot", "small round spots", "silver dollar size", "straw colored", "tiny spots"],
    "fairy_rings": ["fairy rings", "mushroom rings", "circular mushrooms", "dark green rings", "fairy ring"],
    "rust_fungus": ["rust disease", "orange dust", "orange powder", "rusty grass", "powder on blades", "rust fungus"],

    # Environmental problems
    "drought_stress": ["drought", "dry grass", "crispy grass", "footprints visible", "water stress", "drought stress"],
    "overwatering": ["overwatering", "soggy lawn", "yellow from water", "mushrooms", "too much water", "overwatered"],
    "compacted_soil": ["compacted soil", "hard soil", "water runs off", "hard ground", "dense soil", "soil compaction"],
    "thatch_buildup": ["thatch buildup", "spongy lawn", "thick thatch", "bouncy grass", "thatch layer"],
    "moss_invasion": ["moss", "green moss", "moss taking over", "moss problem", "moss replacing grass"],

    # Weed problems
    "broadleaf_weeds": ["dandelions", "clover", "broad leaves", "yellow flowers", "white flowers", "thistle", "broadleaf weeds"],
    "grassy_weeds": ["crabgrass", "nutsedge", "coarse grass", "different grass", "thick blades", "triangular stems"],
    "creeping_weeds": ["ground ivy", "creeping charlie", "vine weeds", "runners", "spreading weeds", "creeping weeds"],
    "general_weed_invasion": ["weeds taking over", "more weeds than grass", "weed invasion", "too many weeds", "lawn full of weeds"],

    # Additional common issues
    "crabgrass": ["crabgrass", "coarse grass", "thick blades", "spreading grass weed", "summer weed"],
    "bare_patches": ["bare spots", "thin grass", "patchy lawn", "bare patches", "thin areas"],
    "scalping": ["scalped lawn", "cut too short", "mowed too low", "scalping damage"],
    "salt_damage": ["salt damage", "road salt", "ice melt", "winter salt", "salt burn"]
}

ALL_KEYWORDS: List[str] = []
for category_keywords in TARGET_KEYWORDS.values():
    ALL_KEYWORDS.extend(category_keywords)

# ---------- DB ----------
def init_enhanced_db():
    """Initialize enhanced database with comment analysis support"""
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
        collected_at TEXT,
        problem_category TEXT,
        confidence_level TEXT,
        has_image BOOLEAN DEFAULT 0,
        text_quality_score REAL DEFAULT 0.0,
        word_count INTEGER DEFAULT 0
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT,
        parent_id TEXT,
        author TEXT,
        body TEXT,
        score INTEGER,
        created_utc INTEGER,
        is_solution BOOLEAN DEFAULT 0,
        is_diagnostic BOOLEAN DEFAULT 0,
        has_product_mention BOOLEAN DEFAULT 0,
        confidence_score REAL DEFAULT 0.0,
        comment_type TEXT,
        FOREIGN KEY (post_id) REFERENCES posts (id)
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
        analyzed_at TEXT,
        weed_percentage REAL DEFAULT 0.0,
        health_score REAL DEFAULT 5.0,
        treatment_urgency TEXT,
        comment_insights TEXT,
        FOREIGN KEY (post_id) REFERENCES posts (id)
    )
    """)

    con.commit()
    con.close()

# ---------- Reddit ----------
def connect_reddit():
    """Connect to Reddit API"""
    client_id     = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent    = os.getenv("REDDIT_USER_AGENT", "enhanced_lawn_pipeline/2.0 by u/your_reddit_name")

    if not client_id or not client_secret:
        print("Reddit credentials missing. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET.")
        sys.exit(1)

    return praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent,
        ratelimit_seconds=5
    )

def save_image(url: str, post_id: str) -> Optional[str]:
    """Save image from URL"""
    try:
        if not url:
            return None
        headers = {"User-Agent": "enhanced-lawn-pipeline/2.0"}
        resp = requests.get(url, headers=headers, timeout=20, stream=True)
        resp.raise_for_status()

        ext = ".jpg"
        ctype = (resp.headers.get("Content-Type") or "").lower()
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
    except Exception as e:
        print(f"Image save error for {post_id}: {e}")
        return None

# ---------- Heuristics ----------
def analyze_text_quality(title: str, selftext: str, num_comments: int, score: int) -> Tuple[float, bool, bool, bool, int]:
    """Analyze text quality and extract signals"""
    if not selftext or len(selftext.strip()) < 30:
        wc = len(title.split()) if title else 0
        return 0.0, False, False, False, wc

    text = f"{title} {selftext}".lower()
    word_count = len(text.split())

    quality = min(word_count / 200, 0.3)

    solution_phrases = [
        'fixed it by', 'solved with', 'treatment worked', 'this cured',
        "here's what worked", 'problem solved', 'success with', 'finally fixed', 'this worked'
    ]
    has_solution = any(p in text for p in solution_phrases)
    if has_solution:
        quality += 0.4

    diagnostic_phrases = [
        'diagnosed as', 'turned out to be', 'identified as',
        'soil test showed', 'confirmed it was', 'expert said',
        'professional identified', 'lab results'
    ]
    has_diagnostic = any(p in text for p in diagnostic_phrases)
    if has_diagnostic:
        quality += 0.3

    product_phrases = [
        'highly recommend', 'waste of money', 'good results',
        "didn't work", 'amazing results', 'product review',
        'tried this', 'used this'
    ]
    has_product = any(p in text for p in product_phrases)
    if has_product:
        quality += 0.2

    if num_comments > 5:
        quality += min(num_comments / 50, 0.15)
    if score > 10:
        quality += min(score / 100, 0.1)

    return min(quality, 1.0), has_solution, has_diagnostic, has_product, word_count

def analyze_comment_quality(comment_body: str, comment_score: int) -> Tuple[bool, bool, bool, float, str]:
    """Analyze individual comment for solution/diagnostic content"""
    if not comment_body or len(comment_body.strip()) < 20:
        return False, False, False, 0.0, "low_quality"

    text = comment_body.lower()

    solution_indicators = [
        'i had this', 'same problem', 'fixed mine', 'worked for me',
        'try this', 'use this', 'apply', 'treatment', 'solution',
        "here's how", 'what worked', 'success', 'cured'
    ]
    is_solution = any(ind in text for ind in solution_indicators)

    diagnostic_indicators = [
        'looks like', 'appears to be', 'probably', 'likely',
        'diagnosed', 'identified', 'classic signs', 'symptoms',
        'caused by', 'due to', 'result of'
    ]
    is_diagnostic = any(ind in text for ind in diagnostic_indicators)

    product_indicators = [
        'product', 'brand', 'recommend', 'buy', 'purchase',
        'amazon', 'store', 'works well', 'effective'
    ]
    has_product = any(ind in text for ind in product_indicators)

    confidence = 0.0
    if is_solution: confidence += 0.4
    if is_diagnostic: confidence += 0.3
    if has_product: confidence += 0.2
    if comment_score > 5: confidence += min(comment_score / 20, 0.2)
    if len(text.split()) > 50: confidence += 0.1

    if is_solution and confidence > 0.5:
        ctype = "solution"
    elif is_diagnostic and confidence > 0.4:
        ctype = "diagnostic"
    elif has_product:
        ctype = "product_review"
    elif len(text.split()) > 30:
        ctype = "discussion"
    else:
        ctype = "low_quality"

    return is_solution, is_diagnostic, has_product, min(confidence, 1.0), ctype

def get_problem_category(title: str, selftext: str) -> Tuple[str, str]:
    """Determine problem category and confidence from text"""
    text = f"{title} {selftext}".lower()

    best_category = "unknown"
    best_score = 0.0

    for category, keywords in TARGET_KEYWORDS.items():
        score = 0.0
        for keyword in keywords:
            if keyword.lower() in text:
                score += 0.3 if len(keyword.split()) > 1 else 0.2
        if score > best_score:
            best_score = score
            best_category = category

    if best_score >= 0.5:
        confidence = "high"
    elif best_score >= 0.3:
        confidence = "medium"
    else:
        confidence = "low"
    return best_category, confidence

# ---------- Collect ----------
def collect_enhanced(subs: List[str], limit: int = 300, incremental: bool = True):
    """Enhanced collection with comment analysis and incremental support"""
    init_enhanced_db()
    reddit = connect_reddit()
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    last_collection_time = 0
    if incremental:
        cur.execute("SELECT MAX(created_utc) FROM posts")
        result = cur.fetchone()
        if result and result[0]:
            last_collection_time = result[0]
            print(f"📅 Incremental mode: collecting posts newer than {datetime.fromtimestamp(last_collection_time)}")
        else:
            print("📅 No previous data found, performing full collection")
            incremental = False

    total_posts = total_comments = skipped_posts = updated_posts = 0

    for sub in subs:
        print(f"🌿 {'Incrementally collecting' if incremental else 'Collecting'} from r/{sub} with enhanced analysis...")
        sr = reddit.subreddit(sub)
        search_terms = ALL_KEYWORDS[:30]

        for i, term in enumerate(search_terms, 1):
            print(f"  🔎 [{i}/30] Searching: '{term}'")
            try:
                posts_for_term = 0
                for post in sr.search(term, sort="relevance", time_filter="all", limit=15):
                    pid = post.id
                    post_created_utc = int(getattr(post, "created_utc", time.time()))

                    if incremental and post_created_utc <= last_collection_time:
                        skipped_posts += 1
                        continue

                    cur.execute("SELECT 1 FROM posts WHERE id=?", (pid,))
                    post_exists = cur.fetchone() is not None

                    if post_exists and incremental:
                        cur.execute("""
                            UPDATE posts 
                            SET num_comments = ?, score = ?, upvote_ratio = ?, collected_at = ?
                            WHERE id = ?
                        """, (
                            int(getattr(post, "num_comments", 0)),
                            int(getattr(post, "score", 0)),
                            float(getattr(post, "upvote_ratio", 0.0)),
                            utc_now_iso(),
                            pid
                        ))
                        updated_posts += 1

                        try:
                            cur.execute("SELECT id FROM comments WHERE post_id = ?", (pid,))
                            existing_comment_ids = {row[0] for row in cur.fetchall()}

                            post.comments.replace_more(limit=0)
                            new_comments = 0
                            for comment in post.comments[:25]:
                                if comment.id not in existing_comment_ids:
                                    is_solution, is_diagnostic, has_product_mention, conf_score, c_type = analyze_comment_quality(
                                        comment.body or "", int(getattr(comment, "score", 0))
                                    )
                                    cur.execute("""
                                        INSERT OR REPLACE INTO comments
                                        (id, post_id, parent_id, author, body, score, created_utc,
                                         is_solution, is_diagnostic, has_product_mention, confidence_score, comment_type)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                    """, (
                                        comment.id, pid, getattr(comment, "parent_id", None),
                                        str(comment.author) if comment.author else "[deleted]",
                                        comment.body or "", int(getattr(comment, "score", 0)),
                                        int(getattr(comment, "created_utc", time.time())),
                                        is_solution, is_diagnostic, has_product_mention, conf_score, c_type
                                    ))
                                    new_comments += 1
                                    total_comments += 1
                            if new_comments > 0:
                                print(f"    ➕ Added {new_comments} new comments to existing post")
                        except Exception as e:
                            print(f"    Comment update error: {e}")
                        continue

                    elif post_exists and not incremental:
                        continue

                    quality, has_solution, has_diagnostic, has_product, word_count = analyze_text_quality(
                        post.title or "", getattr(post, "selftext", "") or "",
                        int(getattr(post, "num_comments", 0)),
                        int(getattr(post, "score", 0))
                    )

                    problem_category, confidence_level = get_problem_category(
                        post.title or "", getattr(post, "selftext", "") or ""
                    )

                    image_path = None
                    has_image = False
                    post_hint = getattr(post, "post_hint", None)
                    url = getattr(post, "url", None)

                    should_download_image = True
                    if incremental and post_exists:
                        cur.execute("SELECT image_path FROM posts WHERE id = ?", (pid,))
                        existing_image = cur.fetchone()
                        if existing_image and existing_image[0]:
                            image_path = existing_image[0]
                            has_image = True
                            should_download_image = False

                    if should_download_image and post_hint in ("image", "link") and url and any(
                        url.lower().endswith(ext) for ext in [".jpg",".jpeg",".png",".webp"]
                    ):
                        new_image_path = save_image(url, pid)
                        if new_image_path:
                            image_path = new_image_path
                            has_image = True

                    cur.execute("""
                        INSERT OR REPLACE INTO posts
                        (id, subreddit, title, selftext, author, created_utc, url, score,
                         num_comments, image_path, post_hint, upvote_ratio, collected_at,
                         problem_category, confidence_level, has_image, text_quality_score, word_count)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        pid, sub, post.title or "", getattr(post, "selftext", "") or "",
                        str(post.author) if post.author else "[deleted]",
                        post_created_utc,
                        url, int(getattr(post, "score", 0)),
                        int(getattr(post, "num_comments", 0)),
                        image_path, post_hint, float(getattr(post, "upvote_ratio", 0.0)),
                        utc_now_iso(),
                        problem_category, confidence_level, has_image, float(quality), int(word_count)
                    ))

                    try:
                        post.comments.replace_more(limit=0)
                        for comment in post.comments[:25]:
                            is_solution, is_diagnostic, has_product_mention, conf_score, c_type = analyze_comment_quality(
                                comment.body or "", int(getattr(comment, "score", 0))
                            )
                            cur.execute("""
                                INSERT OR REPLACE INTO comments
                                (id, post_id, parent_id, author, body, score, created_utc,
                                 is_solution, is_diagnostic, has_product_mention, confidence_score, comment_type)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (
                                comment.id, pid, getattr(comment, "parent_id", None),
                                str(comment.author) if comment.author else "[deleted]",
                                comment.body or "", int(getattr(comment, "score", 0)),
                                int(getattr(comment, "created_utc", time.time())),
                                is_solution, is_diagnostic, has_product_mention, conf_score, c_type
                            ))
                            total_comments += 1
                    except Exception as e:
                        print(f"    Comment collection error: {e}")

                    posts_for_term += 1
                    total_posts += 1
                    if posts_for_term >= 10:
                        break

                if posts_for_term > 0:
                    print(f"    ✅ Collected {posts_for_term} posts")

                con.commit()
                time.sleep(1.5)

            except Exception as e:
                print(f"  ❌ Search error for '{term}': {e}")
                continue

    con.close()
    if incremental:
        print(f"✅ Incremental collection complete:")
        print(f"   📊 {total_posts} new posts, {total_comments} new comments")
        print(f"   ⏭️  {skipped_posts} posts skipped (already collected)")
        print(f"   🔄 {updated_posts} posts updated with new metadata")
    else:
        print(f"✅ Full collection complete: {total_posts} posts, {total_comments} comments")

# ---------- OpenAI ----------
ENHANCED_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "root_cause": {"type": "string", "description": "Primary root cause in 1-2 sentences"},
        "confidence": {"type": "string", "enum": ["high", "medium", "low"], "description": "Confidence level in diagnosis"},
        "categories": {"type": "array", "items": {"type": "string"}, "description": "Problem categories"},
        "solutions": {"type": "array", "items": {"type": "string"}, "description": "Specific treatment recommendations"},
        "weed_percentage": {"type": "number","minimum": 0,"maximum": 100,"description": "Estimated % area affected by weeds"},
        "health_score": {"type": "number","minimum": 1,"maximum": 10,"description": "Overall lawn health 1-10"},
        "treatment_urgency": {"type": "string","enum": ["low","medium","high"],"description": "Urgency"}
    },
    "required": ["root_cause","confidence","categories","solutions","weed_percentage","health_score","treatment_urgency"]
}

def build_enhanced_prompt(title: str, body: str, comments: List[str], problem_category: str = "unknown") -> str:
    solution_comments, diagnostic_comments, other_comments = [], [], []
    for comment in comments[:15]:
        lc = comment.lower()
        if any(w in lc for w in ['fixed', 'worked', 'solved', 'cured', 'success']):
            solution_comments.append(comment)
        elif any(w in lc for w in ['looks like', 'probably', 'appears', 'diagnosed']):
            diagnostic_comments.append(comment)
        else:
            other_comments.append(comment)

    parts = [
        f"Title: {title}",
        f"Post: {body}",
        f"Suspected Category: {problem_category.replace('_',' ').title()}"
    ]

    if solution_comments:
        parts.append("Solution Comments:")
        for i, c in enumerate(solution_comments[:5], 1):
            parts.append(f"  {i}. {c[:200]}...")

    if diagnostic_comments:
        parts.append("Diagnostic Comments:")
        for i, c in enumerate(diagnostic_comments[:5], 1):
            parts.append(f"  {i}. {c[:200]}...")

    if other_comments:
        parts.append("Other Comments:")
        for i, c in enumerate(other_comments[:5], 1):
            parts.append(f"  {i}. {c[:150]}...")

    instructions = """You are an expert lawn care diagnostician analyzing Reddit posts about lawn problems.

Based on the post content and community comments, provide a comprehensive analysis. Pay special attention to:
1) Solution comments from users who solved similar problems
2) Diagnostic insights from experienced users
3) Weed identification and percentage estimation
4) Treatment urgency and seasonal timing
Return JSON matching the provided schema only."""
    return f"{instructions}\n\n" + "\n\n".join(parts)

def analyze_enhanced(model: str = "gpt-4o-mini", batch: int = 30, dry_run: bool = False):
    """Enhanced analysis with comment insights"""
    init_enhanced_db()
    if not os.getenv("OPENAI_API_KEY"):
        print("Set OPENAI_API_KEY in environment or .env")
        sys.exit(1)

    # Support project-scoped keys seamlessly
    client = OpenAI(
        project=os.getenv("OPENAI_PROJECT") or None,
        organization=os.getenv("OPENAI_ORG_ID") or None,
    )

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    cur.execute("""
        SELECT p.id, p.title, p.selftext, p.problem_category,
               COUNT(c.id) as comment_count,
               SUM(CASE WHEN c.is_solution = 1 THEN 1 ELSE 0 END) as solution_comments,
               SUM(CASE WHEN c.is_diagnostic = 1 THEN 1 ELSE 0 END) as diagnostic_comments
        FROM posts p
        LEFT JOIN comments c ON c.post_id = p.id
        LEFT JOIN analyses a ON a.post_id = p.id
        WHERE a.post_id IS NULL
        GROUP BY p.id, p.title, p.selftext, p.problem_category
        ORDER BY 
            (solution_comments + diagnostic_comments) DESC,
            p.score DESC,
            comment_count DESC
        LIMIT 500
    """)
    rows = cur.fetchall()

    for i, (post_id, title, selftext, problem_category, comment_count, solution_count, diagnostic_count) in enumerate(rows, 1):
        cur.execute("""
            SELECT body FROM comments 
            WHERE post_id = ? AND body IS NOT NULL 
            ORDER BY 
                CASE WHEN is_solution = 1 THEN 3
                     WHEN is_diagnostic = 1 THEN 2
                     ELSE 1 END DESC,
                score DESC 
            LIMIT 20
        """, (post_id,))
        comments = [r[0] for r in cur.fetchall()]

        prompt = build_enhanced_prompt(title or "", selftext or "", comments, problem_category or "unknown")

        if dry_run:
            print(f"--- DRY RUN for {post_id} ---")
            print(f"Category: {problem_category}, Comments: {comment_count} ({solution_count} solutions, {diagnostic_count} diagnostic)")
            print(prompt[:600] + "...\n")
            continue

        try:
            # Using Chat Completions with JSON output (avoids Responses scope issues)
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an expert lawn care diagnostician. Analyze posts and return structured JSON following the schema."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )

            result_text = response.choices[0].message.content if response and response.choices else "{}"
            data = json.loads(result_text) if result_text else {}

            # ---- SAFE COERCION (prevents dict/list binding errors) ----
            root_cause = data.get("root_cause", "")
            if not isinstance(root_cause, str):
                root_cause = safe_str(root_cause)

            confidence = data.get("confidence", "low")
            if not isinstance(confidence, str):
                confidence = safe_str(confidence)
            confidence = confidence.lower()
            if confidence not in {"high", "medium", "low"}:
                confidence = "low"

            categories_json = safe_json_array(data.get("categories", []))
            solutions_json  = safe_json_array(data.get("solutions", []))
            weed_pct = float(data.get("weed_percentage", 0.0) or 0.0)
            health_score = float(data.get("health_score", 5.0) or 5.0)
            treatment_urgency = data.get("treatment_urgency", "medium")
            if not isinstance(treatment_urgency, str):
                treatment_urgency = safe_str(treatment_urgency)

            comment_insights = {
                "total_comments": int(comment_count or 0),
                "solution_comments": int(solution_count or 0),
                "diagnostic_comments": int(diagnostic_count or 0),
                "community_confidence": "high" if (solution_count or 0) > 2 else ("medium" if (diagnostic_count or 0) > 1 else "low")
            }
            reasoning_json = safe_str(data)

            cur.execute("""
                INSERT OR REPLACE INTO analyses
                (post_id, model, root_cause, solutions, confidence, categories, reasoning_json, 
                 analyzed_at, weed_percentage, health_score, treatment_urgency, comment_insights)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                post_id, model, root_cause,
                solutions_json,
                confidence,
                categories_json,
                reasoning_json,
                utc_now_iso(),
                weed_pct,
                health_score,
                treatment_urgency,
                json.dumps(comment_insights, ensure_ascii=False)
            ))

            if i % batch == 0:
                con.commit()
                print(f"🧠 Analyzed {i}/{len(rows)} (Comments: {comment_count}, Solutions: {solution_count})")

        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Analysis failed for {post_id}: {e}")
            continue

    con.commit()
    con.close()
    print("✅ Enhanced analysis complete with comment insights.")

# ---------- Discovery ----------
def discover_new_root_causes(model: str = "gpt-4o-mini", dry_run: bool = False):
    """Discover new root causes from unclassified posts"""
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    cur.execute("""
        SELECT p.id, p.title, p.selftext, p.problem_category, a.confidence,
               GROUP_CONCAT(c.body, ' | ') as comments
        FROM posts p
        LEFT JOIN analyses a ON a.post_id = p.id
        LEFT JOIN comments c ON c.post_id = p.id AND c.is_solution = 1
        WHERE (a.confidence = 'low' OR p.problem_category = 'unknown')
        AND p.score > 10
        GROUP BY p.id
        HAVING COUNT(c.id) > 2
        ORDER BY p.score DESC
        LIMIT 50
    """)
    rows = cur.fetchall()

    if not rows:
        print("No unclassified posts found for root cause discovery")
        con.close()
        return

    discovery_prompt = """
Analyze these lawn care posts that couldn't be classified into existing categories.
Identify potential NEW root causes not covered by existing categories.

Existing categories: dog urine spots, dull mower blades, fertilizer burn, grubs, chinch bugs,
brown patch, dollar spot, fairy rings, rust fungus, drought stress, overwatering,
compacted soil, thatch buildup, moss invasion, broadleaf weeds, grassy weeds, creeping weeds.

Posts to analyze:
"""
    for i, (post_id, title, selftext, category, confidence, comments) in enumerate(rows[:20]):
        discovery_prompt += f"\n{i+1}. Title: {title}\nDescription: {safe_str(selftext)[:200]}...\nSolutions: {safe_str(comments)[:300] if comments else 'None'}...\n"

    discovery_prompt += """
Return JSON like:
{
  "discovered_problems": [
    {
      "name": "Problem Name",
      "description": "Detailed symptoms",
      "confidence": 0.85,
      "supporting_posts": 5,
      "example_descriptions": ["quote 1","quote 2"],
      "suggested_treatments": ["treatment 1","treatment 2"],
      "suggested_products": ["product 1","product 2"]
    }
  ]
}
"""

    if dry_run:
        print("--- ROOT CAUSE DISCOVERY DRY RUN ---")
        print(f"Would analyze {len(rows)} unclassified posts")
        print(discovery_prompt[:600] + "...")
        con.close()
        return

    try:
        if not os.getenv("OPENAI_API_KEY"):
            print("OpenAI API key required for root cause discovery")
            con.close()
            return

        client = OpenAI(
            project=os.getenv("OPENAI_PROJECT") or None,
            organization=os.getenv("OPENAI_ORG_ID") or None,
        )
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert lawn care diagnostician discovering new problem patterns."},
                {"role": "user", "content": discovery_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.4
        )
        result = json.loads(response.choices[0].message.content or "{}")
        discovered = result.get("discovered_problems", [])

        if discovered:
            print(f"🔍 Discovered {len(discovered)} potential new root causes:")
            for problem in discovered:
                name = safe_str(problem.get("name", "Unnamed"))
                conf = safe_str(problem.get("confidence", ""))
                posts = safe_str(problem.get("supporting_posts", ""))
                print(f"  • {name} (confidence: {conf}, posts: {posts})")

            discovery_file = Path("datasets/discovered_root_causes.json")
            with open(discovery_file, "w", encoding="utf-8") as f:
                json.dump({"timestamp": utc_now_iso(), "discoveries": discovered}, f, indent=2, ensure_ascii=False)
            print(f"💾 Saved discoveries to {discovery_file}")
        else:
            print("🔍 No new root causes discovered from current data")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Root cause discovery failed: {e}")

    con.close()

# ---------- Export ----------
def export_enhanced_csv():
    """Export enhanced analysis results"""
    init_enhanced_db()
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    out = Path("datasets/enhanced_lawn_analyses.csv")

    headers = [
        "post_id", "subreddit", "title", "problem_category", "root_cause", "confidence",
        "solutions", "categories", "weed_percentage", "health_score", "treatment_urgency",
        "url", "image_path", "score", "num_comments", "solution_comments", "diagnostic_comments"
    ]

    with open(out, "w", encoding="utf-8") as f:
        f.write(",".join(headers) + "\n")
        cur.execute("""
            SELECT p.id, p.subreddit, REPLACE(REPLACE(p.title, '\n',' '), ',', ' '),
                   p.problem_category, a.root_cause, a.confidence, 
                   REPLACE(REPLACE(a.solutions, '\n',' '), '\r',' '),
                   REPLACE(REPLACE(a.categories, '\n',' '), '\r',' '),
                   a.weed_percentage, a.health_score, a.treatment_urgency,
                   p.url, COALESCE(p.image_path,''), p.score, p.num_comments,
                   COALESCE(JSON_EXTRACT(a.comment_insights, '$.solution_comments'), 0),
                   COALESCE(JSON_EXTRACT(a.comment_insights, '$.diagnostic_comments'), 0)
            FROM posts p
            JOIN analyses a ON a.post_id = p.id
            ORDER BY a.weed_percentage DESC, p.score DESC
        """)
        for row in cur.fetchall():
            safe = [safe_str(col) for col in row]
            f.write(",".join(f'"{cell}"' for cell in safe) + "\n")

    con.close()
    print(f"📤 Enhanced export complete: {out}")

# ---------- CLI ----------
def main():
    load_dotenv()
    parser = argparse.ArgumentParser(description="Enhanced Reddit → SQLite → OpenAI lawn analysis pipeline")
    sub = parser.add_subparsers(dest="cmd")

    p_collect = sub.add_parser("collect", help="Enhanced collection with comment analysis")
    p_collect.add_argument("--subs", nargs="+", default=["lawncare","landscaping","plantclinic"])
    p_collect.add_argument("--limit", type=int, default=300)
    p_collect.add_argument("--full", action="store_true", help="Disable incremental mode and collect everything again")

    p_analyze = sub.add_parser("analyze", help="Enhanced AI analysis with comment insights")
    p_analyze.add_argument("--model", type=str, default="gpt-4o-mini")
    p_analyze.add_argument("--dry-run", action="store_true")
    p_analyze.add_argument("--batch", type=int, default=30, help="Commit/log every N analyses")

    sub.add_parser("export", help="Export enhanced results to CSV")

    args = parser.parse_args()

    if args.cmd == "collect":
        collect_enhanced(args.subs, args.limit, incremental=(not args.full))
    elif args.cmd == "analyze":
        analyze_enhanced(model=args.model, dry_run=args.dry_run, batch=args.batch)
    elif args.cmd == "export":
        export_enhanced_csv()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
