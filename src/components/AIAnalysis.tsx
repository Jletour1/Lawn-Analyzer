import React, { useState, useEffect } from 'react';
import { getLocalData, saveLocalData } from '../utils/localStorage';
import { config } from '../utils/config';
import {
  Brain,
  Zap,
  Target,
  CheckCircle,
  Clock,
  Image,
  AlertTriangle,
  ExternalLink,
  Package,
  Database
} from 'lucide-react';

// NEW: helpers for safe arrays + merge+dedupe by id
const safeArr = <T,>(v: unknown, fb: T[] = []): T[] => (Array.isArray(v) ? (v as T[]) : fb);
const mergeById = <T,>(items: T[], getId: (x: T) => string): T[] => {
  const map = new Map<string, T>();
  for (const it of items) {
    const id = getId(it);
    map.set(id, { ...(map.get(id) as any), ...(it as any) });
  }
  return Array.from(map.values());
};

// Enhanced categorization types
export type RootCauseCategory =
  | 'grubs'
  | 'overwatering'
  | 'fungus'
  | 'drought'
  | 'weeds'
  | 'nutrient_deficiency'
  | 'soil_compaction'
  | 'mowing_damage'
  | 'pet_damage'
  | 'disease'
  | 'other';

// Category configuration
export const CATEGORY_CONFIG: Record<
  RootCauseCategory,
  { color: string; icon: string; description: string }
> = {
  grubs: { color: 'bg-red-100 text-red-800', icon: '🪲', description: 'Grubs & Insects' },
  overwatering: { color: 'bg-blue-100 text-blue-800', icon: '💧', description: 'Overwatering' },
  fungus: { color: 'bg-purple-100 text-purple-800', icon: '🍄', description: 'Fungal Disease' },
  drought: { color: 'bg-yellow-100 text-yellow-800', icon: '☀️', description: 'Drought Stress' },
  weeds: { color: 'bg-green-100 text-green-800', icon: '🌿', description: 'Weed Issues' },
  nutrient_deficiency: { color: 'bg-orange-100 text-orange-800', icon: '🧪', description: 'Nutrient Issues' },
  soil_compaction: { color: 'bg-gray-100 text-gray-800', icon: '🗿', description: 'Soil Problems' },
  mowing_damage: { color: 'bg-indigo-100 text-indigo-800', icon: '✂️', description: 'Mowing Damage' },
  pet_damage: { color: 'bg-pink-100 text-pink-800', icon: '🐕', description: 'Pet Damage' },
  disease: { color: 'bg-red-100 text-red-800', icon: '🦠', description: 'Disease' },
  other: { color: 'bg-gray-100 text-gray-800', icon: '❓', description: 'Other Issues' }
};

// Enhanced Reddit analysis system prompt with lawn detection and categorization
const ENHANCED_REDDIT_ANALYSIS_SYSTEM_PROMPT = `You are a professional lawn care diagnostician analyzing Reddit posts about lawn problems.

CRITICAL FIRST STEP - LAWN DETECTION:
Before analyzing any lawn problems, you MUST first determine if the content shows an actual lawn/grass area.

LAWN IDENTIFICATION CRITERIA:
✅ IS A LAWN if image/content shows:
- Grass areas (any type: cool-season, warm-season, natural, artificial)
- Lawn problems (brown patches, bare spots, weeds in grass)
- Yard areas with grass coverage
- Turf grass (even if damaged or diseased)
- Grass with lawn equipment, sprinklers, or lawn care products

❌ NOT A LAWN if image/content shows:
- Indoor plants, houseplants, potted plants
- Garden beds, flower gardens, vegetable gardens
- Trees, shrubs, bushes (without grass context)
- Farm crops, agricultural fields
- Concrete, pavement, buildings, vehicles
- People, animals, tools (without grass context)
- Random objects, food, unrelated content

If NOT a lawn, return immediately: {"is_lawn": false, "rejection_reason": "specific reason why not a lawn"}

If IS a lawn, continue with full analysis including:
- Hierarchical categorization (category > subcategory)
- Problem identification and solutions
- Product recommendations

CATEGORIZATION HIERARCHY (only if is_lawn = true):
HIGH-LEVEL CATEGORIES:
- grubs: White grubs and insect damage
- overwatering: Excess water and drainage issues  
- fungus: Fungal diseases and infections
- drought: Drought and heat stress
- weeds: Weed invasion and competition
- nutrient_deficiency: Nutrient deficiencies
- soil_compaction: Soil compaction and thatch
- mowing_damage: Mowing and mechanical damage
- pet_damage: Pet urine and digging damage
- disease: Viral and bacterial diseases
- other: Other lawn issues

SUBCATEGORIES:
GRUBS: white_grubs, japanese_beetle_grubs, chafer_grubs, billbug_larvae, chinch_bugs, sod_webworms
OVERWATERING: poor_drainage, excessive_irrigation, root_rot, anaerobic_conditions, standing_water
FUNGUS: brown_patch, dollar_spot, fairy_rings, rust_disease, leaf_spot, powdery_mildew, red_thread, snow_mold, summer_patch, take_all_patch
DROUGHT: heat_stress, insufficient_water, shallow_roots, drought_dormancy, wind_desiccation
WEEDS: broadleaf_weeds, grassy_weeds, crabgrass, dandelions, clover, nutsedge, chickweed, plantain, moss_invasion
NUTRIENT_DEFICIENCY: nitrogen_deficiency, iron_chlorosis, potassium_deficiency, phosphorus_deficiency, magnesium_deficiency, fertilizer_burn
SOIL_COMPACTION: heavy_foot_traffic, clay_soil_compaction, thatch_buildup, poor_soil_structure, vehicle_damage
MOWING_DAMAGE: dull_mower_blades, scalping, mowing_too_short, mowing_wet_grass, irregular_mowing
PET_DAMAGE: dog_urine_spots, cat_urine_damage, pet_digging, pet_running_paths
DISEASE: bacterial_wilt, viral_infections, nematode_damage
OTHER: salt_damage, chemical_spill, construction_damage, shade_stress, age_related_decline

Return analysis as JSON:

FOR NON-LAWN CONTENT:
{
  "is_lawn": false,
  "rejection_reason": "Indoor plant - not a lawn or grass area",
  "confidence": 0.95
}

FOR LAWN CONTENT:
{
  "is_lawn": true,
  "primary_issue": "brown_patch",
  "root_cause_category": "fungus", 
  "root_cause_subcategory": "brown_patch",
  "confidence": 0.0-1.0,
  "root_cause": "detailed explanation in 1-2 sentences",
  "solutions": ["actionable solution 1", "actionable solution 2"],
  "categories": ["problem category"],
  "weed_percentage": 0-100,
  "health_score": 1-10,
  "treatment_urgency": "low|medium|high",
  "products_mentioned": [
    {
      "name": "product name",
      "category": "product type", 
      "context": "how it was mentioned"
    }
  ]
}

CRITICAL: First check if content is lawn-related. If not, immediately return is_lawn: false with rejection reason.`;

// Function to get managed products for Root Cause Manager integration
const getManagedProductsForRootCause = (category: RootCauseCategory, subcategory: string) => {
  const data = getLocalData();
  const managedRootCauses = data.managed_root_causes || [];

  const matchingRootCause = managedRootCauses.find(
    (rc: any) => rc.category === category && rc.subcategory === subcategory && rc.products && rc.products.length > 0
  );

  return matchingRootCause ? matchingRootCause.products.filter((p: any) => p.active !== false) : [];
};

// Category badge component
const CategoryBadge: React.FC<{
  category: RootCauseCategory;
  subcategory?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ category, subcategory, showIcon = true, size = 'md' }) => {
  const categoryConfig = CATEGORY_CONFIG[category];

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="flex flex-wrap gap-1">
      {/* Main Category Badge */}
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${categoryConfig.color} ${sizeClasses[size]}`}>
        {showIcon && <span>{categoryConfig.icon}</span>}
        <span>{categoryConfig.description}</span>
      </span>

      {/* Subcategory Badge */}
      {subcategory && (
        <span className={`inline-flex items-center gap-1 rounded-full font-medium bg-white border-2 text-gray-700 ${sizeClasses[size]}`}>
          <span>{subcategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        </span>
      )}
    </div>
  );
};

// Helper functions (grouped, single definitions)
const extractProblemKey = (rootCause: string): string => {
  const lowerCause = (rootCause || '').toLowerCase();
  if (lowerCause.includes('brown patch') || lowerCause.includes('fungal')) return 'brown_patch_disease';
  if (lowerCause.includes('grub') || lowerCause.includes('white grub')) return 'grubs';
  if (lowerCause.includes('dollar spot')) return 'dollar_spot';
  if (lowerCause.includes('nitrogen') || lowerCause.includes('yellow')) return 'nitrogen_deficiency';
  if (lowerCause.includes('drought') || lowerCause.includes('dry')) return 'drought_stress';
  if (lowerCause.includes('overwater') || lowerCause.includes('too much water')) return 'overwatering';
  if (lowerCause.includes('weed') || lowerCause.includes('dandelion') || lowerCause.includes('clover')) return 'broadleaf_weeds';
  if (lowerCause.includes('dog urine') || lowerCause.includes('pet damage')) return 'dog_urine_spots';
  return 'general_lawn_issue';
};

const categorizeProblems = (
  problemKey: string
): 'disease' | 'pest' | 'environmental' | 'maintenance' | 'weed' => {
  const k = problemKey.toLowerCase();
  if (k.includes('disease') || k.includes('fungal') || k.includes('patch') || k.includes('spot')) return 'disease';
  if (k.includes('grub') || k.includes('bug') || k.includes('pest')) return 'pest';
  if (k.includes('drought') || k.includes('water') || k.includes('stress')) return 'environmental';
  if (k.includes('mower') || k.includes('maintenance') || k.includes('fertilizer')) return 'maintenance';
  if (k.includes('weed') || k.includes('dandelion') || k.includes('clover')) return 'weed';
  return 'environmental';
};

const formatProblemName = (problemKey: string): string =>
  problemKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const extractVisualIndicators = (analyses: any[]): string[] => {
  const indicators = new Set<string>();
  analyses.forEach(analysis => {
    const rc = analysis.root_cause || '';
    if (rc.includes('brown')) indicators.add('Brown patches or discoloration');
    if (rc.includes('yellow')) indicators.add('Yellow or pale grass');
    if (rc.includes('circular')) indicators.add('Circular or ring-shaped patterns');
    if (rc.includes('dead')) indicators.add('Dead or dying grass areas');
    if (rc.includes('thin')) indicators.add('Thin or sparse grass coverage');
  });
  return Array.from(indicators).slice(0, 5);
};

const generateStandardRootCause = (problemKey: string, analyses: any[]): string => {
  const mostCommon = analyses[0]?.root_cause || '';
  return `${formatProblemName(problemKey)}: ${mostCommon.substring(0, 200)}...`;
};

const extractCommonSolutions = (analyses: any[]): string[] => {
  const solutionCounts: Record<string, number> = {};
  analyses.forEach(analysis => {
    (analysis.solutions || []).forEach((solution: string) => {
      const normalized = (solution || '').toLowerCase().trim();
      if (!normalized) return;
      solutionCounts[normalized] = (solutionCounts[normalized] || 0) + 1;
    });
  });

  const threshold = Math.max(1, Math.floor(analyses.length * 0.3));
  return Object.entries(solutionCounts)
    .filter(([_, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([solution]) => solution);
};

const calculateSuccessRate = (analyses: any[]): number => {
  if (!analyses.length) return 0;
  const confidenceSum = analyses.reduce((sum, a) => sum + (a.learning_confidence || 0.5), 0);
  return confidenceSum / analyses.length;
};

const models = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    cost: 'Medium',
    speed: 'Fast',
    accuracy: 'Excellent',
    description: 'Best balance of speed and accuracy for image analysis'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    cost: 'Low',
    speed: 'Very Fast',
    accuracy: 'Good',
    description: 'Cost-effective option for high-volume processing'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    cost: 'High',
    speed: 'Medium',
    accuracy: 'Excellent',
    description: 'Highest accuracy for complex lawn diagnostics'
  }
];

const AIAnalysis: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    model: 'gpt-4o',
    batchSize: 25,
    confidenceThreshold: 0.7
  });

  const [stats, setStats] = useState({
    totalPosts: getLocalData().reddit_analyses?.length || 0,
    analyzed: getLocalData().analyzed_posts?.length || 0,
    lawnConfirmed: 0,
    nonLawnFiltered: 0,
    productsFound: 0,
    managedProductsUsed: 0,
    affiliateProductsIncluded: 0,
    avgConfidence: 0.75,
    categoryBreakdown: {} as Record<RootCauseCategory, number>
  });

  // Load stats on component mount
  useEffect(() => {
    const localData = getLocalData();
    const redditPosts = localData.reddit_analyses || [];
    const analyzedPosts = localData.analyzed_posts || [];

    // Calculate category breakdown
    const categoryBreakdown: Record<RootCauseCategory, number> = {} as Record<RootCauseCategory, number>;
    (Object.keys(CATEGORY_CONFIG) as RootCauseCategory[]).forEach(cat => {
      categoryBreakdown[cat] = 0;
    });

    analyzedPosts.forEach((post: any) => {
      if (post.root_cause_category && categoryBreakdown.hasOwnProperty(post.root_cause_category)) {
        categoryBreakdown[post.root_cause_category as RootCauseCategory]++;
      }
    });

    const managedProductsUsed = analyzedPosts.filter((a: any) => a.has_managed_products).length;
    const affiliateProductsIncluded = analyzedPosts.reduce(
      (sum: number, a: any) => sum + (a.products_mentioned || []).filter((p: any) => p.affiliate_link).length,
      0
    );

    setStats(prev => ({
      ...prev,
      totalPosts: redditPosts.length,
      analyzed: analyzedPosts.length,
      lawnConfirmed: redditPosts.filter((p: any) => p.post_hint === 'image').length,
      productsFound: analyzedPosts.reduce((sum: number, a: any) => sum + (a.products_mentioned?.length || 0), 0),
      managedProductsUsed,
      affiliateProductsIncluded,
      avgConfidence:
        analyzedPosts.length > 0
          ? analyzedPosts.reduce((sum: number, a: any) => sum + (a.learning_confidence || 0.5), 0) / analyzedPosts.length
          : 0.75,
      categoryBreakdown
    }));
  }, []);

  const handleStartAnalysis = () => {
    const localData = getLocalData();
    const redditPosts = localData.reddit_analyses || [];

    if (redditPosts.length === 0) {
      alert('No Reddit data found. Please collect data first from the Data Collection tab.');
      return;
    }

    if (!config.openai.apiKey) {
      alert('OpenAI API key not configured. Please check your .env file and add:\nVITE_OPENAI_API_KEY=your_openai_api_key');
      return;
    }

    console.log('Starting ENHANCED AI analysis with Root Cause Manager integration of', redditPosts.length, 'Reddit posts');
    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisResults([]);

    // NEW: Skip posts already analyzed or previously rejected
    const analyzedIds = new Set(
      safeArr<any>(getLocalData().analyzed_posts).map((a) => String(a.post_id || a.id))
    );
    const rejectedIds = new Set(
      safeArr<any>(getLocalData().rejected_posts).map((r) => String(r.id))
    );
    const postsToAnalyze = redditPosts.filter(
      (p: any) => !analyzedIds.has(String(p.id)) && !rejectedIds.has(String(p.id))
    );
    if (postsToAnalyze.length === 0) {
      setIsAnalyzing(false);
      setProgress(100);
      alert('Nothing new to analyze — previously processed posts were skipped.');
      return;
    }
    console.log(`Skipping ${redditPosts.length - postsToAnalyze.length} already-processed posts; analyzing ${postsToAnalyze.length} new posts.`);

    // Perform real AI analysis with enhanced categorization and Root Cause Manager integration
    performEnhancedAIAnalysis(postsToAnalyze);
    return; // NEW: ensure the original call below remains but doesn't execute

    // (kept) original line - preserved but not executed due to return above
    performEnhancedAIAnalysis(redditPosts);
  };

  const createEnhancedAnalysisWithManagedProducts = (post: any, result: any, hasImage: boolean) => {
    // Get managed products for this specific root cause
    const managedProducts = getManagedProductsForRootCause(result.root_cause_category, result.root_cause_subcategory);

    // If we have managed products, use those instead of AI-detected products
    const finalProducts =
      managedProducts.length > 0
        ? managedProducts.map((mp: any, idx: number) => ({
            id: `${post.id}_managed_product_${idx}`,
            name: mp.name,
            category: mp.category,
            affiliate_link: mp.affiliate_link, // YOUR affiliate link!
            price: mp.price,
            confidence: mp.confidence,
            context: mp.context
          }))
        : // Fallback to AI-detected products if no managed ones exist
          (result.products_mentioned || []).map((p: any, idx: number) => ({
            id: `${post.id}_product_${idx}`,
            name: p.name || 'Unknown Product',
            category: p.category || 'General',
            affiliate_link: '', // No affiliate link for AI-detected products
            confidence: result.confidence || 0.5,
            context: p.context || 'Mentioned in discussion'
          }));

    // Create enhanced analysis record with managed products
    const analysis = {
      id: `analysis_${post.id}`,
      post_id: post.id,
      is_lawn: true,

      // Enhanced categorization fields
      root_cause_category: result.root_cause_category || 'other',
      root_cause_subcategory: result.root_cause_subcategory || null,
      primary_issue: result.primary_issue || result.root_cause_subcategory || 'unknown',

      // Existing fields
      root_cause: result.root_cause || `Reddit analysis: ${post.title}`,
      solutions: result.solutions || [],
      recommendations: [],

      // ✅ MANAGED PRODUCTS WITH YOUR AFFILIATE LINKS!
      products_mentioned: finalProducts,
      has_managed_products: managedProducts.length > 0, // Flag to track this

      confidence_level: (result.confidence || 0) > 0.8 ? 'high' : (result.confidence || 0) > 0.6 ? 'medium' : 'low',
      health_score: result.health_score || 5,
      weed_percentage: result.weed_percentage || 0,
      treatment_urgency: result.treatment_urgency || 'medium',
      analyzed_at: new Date().toISOString(),

      image_analysis: {
        has_image: hasImage,
        image_url: hasImage ? post.url : null,
        grass_type: undefined,
        problem_areas: [],
        overall_health: result.health_score || 5,
        dominant_colors: [],
        texture_analysis: '',
        visual_features: [],
        similarity_hash: ''
      },

      similar_cases: [],
      learning_confidence: result.confidence || 0.5,
      reddit_data: {
        title: post.title,
        subreddit: post.subreddit,
        score: post.score,
        num_comments: post.num_comments,
        url: post.url
      }
    };

    return analysis;
  };

  const performEnhancedAIAnalysis = async (posts: any[]) => {
    try {
      const analyses: any[] = [];
      const rejectedPosts: any[] = [];
      const batchSize = settings.batchSize;
      let totalAnalyzed = 0;

      console.log(
        `🧠 Starting enhanced analysis with Root Cause Manager integration of ${posts.length} posts in batches of ${batchSize}`
      );

      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        console.log(`📊 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(posts.length / batchSize)}`);

        for (const post of batch) {
          try {
            console.log(`🔍 Analyzing post: ${post.title?.substring(0, 50)}...`);

            // Build analysis prompt with image URL for vision analysis
            const prompt = buildEnhancedAnalysisPrompt(post);

            // Prepare messages with image if available
            const messages: any[] = [
              {
                role: 'system',
                content: ENHANCED_REDDIT_ANALYSIS_SYSTEM_PROMPT
              }
            ];

            // Check if post has image for vision analysis
            const hasImage = post.post_hint === 'image' || post.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

            if (hasImage && post.url) {
              // Use vision model for image analysis
              messages.push({
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: post.url,
                      detail: 'high'
                    }
                  }
                ]
              });
            } else {
              // Text-only analysis
              messages.push({
                role: 'user',
                content: prompt
              });
            }

            // Call OpenAI API with vision capabilities if image present
            const apiModel = hasImage && settings.model.includes('4') ? 'gpt-4o' : settings.model;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${config.openai.apiKey}`,
                'Content-Type': 'application/json',
                ...(config.openai.project && { 'OpenAI-Project': config.openai.project })
              },
              body: JSON.stringify({
                model: apiModel,
                messages: messages,
                response_format: { type: 'json_object' },
                max_tokens: 2000,
                temperature: 0.3
              })
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content || '{}');

            // Check if this is lawn content
            if (result.is_lawn === false) {
              console.log(
                `❌ Rejected non-lawn content: ${post.title?.substring(0, 50)}... (${result.rejection_reason})`
              );

              // Add to rejected posts for removal from database
              rejectedPosts.push({
                id: post.id,
                title: post.title,
                url: post.url,
                rejection_reason: result.rejection_reason,
                confidence: result.confidence || 0.5,
                rejected_at: new Date().toISOString(),
                is_rejected: true
              });

              totalAnalyzed++;
              const progressPercent = (totalAnalyzed / posts.length) * 100;
              setProgress(Math.min(progressPercent, 95));
              continue; // Skip to next post
            }

            // ✅ USE ENHANCED ANALYSIS WITH MANAGED PRODUCTS
            const analysis = createEnhancedAnalysisWithManagedProducts(post, result, hasImage);

            analyses.push(analysis);
            totalAnalyzed++;

            // Enhanced logging with managed product info
            const managedProductsUsed = analysis.has_managed_products ? '✅ Managed' : '⚪ AI-detected';
            console.log(
              `✅ Analyzed: ${post.title?.substring(0, 50)}... (${result.primary_issue}) - ${managedProductsUsed} products`
            );

            // Update progress
            const progressPercent = (totalAnalyzed / posts.length) * 100;
            setProgress(Math.min(progressPercent, 95));

            // Rate limiting - wait between requests (longer for vision API)
            await new Promise(resolve => setTimeout(resolve, hasImage ? 2000 : 1000));
          } catch (postError) {
            console.error(`❌ Failed to analyze post ${post.id}:`, postError);
            totalAnalyzed++; // Still count it for progress
            setProgress(Math.min((totalAnalyzed / posts.length) * 100, 95));
          }
        }

        // Save progress after each batch
        if (analyses.length > 0) {
          const localData = getLocalData();
          localData.analyzed_posts = [...(localData.analyzed_posts || []), ...analyses.slice(-batchSize)];
          // NEW: dedupe analyzed by post_id/id before saving
          localData.analyzed_posts = mergeById<any>(
            safeArr<any>(localData.analyzed_posts),
            (a: any) => String(a.post_id || a.id)
          );
          saveLocalData(localData);
        }

        console.log(
          `📊 Batch complete. Total processed: ${totalAnalyzed}/${posts.length} (${analyses.length} lawn posts, ${rejectedPosts.length} rejected)`
        );
      }

      // Remove rejected posts from original reddit_analyses
      if (rejectedPosts.length > 0) {
        const localData = getLocalData();
        const rejectedIds = new Set(rejectedPosts.map(p => p.id));

        // Filter out rejected posts from reddit_analyses
        localData.reddit_analyses = (localData.reddit_analyses || []).filter((post: any) => !rejectedIds.has(post.id));

        // Save rejection log for review
        localData.rejected_posts = [...(localData.rejected_posts || []), ...rejectedPosts];
        // NEW: dedupe rejected list
        localData.rejected_posts = mergeById<any>(
          safeArr<any>(localData.rejected_posts),
          (r: any) => String(r.id)
        );

        console.log(`🗑️ Removed ${rejectedPosts.length} non-lawn posts from database`);
        saveLocalData(localData); // NEW: persist cleanup immediately
      }

      // Save all analyses to localStorage
      const localData = getLocalData();
      const prevAnalyzedFinal = safeArr<any>(localData.analyzed_posts); // NEW: capture previous
      localData.analyzed_posts = analyses;

      // Generate root causes and learning insights from analysis results
      const rootCauses = generateRootCausesFromAnalysis(analyses);
      const learningInsights = generateLearningInsights(analyses);

      // Save to localStorage for Root Causes and Smart Engine tabs
      localData.root_causes = rootCauses;
      localData.learning_insights = learningInsights;

      // NEW: merge + dedupe final analyzed set so previous runs stay intact
      localData.analyzed_posts = mergeById<any>(
        [...prevAnalyzedFinal, ...safeArr<any>(localData.analyzed_posts)],
        (a: any) => String(a.post_id || a.id)
      );

      saveLocalData(localData);

      // Enhanced logging
      const managedCount = analyses.filter(a => a.has_managed_products).length;
      const affiliateCount = analyses.reduce(
        (sum, a) => sum + a.products_mentioned.filter((p: any) => p.affiliate_link).length,
        0
      );

      console.log(`🎯 AI Analysis Integration Summary:
• Total analyses: ${analyses.length}
• Using managed products: ${managedCount}
• Affiliate products included: ${affiliateCount}
• Coverage rate: ${((managedCount / analyses.length) * 100).toFixed(1)}%`);

      // Update stats with category breakdown and managed products
      const categoryBreakdown: Record<RootCauseCategory, number> = {} as Record<RootCauseCategory, number>;
      (Object.keys(CATEGORY_CONFIG) as RootCauseCategory[]).forEach(cat => {
        categoryBreakdown[cat] = 0;
      });

      analyses.forEach(analysis => {
        if (analysis.root_cause_category && categoryBreakdown.hasOwnProperty(analysis.root_cause_category)) {
          categoryBreakdown[analysis.root_cause_category as RootCauseCategory]++;
        }
      });

      setStats(prev => ({
        ...prev,
        analyzed: analyses.length,
        lawnConfirmed: analyses.filter(a => a.is_lawn).length,
        nonLawnFiltered: rejectedPosts.length,
        productsFound: analyses.reduce((sum, a) => sum + a.products_mentioned.length, 0),
        managedProductsUsed: managedCount,
        affiliateProductsIncluded: affiliateCount,
        avgConfidence: analyses.length > 0 ? analyses.reduce((s, a) => s + a.learning_confidence, 0) / analyses.length : 0,
        categoryBreakdown
      }));

      setAnalysisResults([...analyses, ...rejectedPosts]);
      setProgress(100);
      setIsAnalyzing(false);

      console.log(`🎉 ENHANCED AI analysis with Root Cause Manager integration complete!`);

      // Enhanced completion alert
      if (managedCount > 0) {
        alert(`Analysis Complete with Root Cause Manager Integration!

✅ Analyzed: ${analyses.length} lawn posts
🎯 Used managed products: ${managedCount} cases
💰 Affiliate products included: ${affiliateCount}
❌ Filtered out: ${rejectedPosts.length} non-lawn posts

Your affiliate links are now automatically included in AI responses!`);
      } else {
        alert(`Analysis Complete!

✅ Analyzed: ${analyses.length} lawn posts
❌ Filtered out: ${rejectedPosts.length} non-lawn posts

💡 Tip: Add products to your Root Cause Manager to automatically include affiliate links in future analyses!`);
      }
    } catch (error: any) {
      console.error('❌ Enhanced AI analysis failed:', error);
      setIsAnalyzing(false);
      setProgress(0);
      alert('AI analysis failed: ' + error.message + '\n\nCheck console for details and verify your OpenAI API key.');
    }
  };

  const buildEnhancedAnalysisPrompt = (post: any) => {
    let prompt = `Analyze this Reddit post for lawn/grass content and provide hierarchical categorization if it's lawn-related:

TITLE: ${post.title || 'No title'}
SUBREDDIT: r/${post.subreddit || 'unknown'}
POST CONTENT: ${post.selftext || 'No content - title only'}
SCORE: ${post.score || 0} upvotes
COMMENTS: ${post.num_comments || 0} comments`;

    // Add comments if available
    if (post.comments && post.comments.length > 0) {
      prompt += `\n\nTOP COMMENTS:`;
      post.comments.slice(0, 5).forEach((comment: any, idx: number) => {
        prompt += `\n${idx + 1}. ${comment.body?.substring(0, 200) || 'No content'}...`;
      });
    }

    // Add image info if available
    if (post.post_hint === 'image' || post.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      prompt += `\n\nIMAGE: Post contains an image (see attached image for analysis)`;
    }

    prompt += `\n\nFIRST: Determine if this content shows an actual lawn/grass area.
THEN: If it's lawn-related, provide comprehensive analysis with proper categorization.
If NOT lawn-related, immediately return is_lawn: false with rejection reason.`;

    return prompt;
  };

  // Derived data generators
  const generateRootCausesFromAnalysis = (analyses: any[]) => {
    console.log('🧠 Generating root causes from', analyses.length, 'analyses...');
    if (!analyses || analyses.length === 0) return [];

    const problemGroups: Record<string, any[]> = {};
    analyses.forEach(analysis => {
      const rootCause = analysis.root_cause || 'Unknown';
      const problemKey = extractProblemKey(rootCause);
      if (!problemGroups[problemKey]) {
        problemGroups[problemKey] = [];
      }
      problemGroups[problemKey].push(analysis);
    });

    const rootCauses: any[] = [];
    Object.entries(problemGroups).forEach(([problemKey, groupAnalyses]) => {
      if (groupAnalyses.length < 2) return;

      const rootCause = {
        id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formatProblemName(problemKey),
        category: categorizeProblems(problemKey),
        description: `${formatProblemName(problemKey)} identified from ${groupAnalyses.length} Reddit discussions.`,
        visual_indicators: extractVisualIndicators(groupAnalyses),
        standard_root_cause: generateStandardRootCause(problemKey, groupAnalyses),
        standard_solutions: extractCommonSolutions(groupAnalyses),
        standard_recommendations: [],
        products: [],
        confidence_threshold: 0.7,
        success_rate: calculateSuccessRate(groupAnalyses),
        case_count: groupAnalyses.length,
        seasonal_factors: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      rootCauses.push(rootCause);
    });

    console.log('✅ Generated', rootCauses.length, 'root causes');
    return rootCauses;
  };



  const generateLearningInsights = (analyses: any[]) => {
    console.log('🔍 Generating learning insights from', analyses.length, 'analyses...');
    if (!analyses || analyses.length === 0) return [];

    const insights: any[] = [];
    const treatmentCounts: Record<string, number> = {};
    analyses.forEach(analysis => {
      (analysis.solutions || []).forEach((solution: string) => {
        const key = (solution || '').toLowerCase();
        if (!key) return;
        treatmentCounts[key] = (treatmentCounts[key] || 0) + 1;
      });
    });

    Object.entries(treatmentCounts).forEach(([treatment, count]) => {
      if (count >= 3) {
        insights.push({
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          pattern_type: 'treatment_success',
          description: `${treatment} shows effectiveness in ${count} cases (${Math.round(
            (count / analyses.length) * 100
          )}% of analyzed discussions)`,
          confidence: Math.min((count / analyses.length) * 2, 0.95),
          supporting_cases: count,
          discovered_at: new Date().toISOString(),
          validated: count >= 5
        });
      }
    });

    console.log('✅ Generated', insights.length, 'learning insights');
    return insights;
  };

  return (
    <div className="space-y-8">
      {/* Analysis Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Enhanced AI Analysis Engine</h2>
            <p className="text-gray-600 mt-1">
              Analyze collected Reddit posts with hierarchical categorization and automatic affiliate product integration
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {!isAnalyzing ? (
              <button
                onClick={handleStartAnalysis}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Brain className="w-4 h-4" />
                <span>Start Enhanced Analysis</span>
              </button>
            ) : (
              <button
                disabled
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg cursor-not-allowed"
              >
                <Brain className="w-4 h-4 animate-pulse" />
                <span>Analyzing...</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        {isAnalyzing && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Analysis Progress</span>
              <span className="text-sm text-gray-500">{Math.floor(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">
                  Posts: {Math.floor((progress * stats.totalPosts) / 100)}/{stats.totalPosts}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600">Analyzed: {Math.floor((progress * stats.totalPosts) / 100)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600">ETA: {Math.max(1, Math.floor((100 - progress) / 15))} min</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-red-500" />
                <span className="text-gray-600">API Calls: {Math.floor((progress * stats.totalPosts) / 100)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Posts</p>
                <p className="text-xl font-bold text-blue-900">{stats.totalPosts}</p>
              </div>
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Analyzed</p>
                <p className="text-xl font-bold text-green-900">{stats.analyzed}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Lawn Confirmed</p>
                <p className="text-xl font-bold text-purple-900">{stats.lawnConfirmed}</p>
              </div>
              <Image className="w-6 h-6 text-purple-600" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Filtered Out</p>
                <p className="text-xl font-bold text-red-900">{stats.nonLawnFiltered}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Products Found</p>
                <p className="text-xl font-bold text-orange-900">{stats.productsFound}</p>
              </div>
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>

          {/* NEW STATS */}
          <div className="bg-emerald-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Managed Products</p>
                <p className="text-xl font-bold text-emerald-900">{stats.managedProductsUsed}</p>
              </div>
              <Database className="w-6 h-6 text-emerald-600" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Affiliate Products</p>
                <p className="text-xl font-bold text-yellow-900">{stats.affiliateProductsIncluded}</p>
              </div>
              <ExternalLink className="w-6 h-6 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-xl font-bold text-gray-900">{(stats.avgConfidence * 100).toFixed(0)}%</p>
              </div>
              <Brain className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Root Cause Manager Integration Status */}
      {stats.analyzed > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Root Cause Manager Integration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.analyzed > 0 ? ((stats.managedProductsUsed / stats.analyzed) * 100).toFixed(1) : '0'}%
              </div>
              <div className="text-sm text-gray-600">Coverage Rate</div>
              <div className="text-xs text-gray-500">Cases using managed products</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.productsFound > 0
                  ? ((stats.affiliateProductsIncluded / stats.productsFound) * 100).toFixed(1)
                  : '0'}
                %
              </div>
              <div className="text-sm text-gray-600">Affiliate Rate</div>
              <div className="text-xs text-gray-500">Products with your links</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.affiliateProductsIncluded}</div>
              <div className="text-sm text-gray-600">Revenue Opportunities</div>
              <div className="text-xs text-gray-500">Total affiliate products</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Integration Status</span>
            </div>
            <div className="text-xs text-blue-800 space-y-1">
              <div>✅ AI Analysis automatically uses your managed products when available</div>
              <div>✅ Your affiliate links are included in all product recommendations</div>
              <div>✅ Fallback to AI-detected products when no managed products exist</div>
              <div>💡 Add more managed products in Root Cause Manager to increase coverage</div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {stats.analyzed > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(stats.categoryBreakdown).map(([category, count]) => {
              const categoryConfig = CATEGORY_CONFIG[category as RootCauseCategory];
              const percentage = stats.analyzed > 0 ? ((count / stats.analyzed) * 100).toFixed(1) : '0';

              return (
                <div key={category} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{categoryConfig.icon}</span>
                    <span className="text-lg font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-700 mb-1">{categoryConfig.description}</div>
                  <div className="text-xs text-gray-500">{percentage}% of cases</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Model Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {models.map(model => (
            <div
              key={model.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.model === model.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => setSettings(prev => ({ ...prev, model: model.id }))}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{model.name}</h4>
                {settings.model === model.id && <CheckCircle className="w-5 h-5 text-red-500" />}
              </div>
              <p className="text-sm text-gray-600 mb-3">{model.description}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost:</span>
                  <span
                    className={`font-medium ${
                      model.cost === 'Low' ? 'text-green-600' : model.cost === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}
                  >
                    {model.cost}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Speed:</span>
                  <span className="font-medium text-gray-900">{model.speed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Accuracy:</span>
                  <span className="font-medium text-gray-900">{model.accuracy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Analysis Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Analysis Configuration</h3>

        {/* Enhanced System Prompt Preview */}
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <h4 className="text-sm font-semibold text-red-900 mb-3">Enhanced Professional Lawn Diagnostician System Prompt</h4>
          <div className="mb-4 p-3 bg-white rounded-lg border border-red-200">
            <div className="text-xs text-red-800 max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{ENHANCED_REDDIT_ANALYSIS_SYSTEM_PROMPT.substring(0, 600)}...</pre>
            </div>
            <p className="text-xs text-red-700 mt-2">
              Enhanced prompt with hierarchical categorization and automatic lawn detection ensures consistent, expert-level
              analysis
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-red-800">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span>Automatic lawn vs non-lawn detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span>Hierarchical categorization (category &gt; subcategory)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span>Vision AI for image analysis</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span>Root Cause Manager integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span>Automatic affiliate product inclusion</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span>Database quality control</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch Size</label>
              <input
                type="number"
                value={settings.batchSize}
                onChange={e => setSettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                min={1}
                max={100}
              />
              <p className="text-xs text-gray-500 mt-1">Number of posts to process in each batch</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confidence Threshold</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={settings.confidenceThreshold}
                onChange={e => setSettings(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low (0.1)</span>
                <span>Current: {settings.confidenceThreshold}</span>
                <span>High (1.0)</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Enhanced Analysis Features</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Vision AI lawn detection and filtering</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Hierarchical problem categorization</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Automatic affiliate product integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Database quality control and cleanup</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Enhanced analytics and insights</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Real-time progress tracking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <h4 className="text-sm font-semibold text-purple-900 mb-2">Enhanced AI Analysis Pipeline</h4>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-xs text-red-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>1. Lawn Detection</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>2. Image Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>3. Categorization</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>4. Product Lookup</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>5. Affiliate Integration</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>6. Data Storage</span>
            </div>
          </div>
        </div>

        {/* Enhanced Analysis Results Preview */}
        {analysisResults.length > 0 && (
          <div className="mt-6 space-y-4">
            {/* Lawn Analysis Results */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-semibold text-green-900 mb-3">Recent Lawn Analysis Results</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {analysisResults
                  .filter(result => !result.is_rejected)
                  .slice(0, 5)
                  .map((result, idx) => (
                    <div key={idx} className="p-3 bg-white rounded border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-sm text-gray-900">
                          {result.reddit_data?.title?.substring(0, 60)}...
                        </div>
                        <div className="flex items-center gap-2">
                          <CategoryBadge
                            category={result.root_cause_category}
                            subcategory={result.root_cause_subcategory}
                            size="sm"
                          />
                          {result.has_managed_products && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">💰 Affiliate</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-green-600">
                        Root Cause: {result.root_cause?.substring(0, 80)}...
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Confidence: {(result.learning_confidence * 100).toFixed(0)}% |{' '}
                        Urgency: {result.treatment_urgency} |{' '}
                        Health: {result.health_score}/10
                        {result.image_analysis?.has_image && <span className="ml-1">📷</span>}
                        {result.products_mentioned?.length > 0 && (
                          <span className="ml-1">• {result.products_mentioned.length} products</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Rejected Posts */}
            {analysisResults.filter(result => result.is_rejected).length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="text-sm font-semibold text-red-900 mb-3">
                  Recently Filtered Non-Lawn Content ({analysisResults.filter(result => result.is_rejected).length} posts
                  removed)
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {analysisResults
                    .filter(result => result.is_rejected)
                    .slice(0, 3)
                    .map((result, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-red-200">
                        <div className="font-medium text-xs text-gray-900 mb-1">{result.title?.substring(0, 50)}...</div>
                        <div className="text-xs text-red-600">Rejected: {result.rejection_reason}</div>
                        <div className="text-xs text-gray-500">
                          Confidence: {((result.confidence || 0.5) * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                </div>
                <div className="mt-2 text-xs text-red-700">✅ These posts have been automatically removed from your database.</div>
              </div>
            )}
          </div>
        )}

        {/* Lawn Detection Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">🎯 Automatic Lawn Detection & Affiliate Integration</h4>
          <div className="text-xs text-blue-800 space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Vision AI analyzes images to detect actual lawn/grass content</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Non-lawn content (plants, objects, etc.) is automatically filtered out</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Root Cause Manager products are automatically included when matches found</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Your affiliate links are automatically integrated into AI responses</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Only confirmed lawn content gets full diagnostic analysis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysis;
