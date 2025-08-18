// src/components/UserDiagnostic.tsx
import { useState, useRef } from 'react';
import type { ChangeEvent, FC } from 'react';
import { addUserSubmission, LocalUserSubmission } from '../utils/localStorage';
import { performRealAnalysis, RealAnalysisResult } from '../utils/realAnalysis';
import { performMockAnalysis, MockAnalysisResult } from '../utils/mockAnalysis';
import { config } from '../utils/config';
import {
  Upload,
  Camera,
  Brain,
  CheckCircle,
  AlertTriangle,
  Star,
  ShoppingCart,
  ExternalLink,
  Loader,
  Image as ImageIcon,
  Zap,
  LogIn,
  X,
  Calendar,
  Database,
  Users
} from 'lucide-react';

/** ---------- Image helpers to keep storage small & robust ---------- **/

// Downscale a File -> JPEG dataURL
async function compressImage(file: File, opts?: { maxDim?: number; quality?: number }): Promise<string> {
  const maxDim = opts?.maxDim ?? 1600;
  const quality = opts?.quality ?? 0.72;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Re-compress an existing dataURL -> smaller JPEG dataURL
async function compressDataUrl(dataUrl: string, opts?: { maxDim?: number; quality?: number }): Promise<string> {
  const maxDim = opts?.maxDim ?? 1400;
  const quality = opts?.quality ?? 0.68;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

const isQuotaExceeded = (err: unknown) =>
  String(err).includes('QuotaExceededError') || String(err).includes('exceeded the quota');

// Last-resort: prune images from older submissions to free space
function pruneOldSubmissionImages(maxToPrune = 3): boolean {
  try {
    const key = 'lawn_analyzer_data';
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const data = JSON.parse(raw);
    const buckets = ['user_submissions', 'submissions', 'analysis_requests', 'uploads'];

    let pruned = 0;
    for (const b of buckets) {
      const arr = Array.isArray(data?.[b]) ? data[b] : [];
      for (const item of arr) {
        if (pruned >= maxToPrune) break;
        if (!item) continue;
        if (item.image_data || item.image_url || item.image_path || item?.file?.dataURL) {
          delete item.image_data;
          delete item.image_url;
          delete item.image_path;
          if (item.file) delete item.file.dataURL;
          pruned++;
        }
      }
      if (pruned >= maxToPrune) break;
    }

    if (pruned > 0) {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Prune failed:', e);
    return false;
  }
}

// Save with shrink-and-retry + prune fallback to avoid crashes/redirects
async function saveSubmissionWithQuotaHandling(
  submission: LocalUserSubmission,
  setDebug?: (s: string) => void
): Promise<boolean> {
  const note = (s: string) => setDebug && setDebug(s);

  try {
    addUserSubmission(submission);
    return true;
  } catch (e) {
    if (!isQuotaExceeded(e)) {
      console.warn('Save failed (non-quota):', e);
      return false;
    }
  }

  // Ladder of further compression attempts
  const ladder = [
    { maxDim: 1600, q: 0.72 },
    { maxDim: 1400, q: 0.68 },
    { maxDim: 1200, q: 0.64 },
    { maxDim: 1000, q: 0.6 },
    { maxDim: 800, q: 0.6 }
  ];

  for (const step of ladder) {
    try {
      if (submission.image_data) {
        note(`Storage full; compressing image (${step.maxDim}px @ ${Math.round(step.q * 100)}%) and retrying...`);
        const smaller = await compressDataUrl(submission.image_data, { maxDim: step.maxDim, quality: step.q });
        submission.image_data = smaller;
        submission.image_url = smaller;
        submission.image_path = smaller;
        if (submission.file) (submission as any).file.dataURL = smaller;
      }
      addUserSubmission(submission);
      return true;
    } catch (e) {
      if (!isQuotaExceeded(e)) {
        console.warn('Save failed (non-quota) during ladder:', e);
        return false;
      }
    }
  }

  // Prune older images to free space, then one final try
  if (pruneOldSubmissionImages(3)) {
    try {
      note('Freed space by pruning older images; retrying save...');
      addUserSubmission(submission);
      return true;
    } catch (e) {
      console.warn('Save failed even after pruning:', e);
      return false;
    }
  }

  return false;
}

/** ---------- Result normalization ---------- **/

type DiagnosticResult = RealAnalysisResult | MockAnalysisResult;

function normalizeResult(r: any): DiagnosticResult {
  const safeArray = (v: unknown) => (Array.isArray(v) ? v : []);
  const safeNum = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);

  const similarCases = safeArray(r?.similarCases).map((c: any) => ({
    ...c,
    solutions: safeArray(c?.solutions),
    similarity_score: typeof c?.similarity_score === 'number' ? c.similarity_score : 0,
    success_rate: typeof c?.success_rate === 'number' ? c.success_rate : 0
  }));

  const databaseInsights = r?.databaseInsights
    ? {
        totalSimilarCases: safeNum(r.databaseInsights.totalSimilarCases),
        averageSuccessRate: safeNum(r.databaseInsights.averageSuccessRate),
        commonTreatments: safeArray(r.databaseInsights.commonTreatments)
      }
    : { totalSimilarCases: 0, averageSuccessRate: 0, commonTreatments: [] };

  return {
    ...r,
    solutions: safeArray(r?.solutions),
    products: safeArray(r?.products),
    similarCases,
    databaseInsights
  } as DiagnosticResult;
}

/** ---------- Component ---------- **/

const UserDiagnostic: FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [emailPurpose, setEmailPurpose] = useState<'analysis' | 'review'>('analysis');
  const [userNotes, setUserNotes] = useState('');
  const [location, setLocation] = useState('');
  const [grassType, setGrassType] = useState('');
  const [season, setSeason] = useState('');
  const [recentTreatments, setRecentTreatments] = useState('');
  const [petTraffic, setPetTraffic] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // keep the same id for "seed" → "final" update
  const seededIdRef = useRef<string | null>(null);

  // Component-level error (e.g., async errors)
  const [componentError, setComponentError] = useState<string | null>(null);

  // Async wrapper
  const safeAsyncOperation = async (operation: () => Promise<void>, errorMessage: string) => {
    try {
      await operation();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(errorMessage, err);
      setComponentError(`${errorMessage}: ${msg}`);
      setIsAnalyzing(false);
      // do NOT rethrow — avoid breaking the route / navigation
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setDebugInfo('Starting image upload...');
      setComponentError(null);
      const file = event.target.files?.[0];
      if (!file) return;

      setDebugInfo('Compressing image…');
      const compressedDataUrl = await compressImage(file, { maxDim: 1600, quality: 0.72 });
      setUploadedImage(compressedDataUrl);
      setResult(null);
      setError(null);
      setDebugInfo('Image loaded & compressed');
    } catch (err: any) {
      console.error('Image upload error:', err);
      setDebugInfo('Image upload failed: ' + (err?.message ?? String(err)));
      setError('Failed to upload image. Please try again.');
    }
  };

  const handleAnalyze = () => {
    setDebugInfo('Starting analysis process...');
    if (!uploadedImage) return;
    setEmailPurpose('analysis');
    setShowEmailModal(true);
  };

  /** Build a submission object that the AdminDashboard can definitely read */
  const buildSubmission = (overrides: Partial<LocalUserSubmission> = {}): LocalUserSubmission => {
    const id = overrides.id ?? seededIdRef.current ?? Date.now().toString();
    const base: LocalUserSubmission = {
      id,
      user_email: userEmail || 'unknown@email.com',
      user_name: userName || undefined,
      user_phone: userPhone || undefined,
      // include ALL known image fields AdminDashboard can parse
      image_url: uploadedImage || undefined,
      image_data: uploadedImage || undefined,
      image_path: uploadedImage || undefined,
      file: uploadedImage ? ({ dataURL: uploadedImage } as any) : undefined,
      image_filename: overrides.image_filename ?? `lawn_${Date.now()}.jpg`,
      problem_description: userNotes || undefined,
      grass_type: grassType || undefined,
      location: location || undefined,
      season: season || undefined,
      recent_treatments: recentTreatments || undefined,
      pet_traffic: petTraffic || undefined,
      flagged_for_review: false,
      admin_reviewed: false,
      created_at: new Date().toISOString(),
      ...overrides
    };
    return base;
  };

  /** Seed a submission immediately so the Admin dashboard sees it right away (no navigation) */
  const seedSubmissionIfNeeded = async (): Promise<string | null> => {
    if (!uploadedImage) return null;

    const id = seededIdRef.current ?? Date.now().toString();
    const seed: LocalUserSubmission = buildSubmission({
      id,
      analysis_result: {
        rootCause: 'Analysis pending',
        solutions: [],
        products: [],
        confidence: 0.5,
        healthScore: 5,
        urgency: 'medium'
      }
    });

    const saved = await saveSubmissionWithQuotaHandling(seed, setDebugInfo);
    if (saved) {
      // Notify same-tab dashboard
      window.dispatchEvent(new CustomEvent('user-submission-created', { detail: { id } }));
      seededIdRef.current = id;
    } else {
      setError(
        'Your browser storage is full. Please remove older test submissions or try a smaller image.'
      );
    }

    return id;
  };

  const handleEmailSubmit = async () => {
    setDebugInfo('Email submitted, validating...');
    if (!userEmail.trim()) {
      alert('Please enter your email address');
      return;
    }
    setDebugInfo('Email validated, seeding submission and starting analysis...');
    setShowEmailModal(false);

    // Seed now so the dashboard shows the upload immediately (no redirect)
    const id = await seedSubmissionIfNeeded();

    // Continue with analysis (will update the same submission id)
    startAnalysis(id || undefined);
  };

  const startAnalysis = (forcedId?: string) => {
    setDebugInfo('Initializing analysis...');
    setComponentError(null);
    setIsAnalyzing(true);
    setError(null);

    const id = forcedId ?? Date.now().toString();
    const userSubmission: LocalUserSubmission = buildSubmission({ id });

    const useReal = !!config.openai.apiKey;
    const analysisPromise = useReal ? performRealAnalysis(userSubmission) : performMockAnalysis(userSubmission);

    safeAsyncOperation(
      async () => {
        const analysisResult = await analysisPromise;

        setDebugInfo('Analysis completed, processing results...');
        if (!analysisResult || typeof analysisResult !== 'object') {
          setDebugInfo('Invalid analysis result received');
          throw new Error('Invalid analysis result received');
        }

        const normalized = normalizeResult(analysisResult);
        userSubmission.analysis_result = normalized;

        const saved = await saveSubmissionWithQuotaHandling(userSubmission, setDebugInfo);
        if (saved) {
          window.dispatchEvent(
            new CustomEvent('user-submission-created', { detail: { id: userSubmission.id } })
          );
          setDebugInfo(`${useReal ? 'Real' : 'Mock'} analysis complete and saved`);
        } else {
          setError(
            'Could not save analysis due to browser storage limits. The image may be too large.'
          );
        }

        setResult(normalized);
        setIsAnalyzing(false);
      },
      'Analysis failed'
    );
  };

  const handleAdminLogin = () => {
    if (adminCredentials.username.toLowerCase() === 'admin' && adminCredentials.password === 'admin123') {
      localStorage.setItem('isAdminAuthenticated', 'true');
      window.location.href = '/admin';
    } else {
      alert(
        `Invalid credentials. Use username: admin, password: admin123\nYou entered: "${adminCredentials.username}" / "${adminCredentials.password}"`
      );
    }
  };

  const handleFlagForReview = async (reason: string) => {
    if (!userEmail) {
      setEmailPurpose('review');
      setShowEmailModal(true);
      return;
    }

    const id = seededIdRef.current ?? Date.now().toString();

    const flaggedSubmission: LocalUserSubmission = buildSubmission({
      id,
      flagged_for_review: true,
      analysis_result:
        result ?? {
          rootCause: 'Pending expert review',
          solutions: [],
          products: [],
          confidence: 0.4,
          healthScore: 5,
          urgency: 'medium'
        },
      image_filename: `flagged_lawn_${Date.now()}.jpg`
    });

    const saved = await saveSubmissionWithQuotaHandling(flaggedSubmission, setDebugInfo);
    if (saved) {
      window.dispatchEvent(new CustomEvent('user-submission-created', { detail: { id } }));
      seededIdRef.current = id;
      console.log('Flagged for human review and saved locally:', flaggedSubmission);
      alert('Thank you! A lawn care expert will review your case and contact you within 24 hours.');
    } else {
      setError('Could not save your review request due to browser storage limits.');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Safe dev flag (works outside Vite too)
  const isDev = typeof import.meta !== 'undefined' && (import.meta as any)?.env?.DEV;
  const showDebugInfo = !!isDev && !!debugInfo;

  // Error-state screen
  if ((error || componentError) && !isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Lawn Analyzer</h1>
                  <p className="text-xs text-gray-500">AI-Powered Lawn Diagnostics</p>
                </div>
              </div>

              <button
                onClick={() => setShowAdminLogin(true)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Admin Login</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {componentError ? 'Component Error' : 'Analysis Error'}
              </h3>
              <p className="text-gray-600 mb-4">{componentError || error}</p>
              {debugInfo && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg text-left">
                  <p className="text-xs text-gray-600 font-mono">{debugInfo}</p>
                </div>
              )}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setError(null);
                    setComponentError(null);
                    setResult(null);
                    setUploadedImage(null);
                    setDebugInfo('');
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
                <button
                  onClick={() => handleFlagForReview('Analysis error - needs expert review')}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Get Expert Help
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Lawn Analyzer</h1>
                <p className="text-xs text-gray-500">AI-Powered Lawn Diagnostics</p>
              </div>
            </div>

            <button
              onClick={() => setShowAdminLogin(true)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Debug Info (Development Only) */}
      {showDebugInfo && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
            <p className="text-xs text-yellow-800 font-mono">Debug: {debugInfo}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Lawn Diagnostic Tool</h1>
          <p className="text-xl text-gray-600 mb-8">Upload a photo of your lawn for instant AI-powered analysis</p>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Instant AI Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Expert Recommendations</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Product Suggestions</span>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {!uploadedImage ? (
            <div className="text-center">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-16 hover:border-green-400 transition-colors cursor-pointer bg-gray-50 hover:bg-green-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center space-y-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <Camera className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">Upload Your Lawn Photo</h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                      Take a clear photo of your lawn problem area for the most accurate diagnosis. Our AI will analyze it instantly.
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                      <button className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium">
                        <Upload className="w-5 h-5" />
                        <span>Choose Photo</span>
                      </button>
                      <span className="text-gray-400">or drag and drop</span>
                    </div>
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Problem Description */}
              <div className="mt-8 max-w-2xl mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the problem you're seeing
                </label>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  placeholder="e.g., Brown circular patches appeared after heavy rain last week. They're spreading and the grass feels spongy. My dog uses this area daily..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be specific about: when it started, how it's spreading, texture changes, recent weather, pet activity, treatments applied
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span>Best results with natural lighting</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span>Include problem areas clearly</span>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Multiple angles recommended</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Your Lawn Photo</h3>
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    setResult(null);
                    setError(null);
                    setDebugInfo('');
                    setUserNotes('');
                    setLocation('');
                    setGrassType('');
                    setSeason('');
                    setRecentTreatments('');
                    setPetTraffic(false);
                    seededIdRef.current = null;
                  }}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Upload Different Photo
                </button>
              </div>
              <div className="relative">
                <img src={uploadedImage} alt="Uploaded lawn" className="w-full h-80 object-cover rounded-xl" />
                {!result && !isAnalyzing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                    <button
                      onClick={handleAnalyze}
                      className="flex items-center space-x-3 bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-colors font-medium text-lg"
                    >
                      <Brain className="w-6 h-6" />
                      <span>Analyze My Lawn</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Additional Information Form */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grass Type (if known)</label>
                    <select
                      value={grassType}
                      onChange={(e) => setGrassType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select grass type</option>
                      <option value="bermuda">Bermuda</option>
                      <option value="zoysia">Zoysia</option>
                      <option value="st-augustine">St. Augustine</option>
                      <option value="kentucky-bluegrass">Kentucky Bluegrass</option>
                      <option value="tall-fescue">Tall Fescue</option>
                      <option value="fine-fescue">Fine Fescue</option>
                      <option value="perennial-ryegrass">Perennial Ryegrass</option>
                      <option value="centipede">Centipede</option>
                      <option value="buffalo">Buffalo Grass</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Season</label>
                    <select
                      value={season}
                      onChange={(e) => setSeason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select season</option>
                      <option value="spring">Spring</option>
                      <option value="summer">Summer</option>
                      <option value="fall">Fall</option>
                      <option value="winter">Winter</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location/Climate Zone</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Florida, Zone 9a, Pacific Northwest..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recent Treatments</label>
                    <input
                      type="text"
                      value={recentTreatments}
                      onChange={(e) => setRecentTreatments(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Fertilized 2 weeks ago, applied pre-emergent..."
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="petTraffic"
                    checked={petTraffic}
                    onChange={(e) => setPetTraffic(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="petTraffic" className="block text-sm font-medium text-gray-700">
                    This area gets heavy pet traffic
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <Loader className="w-10 h-10 text-green-600 animate-spin" />
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-900">Analyzing Your Lawn...</h3>
                <p className="text-gray-600 mt-2">Our AI is examining your image and comparing it to our database</p>
                {debugInfo && <p className="text-sm text-blue-600 mt-2 font-mono">{debugInfo}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm text-gray-600">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <ImageIcon className="w-5 h-5 text-blue-500" />
                <span>Analyzing image quality...</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                <Brain className="w-5 h-5 text-purple-500" />
                <span>Identifying visual indicators...</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>Applying diagnostic expertise...</span>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-green-500" />
                <span>Generating treatment plan...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-8">
            {/* Diagnosis Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Diagnosis Results</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Star className={`w-6 h-6 ${getHealthColor((result as any).healthScore ?? 5)}`} />
                    <span className={`font-semibold text-lg ${getHealthColor((result as any).healthScore ?? 5)}`}>
                      {(result as any).healthScore ?? 5}/10 Health Score
                    </span>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${getUrgencyColor((result as any).urgency ?? 'medium')}`}
                  >
                    {(result as any).urgency ?? 'medium'} urgency
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-6 bg-blue-50 rounded-xl">
                  <div className="text-3xl font-bold text-blue-900">
                    {(((result as any).confidence ?? 0.5) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-blue-600 font-medium">Confidence</div>
                </div>
                <div className="text-center p-6 bg-green-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-900">
                    {Array.isArray((result as any).similarCases) ? (result as any).similarCases.length : 0}
                  </div>
                  <div className="text-sm text-green-600 font-medium">Similar Cases</div>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-xl">
                  <div className="text-3xl font-bold text-purple-900">
                    {Array.isArray((result as any).solutions) ? (result as any).solutions.length : 0}
                  </div>
                  <div className="text-sm text-purple-600 font-medium">Solutions Found</div>
                </div>
                <div className="text-center p-6 bg-orange-50 rounded-xl">
                  <div className="text-3xl font-bold text-orange-900">
                    {(result as any).databaseInsights?.totalSimilarCases ?? 0}
                  </div>
                  <div className="text-sm text-orange-600 font-medium">Database Matches</div>
                </div>
              </div>

              {/* Database Insights */}
              {(result as any).databaseInsights &&
                (result as any).databaseInsights.totalSimilarCases > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                      <Database className="w-5 h-5" />
                      <span>Database Intelligence</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">Similar Cases:</span>
                        <span className="ml-2 text-blue-900">
                          {(result as any).databaseInsights.totalSimilarCases}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Avg Success Rate:</span>
                        <span className="ml-2 text-blue-900">
                          {Math.round(((result as any).databaseInsights.averageSuccessRate ?? 0) * 100)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Common Treatments:</span>
                        <span className="ml-2 text-blue-900">
                          {Array.isArray((result as any).databaseInsights.commonTreatments)
                            ? (result as any).databaseInsights.commonTreatments.length
                            : 0}
                        </span>
                      </div>
                    </div>
                    {Array.isArray((result as any).databaseInsights.commonTreatments) &&
                      (result as any).databaseInsights.commonTreatments.length > 0 && (
                        <div className="mt-3 text-sm text-blue-800">
                          <strong>Most Effective:</strong>{' '}
                          {(result as any).databaseInsights.commonTreatments.join(', ')}
                        </div>
                      )}
                  </div>
                )}

              <div className="p-6 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Root Cause</h4>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {(result as any).rootCause ?? 'Unable to determine root cause'}
                </p>
              </div>
            </div>

            {/* Similar Cases */}
            {Array.isArray((result as any).similarCases) && (result as any).similarCases.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Similar Cases from Database</h3>
                <div className="space-y-4">
                  {(result as any).similarCases.map((similarCase: any, index: number) => (
                    <div key={similarCase.id ?? index} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-sm font-medium text-gray-900">Case #{index + 1}</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {Math.round((similarCase?.similarity_score ?? 0) * 100)}% match
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {Math.round((similarCase?.success_rate ?? 0) * 100)}% success
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{similarCase?.root_cause ?? ''}</p>
                          {Array.isArray(similarCase?.solutions) && similarCase.solutions.length > 0 && (
                            <div className="text-xs text-gray-600">
                              <strong>Solutions used:</strong> {similarCase.solutions.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </div>
                        {similarCase?.image_path && (
                          <img
                            src={similarCase.image_path}
                            alt="Similar case"
                            className="w-16 h-12 object-cover rounded-lg ml-4"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                  <strong>AI Learning:</strong> This diagnosis was enhanced by analyzing{' '}
                  {Array.isArray((result as any).similarCases) ? (result as any).similarCases.length : 0} similar cases from
                  our database, improving accuracy and treatment recommendations.
                </div>
              </div>
            )}

            {/* Solutions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Recommended Solutions</h3>
              <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-blue-900">Difficulty:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (result as any).difficulty === 'beginner'
                          ? 'bg-green-100 text-green-800'
                          : (result as any).difficulty === 'intermediate'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {(result as any).difficulty ?? 'Beginner'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-blue-900">Cost Estimate:</span>
                    <span className="text-blue-800">{(result as any).costEstimate ?? '$25-75'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-blue-900">Timeline:</span>
                    <span className="text-blue-800">{(result as any).timeline ?? '2-4 weeks'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {Array.isArray((result as any).solutions) &&
                  (result as any).solutions.map((solution: string, index: number) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 text-lg leading-relaxed">{solution}</p>
                    </div>
                  ))}
              </div>

              {/* Follow-up Schedule */}
              <div className="mt-6 p-4 bg-green-50 rounded-xl">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Follow-up Schedule</span>
                </h4>
                <div className="space-y-2 text-sm text-green-800">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">Week 1:</span>
                    <span>Apply initial treatment, monitor daily</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">Week 2:</span>
                    <span>Check for improvement, adjust watering</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">Week 4:</span>
                    <span>Evaluate results, consider follow-up treatment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Recommendations */}
            {Array.isArray((result as any).products) && (result as any).products.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Recommended Products</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(result as any).products.map((product: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{product?.name ?? 'Product'}</h4>
                          <p className="text-sm text-gray-600 mt-1">{product?.category ?? 'General'}</p>
                        </div>
                        <span className="text-2xl font-bold text-green-600">{product?.price ?? '$--'}</span>
                      </div>
                      {product?.affiliateLink && (
                        <a
                          href={product.affiliateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center space-x-2 w-full bg-orange-600 text-white py-3 rounded-xl hover:bg-orange-700 transition-colors font-medium"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          <span>Buy on Amazon</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Was this diagnosis helpful?</h3>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium w-full sm:w-auto">
                  <CheckCircle className="w-5 h-5" />
                  <span>Yes, very helpful</span>
                </button>
                <button className="flex items-center space-x-2 px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors font-medium w-full sm:w-auto">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Somewhat helpful</span>
                </button>
                <button className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium w-full sm:w-auto">
                  <X className="w-5 h-5" />
                  <span>Not helpful</span>
                </button>
              </div>

              {/* Expert Review Option */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-3">Need Expert Help?</h4>
                <p className="text-blue-800 text-sm mb-4">
                  If you're unsure about the diagnosis or need personalized advice, our lawn care experts can review your case.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleFlagForReview('Complex case - needs expert review')}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Users className="w-4 h-4" />
                    <span>Request Expert Review</span>
                  </button>
                  <button
                    onClick={() => handleFlagForReview('Diagnosis seems incorrect')}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Challenge Diagnosis</span>
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-4 text-center">
                Your feedback helps us improve our AI diagnostic accuracy
              </p>
            </div>

            {/* AI Analysis Explanation */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>AI-Enhanced Diagnostic Analysis</span>
                </h4>
                <p className="text-blue-800 text-sm">
                  Our AI analyzed image quality, visual indicators (color, texture, patterns), compared against{' '}
                  {(result as any).databaseInsights?.totalSimilarCases ?? 0} similar cases from our database, and applied
                  professional lawn care expertise. Enhanced by community data and previous successful treatments. Confidence:{' '}
                  {Math.round(((result as any).confidence ?? 0.5) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Admin Login</h3>
              <button onClick={() => setShowAdminLogin(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={adminCredentials.username}
                  onChange={(e) => setAdminCredentials((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={adminCredentials.password}
                  onChange={(e) => setAdminCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                />
              </div>
              <button
                onClick={handleAdminLogin}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Login to Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Collection Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                {emailPurpose === 'analysis' ? 'Get Your Analysis' : 'Expert Review Request'}
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              {emailPurpose === 'analysis'
                ? 'We need your email to provide the analysis and send follow-up care tips.'
                : 'Our lawn care expert will review your case and contact you within 24 hours.'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name (optional)</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>

              {emailPurpose === 'review' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone (optional)</label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
              )}

              <button
                onClick={handleEmailSubmit}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                {emailPurpose === 'analysis' ? 'Get My Analysis' : 'Request Expert Review'}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              We respect your privacy. Your email will only be used for lawn care analysis and follow-up.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDiagnostic;
