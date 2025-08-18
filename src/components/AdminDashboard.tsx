// src/pages/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getLocalData, saveLocalData, exportDataAsJSON } from '../utils/localStorage';
import {
  Database,
  Edit3,
  Save,
  X,
  BarChart3,
  Users,
  Image as ImageIcon,
  Download,
  RefreshCw,
  ExternalLink,
  Star,
  Maximize2,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { LawnAnalysis, ProductMention, CollectionStats, UserDiagnostic } from '../types';

/* ---------------------- Safe helpers ---------------------- */
const safeArr = <T,>(v: unknown, fallback: T[] = []): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
const valOr = <T,>(v: T | undefined | null, fb: T): T => (v === undefined || v === null ? fb : v);

/* Try to pull an image from reddit-like payloads */
const htmlUnescape = (u?: string) => (u ? u.replace(/&amp;/g, '&') : u || '');
const getRedditImageFromData = (rd: any): string | null => {
  if (!rd) return null;
  try {
    const p0 = rd?.preview?.images?.[0]?.source?.url;
    if (typeof p0 === 'string') return htmlUnescape(p0);
  } catch {}
  try {
    const mm = rd?.media_metadata;
    if (mm && typeof mm === 'object') {
      const k = Object.keys(mm)[0];
      const meta = k ? mm[k] : null;
      const su = meta?.s?.u || meta?.p?.[meta?.p?.length - 1]?.u;
      if (typeof su === 'string') return htmlUnescape(su);
    }
  } catch {}
  if (typeof rd?.url_overridden_by_dest === 'string' && /^https?:\/\//.test(rd.url_overridden_by_dest)) {
    return htmlUnescape(rd.url_overridden_by_dest);
  }
  if (typeof rd?.url === 'string' && /^https?:\/\//.test(rd.url)) {
    return htmlUnescape(rd.url);
  }
  if (typeof rd?.thumbnail === 'string' && /^https?:\/\//.test(rd.thumbnail)) {
    return htmlUnescape(rd.thumbnail);
  }
  return null;
};

/* ---------------------- Submission shape tolerance helpers ---------------------- */
const SUBMISSION_KEYS = ['submissions', 'user_submissions', 'analysis_requests', 'uploads'] as const;

// pick the first defined value
const first = <T,>(...vals: T[]) => vals.find(v => v !== undefined && v !== null);

// robust image extraction for user submissions
const getSubmissionImage = (s: any): string | undefined =>
  first<string | undefined>(
    s?.image_url,
    s?.image_data,
    s?.image,
    s?.photo,
    s?.file?.dataURL,
    typeof s?.image_path === 'string' && (s.image_path.startsWith('data:') || s.image_path.startsWith('http')) ? s.image_path : undefined
  );

// merge all possible buckets and remember origin in __storeKey
const pickSubmissionArray = (data: any): any[] => {
  const merged: Record<string, any> = {};
  for (const key of SUBMISSION_KEYS) {
    for (const item of safeArr<any>(data?.[key])) {
      const id = String(item?.id ?? Math.random().toString(36).slice(2));
      merged[id] = { ...merged[id], ...item, __storeKey: key };
    }
  }
  return Object.values(merged);
};

// normalize any shape into UserDiagnostic (+ embedded LawnAnalysis)
const normalizeUserSubmission = (sub: any): UserDiagnostic | null => {
  try {
    const id = String(sub?.id ?? `sub_${Math.random().toString(36).slice(2)}`);
    const ares = sub?.analysis_result || sub?.analysis || {};
    const created_at = first<string>(sub?.created_at, sub?.createdAt, sub?.timestamp, new Date().toISOString());

    const analysis: LawnAnalysis = {
      id, // important: keep same id as submission
      post_id: id,
      is_lawn: true,
      root_cause: ares?.rootCause || 'Analysis pending',
      solutions: safeArr<string>(ares?.solutions),
      recommendations: [],
      products_mentioned: safeArr<any>(ares?.products).map((p: any, idx: number) => ({
        id: `${id}_product_${idx}`,
        name: p?.name || 'Unknown Product',
        category: p?.category || 'General',
        affiliate_link: p?.affiliateLink || '',
        confidence: valOr<number>(p?.confidence, 0.8),
        context: p?.context || `User submission ${id}`,
      })),
      confidence_level: (ares?.confidence || 0) > 0.8 ? 'high' : (ares?.confidence || 0) > 0.6 ? 'medium' : 'low',
      health_score: ares?.healthScore ?? 5,
      weed_percentage: ares?.weed_percentage ?? 0,
      treatment_urgency: ares?.urgency || 'medium',
      analyzed_at: created_at,
      image_analysis: {
        grass_type: sub?.grass_type,
        problem_areas: [],
        overall_health: ares?.healthScore ?? 5,
        dominant_colors: [],
        texture_analysis: '',
        visual_features: [],
        similarity_hash: ''
      },
      similar_cases: [],
      learning_confidence: ares?.confidence ?? 0.5,
      reddit_data: {}
    };

    const ud: UserDiagnostic = {
      id,
      user_email: sub?.user_email || 'unknown@email.com',
      user_name: sub?.user_name,
      user_phone: sub?.user_phone,
      image_url: getSubmissionImage(sub),
      image_path: sub?.image_filename || sub?.image_path,
      problem_description: sub?.problem_description,
      grass_type: sub?.grass_type,
      location: sub?.location,
      season: sub?.season,
      created_at,
      admin_reviewed: !!sub?.admin_reviewed,
      admin_notes: sub?.admin_notes,
      flagged_for_review: !!sub?.flagged_for_review,
      review_reason: sub?.review_reason,
      analysis,
      similar_cases: [],
      // @ts-ignore keep where it came from for updates
      __storeKey: sub?.__storeKey
    };

    return ud;
  } catch {
    return null;
  }
};

// update a submission wherever it lives (by id) and save
const updateSubmissionInStorage = (submissionId: string, mutator: (s: any) => any) => {
  const data = getLocalData();
  let updated = false;

  for (const key of SUBMISSION_KEYS) {
    const arr = safeArr<any>(data[key]);
    if (arr.length) {
      const next = arr.map((s) => (String(s?.id) === String(submissionId) ? mutator(s) : s));
      const changed = next.some((s, i) => s !== arr[i]);
      if (changed) {
        (data as any)[key] = next;
        updated = true;
      }
    }
  }

  // fallback to legacy `submissions`
  if (!updated) {
    const arr = safeArr<any>(data.submissions);
    const next = arr.map((s) => (String(s?.id) === String(submissionId) ? mutator(s) : s));
    const changed = next.some((s, i) => s !== arr[i]);
    if (changed) {
      (data as any).submissions = next;
      updated = true;
    }
  }

  if (updated) saveLocalData(data);
};

/* ---------------------- Styling helpers ---------------------- */
const getUrgencyColor = (urgency?: string) => {
  switch (urgency) {
    case 'high': return 'text-red-600 bg-red-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};
const getHealthColor = (score?: number) => {
  const s = valOr<number>(score, 0);
  if (s >= 7) return 'text-green-600';
  if (s >= 4) return 'text-yellow-600';
  return 'text-red-600';
};

/* ---------------------- Category helpers ---------------------- */
const toTitle = (s?: string) =>
  s ? s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : undefined;

const CategoryChips: React.FC<{ category?: string; subcategory?: string }> = ({ category, subcategory }) => {
  if (!category && !subcategory) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {category && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {toTitle(category)}
        </span>
      )}
      {subcategory && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white border text-gray-700">
          {toTitle(subcategory)}
        </span>
      )}
    </div>
  );
};

/* ---------------------- Email Contact Interface ---------------------- */
interface EmailContact {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  location?: string;
  grass_type?: string;
  season?: string;
  problem_description?: string;
  created_at: string;
  flagged_for_review: boolean;
  admin_reviewed: boolean;
  has_image: boolean;
  submission_type: 'analysis' | 'review' | 'unknown';
}

/* ---------------------- Small EmptyTab ---------------------- */
const EmptyTab: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="p-12 flex flex-col items-center justify-center text-center">
    <div className="mb-4 opacity-60">{icon}</div>
    <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
    <p className="text-sm text-gray-600 mt-1">{text}</p>
  </div>
);

/* ---------------------- Component ---------------------- */
const AdminDashboard: React.FC = () => {
  const [analyses, setAnalyses] = useState<LawnAnalysis[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<UserDiagnostic[]>([]);
  const [emailContacts, setEmailContacts] = useState<EmailContact[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LawnAnalysis>>({});
  const [activeTab, setActiveTab] = useState<'reddit' | 'user-submissions' | 'email-collection'>('reddit');
  const [lightbox, setLightbox] = useState<{ src: string; alt?: string } | null>(null);
  const [emailFilter, setEmailFilter] = useState<'all' | 'unreviewed' | 'flagged' | 'with-phone'>('all');
  const [emailSearch, setEmailSearch] = useState('');

  const [stats, setStats] = useState<CollectionStats>({
    total_posts: 0,
    analyzed_posts: 0,
    lawn_posts: 0,
    non_lawn_posts: 0,
    last_collection: new Date().toISOString(),
    analysis_progress: 0
  });

  // track which submissions already added to training
  const [trainingAdded, setTrainingAdded] = useState<Set<string>>(new Set());

  const location = useLocation();
  const navigate = useNavigate();

  /* ---------------------- Load data ---------------------- */
  useEffect(() => {
    try {
      loadLocalData();
    } catch (e) {
      console.error('Failed to load admin dashboard data:', e);
      setAnalyses([]);
      setUserSubmissions([]);
      setEmailContacts([]);
      setStats({
        total_posts: 0,
        analyzed_posts: 0,
        lawn_posts: 0,
        non_lawn_posts: 0,
        last_collection: new Date().toISOString(),
        analysis_progress: 0
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional: auto-refresh every 5s
  useEffect(() => {
    const id = setInterval(() => {
      try {
        loadLocalData();
      } catch (e) {
        console.error('Auto-refresh failed:', e);
      }
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh + open tab when redirected from a submission (and clean URL)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') || (location.hash || '').replace('#', '');

    if (tabParam === 'user-submissions') setActiveTab('user-submissions');
    if (tabParam === 'reddit') setActiveTab('reddit');
    if (tabParam === 'email-collection') setActiveTab('email-collection');

    if (params.get('justSubmitted') === '1') {
      loadLocalData();
      params.delete('justSubmitted');
      navigate({ search: `?${params.toString()}` }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.hash]);

  // Realtime: same-tab event + cross-tab storage event
  useEffect(() => {
    const onCustom: EventListener = () => {
      loadLocalData();
      // auto-switch to the submissions tab if we're already on the dashboard
      setActiveTab('user-submissions');
      // ensure URL reflects the tab
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'user-submissions');
      navigate({ search: `?${url.searchParams.toString()}` }, { replace: false });
    };
    window.addEventListener('user-submission-created', onCustom);

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      const watched = new Set(['submissions', 'user_submissions', 'analysis_requests', 'uploads']);
      if (watched.has(e.key)) {
        loadLocalData();
        setActiveTab('user-submissions');
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('user-submission-created', onCustom);
      window.removeEventListener('storage', onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureProductIds = (list: ProductMention[] | undefined, ownerId: string) =>
    safeArr<ProductMention>(list).map((p, idx) => ({
      ...p,
      id: p?.id || `${ownerId}_prod_${idx}`
    }));

  const loadLocalData = () => {
    const localData = getLocalData();
    const analyzedPosts = safeArr<any>(localData.analyzed_posts);

    // load existing training ids so we can show "Added"
    const added = new Set<string>();
    for (const t of safeArr<any>(localData.training_data)) {
      if (t?.from_submission) added.add(String(t.from_submission));
    }
    setTrainingAdded(added);

    let redditAnalyses: LawnAnalysis[] = [];
    if (analyzedPosts.length > 0) {
      redditAnalyses = analyzedPosts
        .map((a: any) => {
          try {
            const health = (a as any).healthScore ?? a.health_score ?? 5;
            const root_cause_category = a.root_cause_category || a.category || undefined;
            const root_cause_subcategory = a.root_cause_subcategory || a.primary_issue || undefined;

            const id = a.id || `analysis_${Math.random().toString(36).slice(2)}`;
            const base: LawnAnalysis = {
              id,
              post_id: a.post_id || a.reddit_id || a.id || 'unknown',
              is_lawn: a.is_lawn ?? true,
              root_cause: a.root_cause || 'No analysis available',
              solutions: safeArr<string>(a.solutions),
              recommendations: safeArr<string>(a.recommendations),
              products_mentioned: ensureProductIds(a.products_mentioned, id),
              confidence_level: a.confidence_level || 'medium',
              health_score: health,
              weed_percentage: a.weed_percentage ?? 0,
              treatment_urgency: a.treatment_urgency || 'medium',
              analyzed_at: a.analyzed_at || new Date().toISOString(),
              image_analysis: a.image_analysis || {
                grass_type: undefined,
                problem_areas: [],
                overall_health: health,
                dominant_colors: [],
                texture_analysis: '',
                visual_features: [],
                similarity_hash: ''
              },
              similar_cases: safeArr<any>(a.similar_cases),
              learning_confidence: a.learning_confidence ?? 0.5,
              reddit_data: a.reddit_data || {}
            };

            return {
              ...base,
              root_cause_category,
              root_cause_subcategory
            } as LawnAnalysis & { root_cause_category?: string; root_cause_subcategory?: string };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as LawnAnalysis[];
    } else {
      // Fallback to raw Reddit data
      redditAnalyses = safeArr<any>(localData.reddit_analyses)
        .slice(0, 10)
        .map((post: any) => {
          try {
            const id = post.id || `post_${Math.random().toString(36).slice(2)}`;
            return {
              id,
              post_id: post.id || 'unknown',
              is_lawn: true,
              root_cause: `Reddit post: ${post.title || 'Untitled'} (Not yet analyzed)`,
              solutions: [],
              recommendations: [],
              products_mentioned: ensureProductIds([], id),
              confidence_level: 'low' as const,
              health_score: 5,
              weed_percentage: 0,
              treatment_urgency: 'medium' as const,
              analyzed_at: post.created_utc
                ? new Date(post.created_utc * 1000).toISOString()
                : new Date().toISOString(),
              image_analysis: {
                grass_type: undefined,
                problem_areas: [],
                overall_health: 5,
                dominant_colors: [],
                texture_analysis: '',
                visual_features: [],
                similarity_hash: ''
              },
              similar_cases: [],
              learning_confidence: 0.5,
              reddit_data: post
            } as LawnAnalysis;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as LawnAnalysis[];
    }

    setAnalyses(redditAnalyses);

    // submissions -> UserDiagnostic (tolerant)
    const submissions = pickSubmissionArray(localData)
      .map(normalizeUserSubmission)
      .filter(Boolean) as UserDiagnostic[];

    setUserSubmissions(submissions);

    // Extract email contacts from submissions
    const contacts: EmailContact[] = submissions
      .filter(sub => sub.user_email && sub.user_email !== 'unknown@email.com')
      .map(sub => ({
        id: sub.id,
        email: sub.user_email,
        name: sub.user_name,
        phone: sub.user_phone,
        location: sub.location,
        grass_type: sub.grass_type,
        season: sub.season,
        problem_description: sub.problem_description,
        created_at: sub.created_at,
        flagged_for_review: sub.flagged_for_review || false,
        admin_reviewed: sub.admin_reviewed || false,
        has_image: !!(sub.image_url || sub.image_path),
        submission_type: sub.flagged_for_review ? 'review' : 'analysis'
      }));

    setEmailContacts(contacts);

    // stats
    const totalPosts = safeArr(localData.reddit_analyses).length;
    const analyzedCount = analyzedPosts.length;
    const progress = totalPosts > 0 ? Math.round((analyzedCount / totalPosts) * 100) : 0;
    const newestSubmissionTs = submissions.reduce((max, s) => Math.max(max, new Date(s.created_at || 0).getTime()), 0);

    setStats({
      total_posts: totalPosts,
      analyzed_posts: analyzedCount,
      lawn_posts: submissions.length,
      non_lawn_posts: 0,
      last_collection: newestSubmissionTs ? new Date(newestSubmissionTs).toISOString() : new Date().toISOString(),
      analysis_progress: progress
    });
  };

  /* ---------------------- Persistence helpers ---------------------- */
  const persistAnalyses = (next: LawnAnalysis[]) => {
    const data = getLocalData();
    data.analyzed_posts = next.map((a) => ({
      ...a,
      root_cause_category: (a as any).root_cause_category,
      root_cause_subcategory: (a as any).root_cause_subcategory
    }));
    saveLocalData(data);
  };

  /* ---------------------- Actions for Submissions ---------------------- */
  const markAsReviewed = (submissionId: string, notes?: string) => {
    updateSubmissionInStorage(submissionId, (s) => ({
      ...s,
      admin_reviewed: true,
      admin_notes: notes ?? s.admin_notes
    }));

    setUserSubmissions((prev) =>
      prev.map((u) => (u.id === submissionId ? { ...u, admin_reviewed: true, admin_notes: notes } : u))
    );

    // Update email contacts too
    setEmailContacts((prev) =>
      prev.map((c) => (c.id === submissionId ? { ...c, admin_reviewed: true } : c))
    );
  };

  const addToTrainingData = (submissionId: string) => {
    if (trainingAdded.has(submissionId)) return;

    const data = getLocalData();
    const combined = pickSubmissionArray(data);
    const found = combined.find((s) => String(s?.id) === String(submissionId));
    if (!found) return;

    const training = safeArr<any>(data.training_data);
    training.push({
      id: `train_${submissionId}`,
      created_at: new Date().toISOString(),
      from_submission: submissionId,
      analysis: found.analysis_result || found.analysis || null,
      image: getSubmissionImage(found) || null,
      meta: {
        problem_description: found.problem_description,
        grass_type: found.grass_type,
        location: found.location,
        season: found.season
      }
    });
    saveLocalData({ ...data, training_data: training });

    setTrainingAdded((prev) => new Set(prev).add(submissionId));
  };

  /* ---------------------- Email utilities ---------------------- */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

const exportEmails = () => {
  // Escape values that may contain commas/quotes/newlines
  const escapeCSV = (v: unknown) => {
    if (v === undefined || v === null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };

  const header = 'Email,Name,Phone,Location,Grass Type,Season,Created At,Reviewed,Flagged,Has Image,Type';

  const rows = filteredEmailContacts.map(contact =>
    [
      contact.email,
      contact.name || '',
      contact.phone || '',
      contact.location || '',
      contact.grass_type || '',
      contact.season || '',
      new Date(contact.created_at).toLocaleDateString(),
      contact.admin_reviewed ? 'Yes' : 'No',
      contact.flagged_for_review ? 'Yes' : 'No',
      contact.has_image ? 'Yes' : 'No',
      contact.submission_type
    ]
      .map(escapeCSV)
      .join(',')
  );

  const csvContent = [header, ...rows].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM helps Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `email_contacts_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


  /* ---------------------- Sorts & Filters ---------------------- */
  const sortedAnalyses = useMemo(() => {
    return [...analyses].sort((a, b) => {
      const da = new Date(a.analyzed_at || 0).getTime();
      const db = new Date(b.analyzed_at || 0).getTime();
      return db - da;
    });
  }, [analyses]);

  const sortedUserSubmissions = useMemo(() => {
    return [...userSubmissions].sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return db - da;
    });
  }, [userSubmissions]);

  const filteredEmailContacts = useMemo(() => {
    let filtered = [...emailContacts];

    // Apply filter
    switch (emailFilter) {
      case 'unreviewed':
        filtered = filtered.filter(c => !c.admin_reviewed);
        break;
      case 'flagged':
        filtered = filtered.filter(c => c.flagged_for_review);
        break;
      case 'with-phone':
        filtered = filtered.filter(c => c.phone);
        break;
    }

    // Apply search
    if (emailSearch) {
      const search = emailSearch.toLowerCase();
      filtered = filtered.filter(c =>
        c.email.toLowerCase().includes(search) ||
        c.name?.toLowerCase().includes(search) ||
        c.location?.toLowerCase().includes(search) ||
        c.grass_type?.toLowerCase().includes(search)
      );
    }

    // Sort by most recent
    return filtered.sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return db - da;
    });
  }, [emailContacts, emailFilter, emailSearch]);

  /* ---------------------- Edit handlers ---------------------- */
  const handleEdit = (analysis: LawnAnalysis) => {
    setEditingId(analysis.id);
    setEditForm(analysis);
  };

  const handleSave = () => {
    if (!editingId) return;

    if (activeTab === 'reddit') {
      setAnalyses((prev) => {
        const next = prev.map((a) => (a.id === editingId ? { ...a, ...editForm } : a));
        persistAnalyses(next);
        return next;
      });
    } else {
      // update UI state for user submission analyses
      setUserSubmissions((prev) =>
        prev.map((sub) =>
          sub.analysis.id === editingId ? { ...sub, analysis: { ...sub.analysis, ...editForm } } : sub
        )
      );

      // persist to whichever bucket the submission is in
      updateSubmissionInStorage(editingId, (s) => {
        const ar = s.analysis_result || s.analysis || {};
        const patched = {
          ...s,
          analysis_result: {
            ...ar,
            rootCause: editForm.root_cause ?? ar.rootCause,
            solutions: Array.isArray(editForm.solutions) ? editForm.solutions : ar.solutions,
            products: Array.isArray(editForm.products_mentioned)
              ? editForm.products_mentioned.map((p: any) => ({
                  name: p?.name,
                  category: p?.category,
                  affiliateLink: p?.affiliate_link,
                  confidence: p?.confidence,
                  context: p?.context
                }))
              : ar.products
          }
        };

        // also mirror under `analysis` if that was the original key
        if (s.analysis) {
          (patched as any).analysis = {
            ...s.analysis,
            rootCause: editForm.root_cause ?? s.analysis.rootCause,
            solutions: Array.isArray(editForm.solutions) ? editForm.solutions : s.analysis.solutions,
            products: Array.isArray(editForm.products_mentioned)
              ? editForm.products_mentioned.map((p: any) => ({
                  name: p?.name,
                  category: p?.category,
                  affiliateLink: p?.affiliate_link,
                  confidence: p?.confidence,
                  context: p?.context
                }))
              : s.analysis.products
          };
        }

        return patched;
      });
    }

    setEditingId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  /* ---------------------- Products / affiliate persistence ---------------------- */
  const updateAffiliateLink = (analysisId: string, productId: string, link: string) => {
    if (activeTab === 'reddit') {
      setAnalyses((prev) => {
        const next = prev.map((a) =>
          a.id === analysisId
            ? {
                ...a,
                products_mentioned: safeArr(a.products_mentioned).map((p) =>
                  (p.id || '') === productId ? { ...p, affiliate_link: link } : p
                )
              }
            : a
        );
        persistAnalyses(next);
        return next;
      });
    } else {
      // update UI state
      setUserSubmissions((prev) =>
        prev.map((sub) =>
          sub.analysis.id === analysisId
            ? {
                ...sub,
                analysis: {
                  ...sub.analysis,
                  products_mentioned: safeArr(sub.analysis.products_mentioned).map((p, i) =>
                    (p.id || `${analysisId}_product_${i}`) === productId ? { ...p, affiliate_link: link } : p
                  )
                }
              }
            : sub
        )
      );

      // persist to storage (handles any bucket)
      updateSubmissionInStorage(analysisId, (s) => {
        const ar = s.analysis_result || s.analysis || {};
        let products = safeArr<any>(ar.products);

        // try to parse index out of id pattern `${id}_product_${idx}`
        const m = String(productId).match(/_product_(\d+)$/);
        if (m) {
          const idx = Number(m[1]);
          products = products.map((prod: any, i: number) => (i === idx ? { ...prod, affiliateLink: link } : prod));
        } else {
          // fallback: update all products if we can't match by index (best-effort)
          products = products.map((prod: any) => ({ ...prod, affiliateLink: link }));
        }

        const patched = {
          ...s,
          analysis_result: { ...ar, products }
        };

        if (s.analysis) {
          (patched as any).analysis = { ...ar, products };
        }

        return patched;
      });
    }
  };

  /* ---------------------- Render ---------------------- */
  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Reddit Posts"
          value={stats.total_posts.toLocaleString()}
          icon={<Database className="w-8 h-8 text-blue-600" />}
          note="Local development mode"
        />
        <StatCard
          title="User Submissions"
          value={userSubmissions.length.toLocaleString()}
          icon={<Users className="w-8 h-8 text-purple-600" />}
          note={`${userSubmissions.filter((s) => !s.admin_reviewed).length} pending review`}
        />
        <StatCard
          title="Email Contacts"
          value={emailContacts.length.toLocaleString()}
          icon={<Mail className="w-8 h-8 text-green-600" />}
          note={`${emailContacts.filter((c) => !c.admin_reviewed).length} unreviewed`}
        />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.analyzed_posts.toLocaleString()}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.analysis_progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 mt-1">{stats.analysis_progress}% complete</span>
          </div>
        </div>
      </div>

      {/* Local Dev Tools */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Local Development Tools</h3>
        </div>
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={loadLocalData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
          <button
            onClick={exportDataAsJSON}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <InfoPill color="blue" title="Data Storage" text="All data saved in browser localStorage" />
          <InfoPill color="green" title="Images" text="Images stored as base64 data URLs" />
          <InfoPill color="purple" title="AI Analysis" text="Results shown below after processing" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('reddit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reddit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Reddit Analysis ({sortedAnalyses.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('user-submissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'user-submissions'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>User Submissions ({sortedUserSubmissions.length})</span>
                {sortedUserSubmissions.filter((sub) => !sub.admin_reviewed).length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {sortedUserSubmissions.filter((sub) => !sub.admin_reviewed).length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('email-collection')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'email-collection'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email Collection ({emailContacts.length})</span>
                {emailContacts.filter((c) => !c.admin_reviewed).length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {emailContacts.filter((c) => !c.admin_reviewed).length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="divide-y divide-gray-200">
          {activeTab === 'email-collection' ? (
            <div className="p-6">
              {/* Email Collection Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Email Collection</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage and review collected email addresses from user submissions
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={exportEmails}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(filteredEmailContacts.map(c => c.email).join(', '))}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy All Emails</span>
                  </button>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                  <select
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">All Contacts ({emailContacts.length})</option>
                    <option value="unreviewed">Unreviewed ({emailContacts.filter(c => !c.admin_reviewed).length})</option>
                    <option value="flagged">Flagged for Review ({emailContacts.filter(c => c.flagged_for_review).length})</option>
                    <option value="with-phone">With Phone Number ({emailContacts.filter(c => c.phone).length})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    placeholder="Search by email, name, location..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email Collection Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-900">{emailContacts.length}</div>
                  <div className="text-sm text-blue-600">Total Contacts</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900">{emailContacts.filter(c => c.admin_reviewed).length}</div>
                  <div className="text-sm text-green-600">Reviewed</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-900">{emailContacts.filter(c => c.flagged_for_review).length}</div>
                  <div className="text-sm text-orange-600">Flagged</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900">{emailContacts.filter(c => c.phone).length}</div>
                  <div className="text-sm text-purple-600">With Phone</div>
                </div>
              </div>

              {/* Email Table */}
              {filteredEmailContacts.length === 0 ? (
                <EmptyTab
                  icon={<Mail className="w-8 h-8 text-gray-400" />}
                  title="No email contacts found"
                  text="Email addresses will appear here when users submit lawn photos."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submission Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEmailContacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">{contact.email}</span>
                                <button
                                  onClick={() => copyToClipboard(contact.email)}
                                  className="text-gray-400 hover:text-gray-600"
                                  title="Copy email"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              {contact.name && (
                                <div className="flex items-center space-x-2">
                                  <Users className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">{contact.name}</span>
                                </div>
                              )}
                              {contact.phone && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">{contact.phone}</span>
                                  <button
                                    onClick={() => copyToClipboard(contact.phone)}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Copy phone"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              {contact.location && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">{contact.location}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {new Date(contact.created_at).toLocaleDateString()} at{' '}
                                  {new Date(contact.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                              {contact.grass_type && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Grass:</span> {contact.grass_type}
                                </div>
                              )}
                              {contact.season && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Season:</span> {contact.season}
                                </div>
                              )}
                              {contact.problem_description && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Problem:</span>{' '}
                                  {contact.problem_description.length > 100
                                    ? `${contact.problem_description.substring(0, 100)}...`
                                    : contact.problem_description}
                                </div>
                              )}
                              <div className="flex items-center space-x-3 mt-2">
                                {contact.has_image && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <ImageIcon className="w-3 h-3 mr-1" />
                                    Has Image
                                  </span>
                                )}
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    contact.submission_type === 'review'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {contact.submission_type === 'review' ? 'Expert Review' : 'AI Analysis'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {contact.admin_reviewed ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Reviewed
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </span>
                              )}
                              {contact.flagged_for_review && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Flagged
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {!contact.admin_reviewed && (
                                <button
                                  onClick={() => markAsReviewed(contact.id, 'Email contact reviewed')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Mark as reviewed"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => copyToClipboard(`${contact.name || 'Contact'} <${contact.email}>`)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Copy contact info"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <a
                                href={`mailto:${contact.email}?subject=Lawn Analysis Follow-up`}
                                className="text-purple-600 hover:text-purple-900"
                                title="Send email"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'reddit' && sortedAnalyses.length === 0 ? (
            <EmptyTab
              icon={<Database className="w-8 h-8 text-gray-400" />}
              title="No Reddit analyses yet"
              text="Start collecting data from Reddit to see analyses here."
            />
          ) : activeTab === 'user-submissions' && sortedUserSubmissions.length === 0 ? (
            <EmptyTab
              icon={<Users className="w-8 h-8 text-gray-400" />}
              title="No user submissions yet"
              text="User submissions will appear here when users upload lawn photos."
            />
          ) : activeTab === 'reddit' ? (
            sortedAnalyses.map((analysis, index) => {
              const health = (analysis as any).healthScore ?? analysis.health_score;
              const rdImg = getRedditImageFromData((analysis as any).reddit_data);
              const cat = (analysis as any).root_cause_category as string | undefined;
              const sub = (analysis as any).root_cause_subcategory as string | undefined;

              return (
                <div key={`${analysis.id}-${index}`} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">Post ID: {analysis.post_id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(analysis.treatment_urgency)}`}>
                          {analysis.treatment_urgency} urgency
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className={`w-4 h-4 ${getHealthColor(health)}`} />
                          <span className={`text-sm font-medium ${getHealthColor(health)}`}>{health}/10</span>
                        </div>
                      </div>

                      <CategoryChips category={cat} subcategory={sub} />

                      {editingId === analysis.id ? (
                        <EditBlock editForm={editForm} setEditForm={setEditForm} onSave={handleSave} onCancel={handleCancel} />
                      ) : (
                        <DisplayBlock
                          root_cause={analysis.root_cause}
                          solutions={analysis.solutions}
                        />
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {editingId === analysis.id ? null : (
                        <button
                          onClick={() => handleEdit(analysis)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {rdImg && <Thumb src={rdImg} alt="Source image" onClick={() => setLightbox({ src: rdImg, alt: 'Image' })} />}

                    {safeArr<ProductMention>(analysis.products_mentioned).length > 0 && (
                      <Products
                        analysisId={analysis.id}
                        products={safeArr(analysis.products_mentioned)}
                        onChangeLink={updateAffiliateLink}
                      />
                    )}
                  </div>

                  {analysis.image_analysis && (
                    <ImageSummary
                      grass={analysis.image_analysis.grass_type}
                      weedPct={analysis.weed_percentage}
                      problemAreas={safeArr(analysis.image_analysis.problem_areas).length}
                    />
                  )}
                </div>
              );
            })
          ) : (
            sortedUserSubmissions.map((submission, index) => {
              const a = submission.analysis;
              const health = (a as any).healthScore ?? a.health_score;
              const subImg = submission.image_url || submission.image_path || (submission as any).image_data || null;
              const isReviewed = !!submission.admin_reviewed;
              const isTrainingAdded = trainingAdded.has(submission.id);

              return (
                <div key={`${submission.id}-${index}`} className="p-6">
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <ImageIcon className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-900">User Submission</span>
                        <span className="text-sm text-purple-600">{new Date(submission.created_at).toLocaleDateString()}</span>
                        <span className="text-sm text-purple-600">{submission.user_email}</span>
                        {!isReviewed && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Needs Review</span>
                        )}
                        {isReviewed && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Reviewed</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isTrainingAdded ? (
                          <button
                            onClick={() => addToTrainingData(submission.id)}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Add to Training
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
                            Added ✓
                          </span>
                        )}
                        {!isReviewed ? (
                          <button
                            onClick={() => markAsReviewed(submission.id, 'Reviewed by admin')}
                            className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Mark Reviewed
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1.5 bg-gray-100 text-gray-500 text-sm rounded-lg cursor-not-allowed"
                          >
                            Reviewed
                          </button>
                        )}
                      </div>
                    </div>

                    {subImg && (
                      <Thumb src={subImg} alt="User submission" onClick={() => setLightbox({ src: subImg, alt: 'Image' })} />
                    )}

                    {(submission.user_name || submission.user_phone) && (
                      <div className="mb-3 p-3 bg-white rounded-lg border border-purple-200">
                        <h5 className="text-sm font-medium text-purple-900 mb-1">Contact Information:</h5>
                        <div className="text-sm text-purple-800 space-y-1">
                          {submission.user_name && <div>Name: {submission.user_name}</div>}
                          {submission.user_phone && <div>Phone: {submission.user_phone}</div>}
                          <div>Email: {submission.user_email}</div>
                        </div>
                      </div>
                    )}

                    {(submission.problem_description || a?.root_cause) && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                        <h5 className="text-sm font-medium text-purple-900 mb-1">Problem Description:</h5>
                        <p className="text-sm text-purple-800">
                          {submission.problem_description || a?.root_cause || 'No description provided'}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {(submission.grass_type || a?.image_analysis?.grass_type) && (
                        <div className="p-2 bg-white rounded border border-purple-200">
                          <span className="text-purple-700 font-medium">Grass Type:</span>
                          <span className="ml-1 text-purple-900">
                            {submission.grass_type || a?.image_analysis?.grass_type}
                          </span>
                        </div>
                      )}
                      {submission.location && (
                        <div className="p-2 bg-white rounded border border-purple-200">
                          <span className="text-purple-700 font-medium">Location:</span>
                          <span className="ml-1 text-purple-900">{submission.location}</span>
                        </div>
                      )}
                      {submission.season && (
                        <div className="p-2 bg-white rounded border border-purple-200">
                          <span className="text-purple-700 font-medium">Season:</span>
                          <span className="ml-1 text-purple-900">{submission.season}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">Analysis ID: {a.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(a.treatment_urgency)}`}>
                          {a.treatment_urgency} urgency
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className={`w-4 h-4 ${getHealthColor(health)}`} />
                          <span className={`text-sm font-medium ${getHealthColor(health)}`}>{health}/10</span>
                        </div>
                      </div>

                      <CategoryChips
                        category={(a as any).root_cause_category}
                        subcategory={(a as any).root_cause_subcategory}
                      />

                      {editingId === a.id ? (
                        <EditBlock editForm={editForm} setEditForm={setEditForm} onSave={handleSave} onCancel={handleCancel} />
                      ) : (
                        <DisplayBlock
                          root_cause={a.root_cause}
                          solutions={a.solutions}
                        />
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {editingId === a.id ? null : (
                        <button
                          onClick={() => handleEdit(a)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {safeArr<ProductMention>(a.products_mentioned).length > 0 && (
                    <Products
                      analysisId={a.id}
                      products={safeArr(a.products_mentioned)}
                      onChangeLink={updateAffiliateLink}
                    />
                  )}

                  {a.image_analysis && (
                    <ImageSummary
                      grass={a.image_analysis.grass_type}
                      weedPct={a.weed_percentage}
                      problemAreas={safeArr(a.image_analysis.problem_areas).length}
                    />
                  )}

                  <div className="mt-4 flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-4 text-sm">
                      {submission.flagged_for_review && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Flagged for Review</span>
                      )}
                      {submission.admin_reviewed && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Reviewed</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-5xl max-h-[85vh]">
            <img
              src={lightbox.src}
              alt={lightbox.alt || 'Preview'}
              className="max-h-[85vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow hover:bg-gray-100" onClick={() => setLightbox(null)}>
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------------- Subcomponents ---------------------- */

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; note?: string }> = ({ title, value, icon, note }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      {icon}
    </div>
    {note && <div className="mt-4 flex items-center text-sm text-gray-600">{note}</div>}
  </div>
);

const InfoPill: React.FC<{ color: 'blue' | 'green' | 'purple'; title: string; text: string }> = ({ color, title, text }) => {
  const colors = color === 'blue' ? 'bg-blue-50 text-blue-700' : color === 'green' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700';
  const titleColor = color === 'blue' ? 'text-blue-900' : color === 'green' ? 'text-green-900' : 'text-purple-900';
  return (
    <div className={`p-3 rounded-lg ${colors}`}>
      <p className={`font-medium ${titleColor}`}>{title}</p>
      <p>{text}</p>
    </div>
  );
};

const EditBlock: React.FC<{
  editForm: Partial<LawnAnalysis>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<LawnAnalysis>>>;
  onSave: () => void;
  onCancel: () => void;
}> = ({ editForm, setEditForm, onSave, onCancel }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Root Cause</label>
      <textarea
        value={editForm.root_cause || ''}
        onChange={(e) => setEditForm((prev) => ({ ...prev, root_cause: e.target.value }))}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={2}
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Solutions</label>
      <textarea
        value={safeArr<string>(editForm.solutions).join('\n')}
        onChange={(e) => setEditForm((prev) => ({ ...prev, solutions: e.target.value.split('\n') }))}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={3}
        placeholder="Enter each solution on a new line"
      />
    </div>
    <div className="flex items-center space-x-2">
      <button onClick={onSave} className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
        <Save className="w-4 h-4" />
        <span>Save</span>
      </button>
      <button onClick={onCancel} className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
        <X className="w-4 h-4" />
        <span>Cancel</span>
      </button>
    </div>
  </div>
);

const DisplayBlock: React.FC<{ root_cause?: string; solutions?: string[] }> = ({
  root_cause,
  solutions
}) => (
  <div className="space-y-3">
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-1">Root Cause</h4>
      <p className="text-sm text-gray-700">{root_cause || 'No root cause identified'}</p>
    </div>
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-1">Solutions</h4>
      {safeArr<string>(solutions).length > 0 ? (
        <ul className="text-sm text-gray-700 space-y-1">
          {safeArr<string>(solutions).map((solution, idx) => (
            <li key={`sol-${idx}`} className="flex items-start space-x-2">
              <span className="text-green-600 mt-1">•</span>
              <span>{solution}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No solutions identified</p>
      )}
    </div>
  </div>
);

const Products: React.FC<{
  analysisId: string;
  products: ProductMention[];
  onChangeLink: (analysisId: string, productId: string, link: string) => void;
}> = ({ analysisId, products, onChangeLink }) => (
  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
    <h4 className="text-sm font-medium text-gray-900 mb-3">Products Mentioned</h4>
    <div className="space-y-3">
      {products.map((product, i) => (
        <div key={`${product.id || i}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-gray-900">{product.name}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{product.category}</span>
              <span className="text-sm text-gray-500">{Math.round((product.confidence || 0) * 100)}% confidence</span>
            </div>
            {product.context && <p className="text-sm text-gray-600 mt-1">{product.context}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="url"
              placeholder="Affiliate link"
              value={product.affiliate_link || ''}
              onChange={(e) => onChangeLink(analysisId, product.id || `${analysisId}_product_${i}`, e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {product.affiliate_link && (
              <a href={product.affiliate_link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-600 hover:text-blue-800">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ImageSummary: React.FC<{ grass?: string; weedPct?: number; problemAreas?: number }> = ({ grass, weedPct, problemAreas }) => (
  <div className="mt-4 p-4 bg-green-50 rounded-lg">
    <h4 className="text-sm font-medium text-gray-900 mb-2">Image Analysis</h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <div><span className="text-gray-600">Grass Type:</span><span className="ml-2 font-medium">{grass || 'Unknown'}</span></div>
      <div><span className="text-gray-600">Weed Coverage:</span><span className="ml-2 font-medium">{valOr<number>(weedPct, 0)}%</span></div>
      <div><span className="text-gray-600">Problem Areas:</span><span className="ml-2 font-medium">{valOr<number>(problemAreas, 0)}</span></div>
    </div>
  </div>
);

const Thumb: React.FC<{ src: string; alt?: string; onClick: () => void }> = ({ src, alt, onClick }) => (
  <button className="relative w-32 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group" onClick={onClick} title="Click to enlarge">
    <img src={src} alt={alt || 'thumbnail'} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
    <Maximize2 className="absolute right-1.5 bottom-1.5 w-4 h-4 text-white drop-shadow hidden group-hover:block" />
  </button>
);

export default AdminDashboard;
