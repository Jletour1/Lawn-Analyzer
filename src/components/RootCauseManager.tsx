// src/pages/RootCauseManager.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getLocalData,
  saveLocalData,
  exportDataAsJSON,
} from "../utils/localStorage";
import {
  Database,
  Save,
  Plus,
  X,
  RefreshCw,
  ExternalLink,
  Search,
  Filter,
  Wand2,
  BadgeCheck,
  Tag,
  Package,
  BookOpen,
  CheckCircle2,
  Link2,
  Image as ImageIcon,
  User,
  MessageSquare,
} from "lucide-react";

/* =========================================================================
   Types
   ========================================================================= */
export type RootCauseCategory =
  | "grubs"
  | "overwatering"
  | "fungus"
  | "drought"
  | "weeds"
  | "nutrient_deficiency"
  | "soil_compaction"
  | "mowing_damage"
  | "pet_damage"
  | "disease"
  | "other";

export interface ManagedProduct {
  id: string;
  name: string;
  category: string;
  price?: number;
  affiliate_link?: string;
  confidence?: number;
  context?: string;
  active?: boolean;
}

export interface ManagedRootCause {
  id: string;
  name: string;
  category: RootCauseCategory | string; // allow legacy/unknown
  subcategory?: string;
  description?: string;
  confidence_threshold?: number;
  success_rate?: number;
  products: ManagedProduct[];
  standard_solutions?: string[];
  ai_products?: ManagedProduct[];
  case_count?: number;
  created_at?: string;
  updated_at?: string;
}

/* Source case used for review links */
type SourceCase = {
  id: string;
  source: "reddit" | "user";
  title: string;
  url?: string | null;        // reddit post url when available
  image_url?: string | null;  // image from analysis or submission
  subreddit?: string | null;
  created_at?: string | null;
};

/* =========================================================================
   Category config
   ========================================================================= */
const CATEGORY_CONFIG: Record<
  RootCauseCategory,
  { color: string; chip: string; icon: string; label: string }
> = {
  grubs: {
    color: "bg-red-50 text-red-800 border-red-200",
    chip: "bg-red-100 text-red-800",
    icon: "🪲",
    label: "Grubs & Insects",
  },
  overwatering: {
    color: "bg-blue-50 text-blue-800 border-blue-200",
    chip: "bg-blue-100 text-blue-800",
    icon: "💧",
    label: "Overwatering",
  },
  fungus: {
    color: "bg-purple-50 text-purple-800 border-purple-200",
    chip: "bg-purple-100 text-purple-800",
    icon: "🍄",
    label: "Fungal Disease",
  },
  drought: {
    color: "bg-yellow-50 text-yellow-800 border-yellow-200",
    chip: "bg-yellow-100 text-yellow-800",
    icon: "☀️",
    label: "Drought Stress",
  },
  weeds: {
    color: "bg-green-50 text-green-800 border-green-200",
    chip: "bg-green-100 text-green-800",
    icon: "🌿",
    label: "Weeds",
  },
  nutrient_deficiency: {
    color: "bg-orange-50 text-orange-800 border-orange-200",
    chip: "bg-orange-100 text-orange-800",
    icon: "🧪",
    label: "Nutrient Issues",
  },
  soil_compaction: {
    color: "bg-gray-50 text-gray-800 border-gray-200",
    chip: "bg-gray-100 text-gray-800",
    icon: "🗿",
    label: "Soil Compaction",
  },
  mowing_damage: {
    color: "bg-indigo-50 text-indigo-800 border-indigo-200",
    chip: "bg-indigo-100 text-indigo-800",
    icon: "✂️",
    label: "Mowing Damage",
  },
  pet_damage: {
    color: "bg-pink-50 text-pink-800 border-pink-200",
    chip: "bg-pink-100 text-pink-800",
    icon: "🐕",
    label: "Pet Damage",
  },
  disease: {
    color: "bg-rose-50 text-rose-800 border-rose-200",
    chip: "bg-rose-100 text-rose-800",
    icon: "🦠",
    label: "Disease",
  },
  other: {
    color: "bg-slate-50 text-slate-800 border-slate-200",
    chip: "bg-slate-100 text-slate-800",
    icon: "❓",
    label: "Other Issues",
  },
};

/* =========================================================================
   Utilities + normalization (prevents 'undefined .color' errors)
   ========================================================================= */
const safeArr = <T,>(v: unknown, fb: T[] = []): T[] => (Array.isArray(v) ? (v as T[]) : fb);
const titleCase = (s?: string) =>
  s ? s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) : "";

/* Extract image url from reddit-ish objects */
const htmlUnescape = (u?: string) => (u ? u.replace(/&amp;/g, "&") : u || "");
const getRedditImageFromData = (rd: any): string | null => {
  if (!rd) return null;
  try {
    const p0 = rd?.preview?.images?.[0]?.source?.url;
    if (typeof p0 === "string") return htmlUnescape(p0);
  } catch {}
  try {
    const mm = rd?.media_metadata;
    if (mm && typeof mm === "object") {
      const k = Object.keys(mm)[0];
      const meta = k ? mm[k] : null;
      const su = meta?.s?.u || meta?.p?.[meta?.p?.length - 1]?.u;
      if (typeof su === "string") return htmlUnescape(su);
    }
  } catch {}
  if (typeof rd?.url_overridden_by_dest === "string" && /^https?:\/\//.test(rd.url_overridden_by_dest)) {
    return htmlUnescape(rd.url_overridden_by_dest);
  }
  if (typeof rd?.url === "string" && /^https?:\/\//.test(rd.url)) {
    return htmlUnescape(rd.url);
  }
  if (typeof rd?.thumbnail === "string" && /^https?:\/\//.test(rd.thumbnail)) {
    return htmlUnescape(rd.thumbnail);
  }
  return null;
};

const normalizeCategory = (raw: any): RootCauseCategory => {
  const s = String(raw || "").toLowerCase().trim();
  if ((CATEGORY_CONFIG as any)[s]) return s as RootCauseCategory;
  if (s.includes("weed")) return "weeds";
  if (s.includes("fung")) return "fungus";
  if (s.includes("overwater") || s.includes("waterlog") || s === "water") return "overwatering";
  if (s.includes("drought") || s.includes("heat") || s.includes("dry")) return "drought";
  if (s.includes("grub") || s.includes("pest") || s.includes("bug") || s.includes("insect")) return "grubs";
  if (s.includes("nutri")) return "nutrient_deficiency";
  if (s.includes("soil") || s.includes("compact") || s.includes("thatch")) return "soil_compaction";
  if (s.includes("mow") || s.includes("scalp") || s.includes("mechanic")) return "mowing_damage";
  if (s.includes("pet") || s.includes("urine") || s.includes("dog")) return "pet_damage";
  if (s.includes("disease")) return "disease";
  return "other";
};

/* =========================================================================
   Component
   ========================================================================= */
const RootCauseManager: React.FC = () => {
  const [managed, setManaged] = useState<ManagedRootCause[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<RootCauseCategory | "all">("all");
  const [saving, setSaving] = useState(false);

  // raw data for building Sources section
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // New RC Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState<Partial<ManagedRootCause>>({
    name: "",
    category: "other",
    subcategory: "",
    description: "",
    confidence_threshold: 0.7,
    success_rate: 0.6,
  });

  /* ---------------------- Load ---------------------- */
  useEffect(() => {
    const data = getLocalData();

    const list: ManagedRootCause[] = Array.isArray(data.managed_root_causes)
      ? data.managed_root_causes
      : [];
    const normalized = list.map((rc) => ({
      ...rc,
      category: normalizeCategory(rc.category),
      products: safeArr(rc.products),
      standard_solutions: safeArr(rc.standard_solutions),
      ai_products: safeArr(rc.ai_products),
    }));
    setManaged(normalized);

    setAnalyses(safeArr<any>(data.analyzed_posts));
    setSubmissions(safeArr<any>(data.submissions));
  }, []);

  /* ---------------------- Helpers ---------------------- */
  const persistManaged = (next: ManagedRootCause[]) => {
    const data = getLocalData();
    data.managed_root_causes = next.map((rc) => ({
      ...rc,
      category: normalizeCategory(rc.category),
      products: rc.products || [],
      standard_solutions: rc.standard_solutions || [],
      ai_products: rc.ai_products || [],
    }));
    saveLocalData(data);
  };

  // Counts for chips (normalized)
  const categoryCounts = useMemo(() => {
    const counts: Record<RootCauseCategory, number> = {
      grubs: 0,
      overwatering: 0,
      fungus: 0,
      drought: 0,
      weeds: 0,
      nutrient_deficiency: 0,
      soil_compaction: 0,
      mowing_damage: 0,
      pet_damage: 0,
      disease: 0,
      other: 0,
    };
    for (const rc of managed) counts[normalizeCategory(rc.category)]++;
    return counts;
  }, [managed]);

  /* ---------------------- Sync from AI ---------------------- */
  const syncFromAI = () => {
    const data = getLocalData();
    const aiList: any[] = Array.isArray(data.root_causes) ? data.root_causes : [];
    if (aiList.length === 0) {
      alert("No AI root causes found. Run AI Analysis first.");
      return;
    }

    const clone = [...managed];

    for (const ai of aiList) {
      const cat = normalizeCategory(ai.category || ai.root_cause_category || "other");
      const sub = ai.subcategory || ai.root_cause_subcategory || undefined;

      let idx = clone.findIndex(
        (m) =>
          normalizeCategory(m.category) === cat &&
          (m.subcategory || "").toLowerCase() === (sub || "").toLowerCase()
      );
      if (idx < 0 && ai.name) {
        idx = clone.findIndex(
          (m) => (m.name || "").toLowerCase() === (ai.name || "").toLowerCase()
        );
      }

      const aiProducts: ManagedProduct[] = (ai.products || ai.products_mentioned || [])
        .filter(Boolean)
        .slice(0, 10)
        .map((p: any, i: number) => ({
          id: `ai_${ai.id || "rc"}_${i}`,
          name: p.name || "Unknown Product",
          category: p.category || "General",
          affiliate_link: p.affiliate_link || "",
          confidence: typeof p.confidence === "number" ? p.confidence : 0.7,
          context:
            p.context || `Found in AI results for ${titleCase(sub || ai.name || "root cause")}`,
          active: true,
        }));

      if (idx >= 0) {
        const curr = { ...clone[idx] };
        curr.name = curr.name || ai.name || titleCase(sub || "Root Cause");
        curr.description =
          curr.description || ai.description || ai.standard_root_cause || "";
        curr.standard_solutions = Array.from(
          new Set([...(curr.standard_solutions || []), ...(ai.standard_solutions || [])])
        );
        const existingNames = new Set(
          (curr.ai_products || []).map((p) => (p.name || "").toLowerCase())
        );
        curr.ai_products = (curr.ai_products || []).concat(
          aiProducts.filter((p) => !existingNames.has((p.name || "").toLowerCase()))
        );
        curr.case_count = Math.max(curr.case_count || 0, ai.case_count || 0);
        curr.success_rate =
          typeof ai.success_rate === "number" ? ai.success_rate : curr.success_rate;
        curr.updated_at = new Date().toISOString();
        curr.category = normalizeCategory(curr.category);

        clone[idx] = curr;
      } else {
        const newItem: ManagedRootCause = {
          id: `managed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: ai.name || titleCase(sub || "Root Cause"),
          category: cat,
          subcategory: sub,
          description: ai.description || ai.standard_root_cause || "",
          confidence_threshold:
            typeof ai.confidence_threshold === "number" ? ai.confidence_threshold : 0.7,
          success_rate: typeof ai.success_rate === "number" ? ai.success_rate : 0.6,
          products: [],
          standard_solutions: (ai.standard_solutions || []).slice(0, 6),
          ai_products: aiProducts,
          case_count: ai.case_count || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        clone.push(newItem);
      }
    }

    setManaged(clone);
    persistManaged(clone);
    alert("AI knowledge synced! (Merged into your managed list)");
  };

  /* ---------------------- Save All ---------------------- */
  const saveAll = async () => {
    setSaving(true);
    try {
      persistManaged(managed);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------- Filters ---------------------- */
  const filtered = useMemo(() => {
    let arr = managed.map((rc) => ({ ...rc, category: normalizeCategory(rc.category) }));
    if (activeCategory !== "all") {
      arr = arr.filter((r) => normalizeCategory(r.category) === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (r) =>
          (r.name || "").toLowerCase().includes(q) ||
          (r.subcategory || "").toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q)
      );
    }
    return arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [managed, activeCategory, search]);

  /* ---------------------- Build Sources ---------------------- */
  const findCasesForRC = (rc: ManagedRootCause): SourceCase[] => {
    const cat = normalizeCategory(rc.category);
    const sub = (rc.subcategory || "").toLowerCase();

    const redditCases: SourceCase[] = safeArr<any>(analyses)
      .filter((a) => {
        const aCat = normalizeCategory(a.root_cause_category || a.category || "other");
        const aSub = (a.root_cause_subcategory || a.primary_issue || "").toLowerCase();
        const categoryMatch = aCat === cat;
        const subMatch = sub ? aSub === sub : true;
        return categoryMatch && subMatch;
      })
      .slice(0, 12)
      .map((a) => ({
        id: a.id || a.post_id || `a_${Math.random().toString(36).slice(2, 8)}`,
        source: "reddit",
        title: a.reddit_data?.title || "Reddit post",
        url: a.reddit_data?.url || a.reddit_url || null,
        image_url: a.image_analysis?.image_url || getRedditImageFromData(a.reddit_data),
        subreddit: a.reddit_data?.subreddit || null,
        created_at: a.analyzed_at || null,
      }));

    const userCases: SourceCase[] = safeArr<any>(submissions)
      .filter((s) => {
        const a = s.analysis || {};
        const aCat = normalizeCategory(a.root_cause_category || a.category || "other");
        const aSub = (a.root_cause_subcategory || a.primary_issue || "").toLowerCase();
        const categoryMatch = aCat === cat;
        const subMatch = sub ? aSub === sub : true;
        return categoryMatch && subMatch;
      })
      .slice(0, 12)
      .map((s) => ({
        id: s.id || `u_${Math.random().toString(36).slice(2, 8)}`,
        source: "user",
        title: s.problem_description || "User submission",
        url: null,
        image_url:
          s.image_url ||
          s.image_path ||
          s.image_data ||
          s.analysis?.image_analysis?.image_url ||
          null,
        subreddit: null,
        created_at: s.created_at || null,
      }));

    return [...redditCases, ...userCases].slice(0, 12);
  };

  /* ---------------------- Mutations ---------------------- */
  const updateRC = (id: string, patch: Partial<ManagedRootCause>) => {
    setManaged((prev) =>
      prev.map((rc) =>
        rc.id === id
          ? {
              ...rc,
              ...patch,
              category:
                "category" in patch ? normalizeCategory((patch as any).category) : rc.category,
              updated_at: new Date().toISOString(),
            }
          : rc
      )
    );
  };

  const deleteRC = (id: string) => {
    if (!confirm("Delete this root cause? This action cannot be undone.")) return;
    setManaged((prev) => {
      const next = prev.filter((rc) => rc.id !== id);
      persistManaged(next); // persist immediately so it "sticks"
      return next;
    });
  };

  const addManagedProduct = (id: string) => {
    setManaged((prev) =>
      prev.map((rc) =>
        rc.id === id
          ? {
              ...rc,
              products: [
                ...(rc.products || []),
                {
                  id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  name: "New Product",
                  category: "General",
                  affiliate_link: "",
                  confidence: 1,
                  active: true,
                },
              ],
            }
          : rc
      )
    );
  };

  const updateManagedProduct = (rcId: string, productId: string, patch: Partial<ManagedProduct>) => {
    setManaged((prev) =>
      prev.map((rc) =>
        rc.id === rcId
          ? {
              ...rc,
              products: (rc.products || []).map((p) => (p.id === productId ? { ...p, ...patch } : p)),
            }
          : rc
      )
    );
  };

  const removeManagedProduct = (rcId: string, productId: string) => {
    setManaged((prev) =>
      prev.map((rc) =>
        rc.id === rcId ? { ...rc, products: (rc.products || []).filter((p) => p.id !== productId) } : rc
      )
    );
  };

  const updateAIProduct = (rcId: string, productId: string, patch: Partial<ManagedProduct>) => {
    setManaged((prev) =>
      prev.map((rc) =>
        rc.id === rcId
          ? {
              ...rc,
              ai_products: (rc.ai_products || []).map((p) => (p.id === productId ? { ...p, ...patch } : p)),
            }
          : rc
      )
    );
  };

  const removeAIProduct = (rcId: string, productId: string) => {
    setManaged((prev) =>
      prev.map((rc) =>
        rc.id === rcId ? { ...rc, ai_products: (rc.ai_products || []).filter((p) => p.id !== productId) } : rc
      )
    );
  };

  const promoteAIProduct = (rcId: string, product: ManagedProduct) => {
    setManaged((prev) =>
      prev.map((rc) =>
        rc.id === rcId
          ? {
              ...rc,
              products: [
                ...(rc.products || []),
                { ...product, id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` },
              ],
            }
          : rc
      )
    );
  };

  const addSolution = (rcId: string) => {
    setManaged((prev) =>
      prev.map((rc) =>
        rc.id === rcId ? { ...rc, standard_solutions: [...(rc.standard_solutions || []), ""] } : rc
      )
    );
  };

  const updateSolution = (rcId: string, idx: number, value: string) => {
    setManaged((prev) =>
      prev.map((rc) =>
        rc.id === rcId
          ? {
              ...rc,
              standard_solutions: (rc.standard_solutions || []).map((s, i) => (i === idx ? value : s)),
            }
          : rc
      )
    );
  };

  const removeSolution = (rcId: string, idx: number) => {
    setManaged((prev) =>
      prev.map((rc) =>
        rc.id === rcId
          ? { ...rc, standard_solutions: (rc.standard_solutions || []).filter((_, i) => i !== idx) }
          : rc
      )
    );
  };

  /* ---------------------- New RC Modal handlers ---------------------- */
  const openNewModal = () => {
    setNewForm({
      name: "",
      category: "other",
      subcategory: "",
      description: "",
      confidence_threshold: 0.7,
      success_rate: 0.6,
    });
    setShowNewModal(true);
  };

  const createFromModal = () => {
    const name = (newForm.name || "").trim();
    if (!name) {
      alert("Please enter a name for the root cause.");
      return;
    }

    const rc: ManagedRootCause = {
      id: `managed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      category: normalizeCategory(newForm.category || "other"),
      subcategory: (newForm.subcategory || "").trim() || undefined,
      description: newForm.description || "",
      confidence_threshold:
        typeof newForm.confidence_threshold === "number" ? newForm.confidence_threshold : 0.7,
      success_rate: typeof newForm.success_rate === "number" ? newForm.success_rate : 0.6,
      products: [],
      standard_solutions: [],
      ai_products: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const next = [rc, ...managed];
    setManaged(next);

    // Make sure it's visible immediately
    setSearch("");
    setActiveCategory("all");

    // Persist immediately so it survives refresh
    persistManaged(next);

    setShowNewModal(false);
  };

  /* =========================================================================
     Render
     ========================================================================= */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Root Cause Manager</h2>
            <p className="text-sm text-gray-600">
              Curate AI-discovered problems, add your products & affiliate links, and keep everything in sync.
            </p>
          </div>
        <div className="flex items-center gap-2">
            <button
              onClick={syncFromAI}
              className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              title="Merge AI results from the Analysis page"
            >
              <Wand2 className="w-4 h-4" />
              <span>Sync from AI</span>
            </button>
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-black"
              title="Create a new Root Cause"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
            <button
              onClick={saveAll}
              disabled={saving}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        {/* Top Category Chips (click to filter) */}
        <div className="mt-4 flex flex-wrap gap-3">
          <CategoryChip
            label="All"
            icon="📚"
            active={activeCategory === "all"}
            count={managed.length}
            onClick={() => setActiveCategory("all")}
          />
          {(Object.keys(CATEGORY_CONFIG) as RootCauseCategory[]).map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <CategoryChip
                key={cat}
                label={cfg.label}
                icon={cfg.icon}
                active={activeCategory === cat}
                count={categoryCounts[cat]}
                onClick={() => setActiveCategory(cat)}
                className={cfg.chip}
              />
            );
          })}
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, subcategory, description..."
              className="outline-none text-sm w-72"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Filter className="w-4 h-4" />
              Clear Filters
            </button>
            <button
              onClick={exportDataAsJSON}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              <Database className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Reload
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        filtered.map((rc) => {
          const safeCat = normalizeCategory(rc.category);
          const cfg = CATEGORY_CONFIG[safeCat] || CATEGORY_CONFIG.other;
          const cases = findCasesForRC(rc);

          return (
            <div key={rc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 border-b ${cfg.color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cfg.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          value={rc.name || ""}
                          onChange={(e) => updateRC(rc.id, { name: e.target.value })}
                          className="text-base font-semibold bg-transparent outline-none"
                        />
                        {!!rc.success_rate && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white border">
                            <BadgeCheck className="w-3 h-3" />
                            {(rc.success_rate * 100).toFixed(0)}% success
                          </span>
                        )}
                        {!!rc.case_count && (
                          <span className="text-xs text-gray-600">{rc.case_count} cases</span>
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="px-2 py-0.5 rounded-full border bg-white">
                          {CATEGORY_CONFIG[safeCat].label}
                        </span>
                        {rc.subcategory && (
                          <span className="ml-2 px-2 py-0.5 rounded-full border bg-white">
                            {rc.subcategory.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteRC(rc.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Row: category/sub/threshold/success */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-gray-600">Category</label>
                    <select
                      value={safeCat}
                      onChange={(e) => updateRC(rc.id, { category: e.target.value as RootCauseCategory })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {(Object.keys(CATEGORY_CONFIG) as RootCauseCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_CONFIG[cat].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Subcategory</label>
                    <input
                      value={rc.subcategory || ""}
                      onChange={(e) => updateRC(rc.id, { subcategory: e.target.value })}
                      placeholder="e.g., brown_patch_disease"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Confidence threshold</label>
                    <input
                      type="number"
                      step="0.05"
                      min={0}
                      max={1}
                      value={typeof rc.confidence_threshold === "number" ? rc.confidence_threshold : 0.7}
                      onChange={(e) =>
                        updateRC(rc.id, { confidence_threshold: Math.max(0, Math.min(1, Number(e.target.value))) })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Success rate</label>
                    <input
                      type="number"
                      step="0.05"
                      min={0}
                      max={1}
                      value={typeof rc.success_rate === "number" ? rc.success_rate : 0.6}
                      onChange={(e) =>
                        updateRC(rc.id, { success_rate: Math.max(0, Math.min(1, Number(e.target.value))) })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-gray-600">Description</label>
                  <textarea
                    value={rc.description || ""}
                    onChange={(e) => updateRC(rc.id, { description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Explain what this root cause is and when it appears."
                  />
                </div>

                {/* Sources (Reddit & User) */}
                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-900">
                      Sources (Reddit & User){cases.length ? ` – ${cases.length}` : ""}
                    </h4>
                  </div>
                  {cases.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No matching sources found yet. After AI Analysis runs, matching Reddit posts and user
                      submissions will appear here with links and images for manual review.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cases.map((c) => (
                        <div
                          key={c.id}
                          className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2 rounded border bg-gray-50"
                        >
                          {/* Title + meta */}
                          <div className="md:col-span-7">
                            <div className="flex items-center gap-2">
                              {c.source === "reddit" ? (
                                <MessageSquare className="w-4 h-4 text-orange-600" />
                              ) : (
                                <User className="w-4 h-4 text-purple-600" />
                              )}
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {c.title || "(untitled)"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 ml-6">
                              {c.source === "reddit" && c.subreddit ? `r/${c.subreddit}` : "User submission"}
                              {c.created_at ? ` • ${new Date(c.created_at).toLocaleDateString()}` : ""}
                            </div>
                          </div>

                          {/* Post link */}
                          <div className="md:col-span-3">
                            {c.url ? (
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white border hover:bg-gray-100 text-sm"
                                title="Open original post"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open Post
                              </a>
                            ) : (
                              <span className="text-xs text-gray-500">No post URL</span>
                            )}
                          </div>

                          {/* Image link */}
                          <div className="md:col-span-2">
                            {c.image_url ? (
                              <a
                                href={c.image_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white border hover:bg-gray-100 text-sm"
                                title="Open image"
                              >
                                <ImageIcon className="w-4 h-4" />
                                Image
                              </a>
                            ) : (
                              <span className="text-xs text-gray-500">No image</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Solutions Summary */}
                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-semibold text-gray-900">AI Solutions Summary</h4>
                  </div>
                  {(rc.standard_solutions || []).length === 0 && (
                    <p className="text-xs text-gray-500 mb-2">No AI solutions yet. Add a few below.</p>
                  )}
                  <div className="space-y-2">
                    {(rc.standard_solutions || []).map((s, i) => (
                      <div key={`${rc.id}_sol_${i}`} className="flex items-center gap-2">
                        <input
                          value={s}
                          onChange={(e) => updateSolution(rc.id, i, e.target.value)}
                          placeholder="e.g., Apply a propiconazole fungicide..."
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        />
                        <button
                          onClick={() => removeSolution(rc.id, i)}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addSolution(rc.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100"
                    >
                      <Plus className="w-4 h-4" />
                      Add Solution
                    </button>
                  </div>
                </div>

                {/* AI-Found Products */}
                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-semibold text-gray-900">AI-Found Products</h4>
                  </div>

                  {(rc.ai_products || []).length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No AI products for this root cause yet. Click <b>Sync from AI</b> to import, or add manually to
                      Managed Products below.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(rc.ai_products || []).map((p) => (
                        <div
                          key={p.id}
                          className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center p-2 rounded border bg-gray-50"
                        >
                          <input
                            value={p.name}
                            onChange={(e) => updateAIProduct(rc.id, p.id, { name: e.target.value })}
                            className="md:col-span-3 px-3 py-1.5 border rounded text-sm"
                            placeholder="Product name"
                          />
                          <input
                            value={p.category || ""}
                            onChange={(e) => updateAIProduct(rc.id, p.id, { category: e.target.value })}
                            className="md:col-span-2 px-3 py-1.5 border rounded text-sm"
                            placeholder="Category"
                          />
                          <input
                            type="url"
                            value={p.affiliate_link || ""}
                            onChange={(e) => updateAIProduct(rc.id, p.id, { affiliate_link: e.target.value })}
                            className="md:col-span-2 px-3 py-1.5 border rounded text-sm"
                            placeholder="Affiliate link (optional)"
                          />
                          <div className="flex items-center gap-2 md:col-span-1">
                            {p.affiliate_link && (
                              <a
                                className="p-2 rounded bg-white border hover:bg-gray-50"
                                href={p.affiliate_link}
                                target="_blank"
                                rel="noreferrer"
                                title="Open link"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => promoteAIProduct(rc.id, p)}
                              className="px-2 py-1.5 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              title="Move to Managed Products"
                            >
                              Promote
                            </button>
                            <button
                              onClick={() => removeAIProduct(rc.id, p.id)}
                              className="px-2 py-1.5 text-xs rounded bg-gray-200 hover:bg-gray-300"
                              title="Remove"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Managed Products */}
                <div className="p-4 rounded-lg border bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-900">Managed Products</h4>
                  </div>

                  {(rc.products || []).length === 0 ? (
                    <p className="text-xs text-gray-500">No managed products yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {(rc.products || []).map((p) => (
                        <div
                          key={p.id}
                          className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center p-2 rounded border"
                        >
                          <input
                            value={p.name}
                            onChange={(e) => updateManagedProduct(rc.id, p.id, { name: e.target.value })}
                            className="md:col-span-3 px-3 py-1.5 border rounded text-sm"
                            placeholder="Product name"
                          />
                          <input
                            value={p.category || ""}
                            onChange={(e) => updateManagedProduct(rc.id, p.id, { category: e.target.value })}
                            className="md:col-span-2 px-3 py-1.5 border rounded text-sm"
                            placeholder="Category"
                          />
                          <input
                            type="url"
                            value={p.affiliate_link || ""}
                            onChange={(e) => updateManagedProduct(rc.id, p.id, { affiliate_link: e.target.value })}
                            className="md:col-span-2 px-3 py-1.5 border rounded text-sm"
                            placeholder="Affiliate link"
                          />
                          <div className="flex items-center gap-2 md:col-span-1">
                            {p.affiliate_link && (
                              <a
                                className="p-2 rounded bg-white border hover:bg-gray-50"
                                href={p.affiliate_link}
                                target="_blank"
                                rel="noreferrer"
                                title="Open link"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => removeManagedProduct(rc.id, p.id)}
                              className="px-2 py-1.5 text-xs rounded bg-gray-200 hover:bg-gray-300"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => addManagedProduct(rc.id)}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>
                      Threshold: {(rc.confidence_threshold ?? 0.7).toFixed(2)} • Success:{" "}
                      {((rc.success_rate ?? 0.6) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <span>
                    Updated: {rc.updated_at ? new Date(rc.updated_at).toLocaleString() : "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* New Root Cause Modal */}
      {showNewModal && (
        <Modal onClose={() => setShowNewModal(false)} title="Create Root Cause">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-600">Name *</label>
              <input
                value={newForm.name || ""}
                onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Brown Patch Disease"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600">Category *</label>
                <select
                  value={normalizeCategory(newForm.category || "other")}
                  onChange={(e) =>
                    setNewForm((p) => ({ ...p, category: e.target.value as RootCauseCategory }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {(Object.keys(CATEGORY_CONFIG) as RootCauseCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Subcategory</label>
                <input
                  value={newForm.subcategory || ""}
                  onChange={(e) => setNewForm((p) => ({ ...p, subcategory: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., brown_patch"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600">Description</label>
              <textarea
                value={newForm.description || ""}
                onChange={(e) => setNewForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Explain what this root cause is and when it appears."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600">Confidence threshold</label>
                <input
                  type="number"
                  step="0.05"
                  min={0}
                  max={1}
                  value={
                    typeof newForm.confidence_threshold === "number"
                      ? newForm.confidence_threshold
                      : 0.7
                  }
                  onChange={(e) =>
                    setNewForm((p) => ({
                      ...p,
                      confidence_threshold: Math.max(0, Math.min(1, Number(e.target.value))),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Success rate</label>
                <input
                  type="number"
                  step="0.05"
                  min={0}
                  max={1}
                  value={
                    typeof newForm.success_rate === "number" ? newForm.success_rate : 0.6
                  }
                  onChange={(e) =>
                    setNewForm((p) => ({
                      ...p,
                      success_rate: Math.max(0, Math.min(1, Number(e.target.value))),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createFromModal}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* =========================================================================
   UI Bits
   ========================================================================= */
const EmptyState: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-10 text-center">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No root causes yet</h3>
    <p className="text-gray-600">
      Click <b>Sync from AI</b> to import results from the Analysis page, or create a new root cause.
    </p>
  </div>
);

const CategoryChip: React.FC<{
  label: string;
  count: number;
  icon?: string;
  active?: boolean;
  onClick: () => void;
  className?: string;
}> = ({ label, count, icon, active, onClick, className }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${
      active ? "bg-black text-white border-black" : "bg-white text-gray-800 hover:bg-gray-50"
    } ${className || ""}`}
    title={`Filter by ${label}`}
  >
    {icon && <span>{icon}</span>}
    <span>{label}</span>
    <span className="text-xs px-2 py-0.5 rounded-full bg-white border">{count}</span>
  </button>
);

/* Simple modal */
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

export default RootCauseManager;