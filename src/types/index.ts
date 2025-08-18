export interface LawnPost {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  url: string;
  score: number;
  num_comments: number;
  image_path?: string;
  upvote_ratio: number;
  collected_at: string;
  is_lawn: boolean;
  confidence_score: number;
}

export interface LawnComment {
  id: string;
  post_id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  is_solution: boolean;
  is_diagnostic: boolean;
  has_product_mention: boolean;
}

export interface LawnAnalysis {
  id: string;
  post_id: string;
  is_lawn: boolean;
  root_cause: string;
  solutions: string[];
  recommendations: string[];
  products_mentioned: ProductMention[];
  confidence_level: 'high' | 'medium' | 'low';
  health_score: number;
  weed_percentage: number;
  treatment_urgency: 'low' | 'medium' | 'high';
  analyzed_at: string;
  image_analysis: ImageAnalysis;
  similar_cases: SimilarCase[];
  root_cause_id?: string;
  learning_confidence: number;
  seasonal_timing?: string;
  climate_zone?: string;
  grass_type_detected?: string;
  follow_up_schedule?: string[];
  cost_estimate?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'expert';
}

export interface ProductMention {
  id: string;
  name: string;
  category: string;
  affiliate_link?: string;
  confidence: number;
  context: string;
}

export interface ImageAnalysis {
  grass_type?: string;
  problem_areas: ProblemArea[];
  overall_health: number;
  dominant_colors: string[];
  texture_analysis: string;
  visual_features: VisualFeature[];
  similarity_hash: string;
}

export interface VisualFeature {
  type: 'color_pattern' | 'texture' | 'shape' | 'distribution';
  value: number[];
  confidence: number;
}

export interface SimilarCase {
  id: string;
  similarity_score: number;
  root_cause: string;
  success_rate: number;
  image_path?: string;
}

export interface ProblemArea {
  type: string;
  severity: number;
  location: string;
  description: string;
}

export interface UserDiagnostic {
  id: string;
  user_email: string;
  image_url: string;
  image_path: string;
  analysis: LawnAnalysis;
  similar_cases: string[];
  created_at: string;
  feedback_rating?: number;
  admin_reviewed: boolean;
  admin_notes?: string;
  flagged_for_review: boolean;
  review_reason?: string;
  user_phone?: string;
  user_name?: string;
}

export interface CollectionStats {
  total_posts: number;
  analyzed_posts: number;
  lawn_posts: number;
  non_lawn_posts: number;
  last_collection: string;
  analysis_progress: number;
}

export interface RootCause {
  id: string;
  name: string;
  category: 'disease' | 'pest' | 'environmental' | 'maintenance' | 'weed';
  description: string;
  visual_indicators: string[];
  standard_root_cause: string;
  standard_solutions: string[];
  standard_recommendations: string[];
  products: RootCauseProduct[];
  confidence_threshold: number;
  success_rate: number;
  case_count: number;
  seasonal_factors: string[];
  created_at: string;
  updated_at: string;
}

export interface RootCauseProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  affiliate_link: string;
  price_range: string;
  effectiveness_rating: number;
  application_timing: string[];
  product_type: 'treatment' | 'prevention' | 'tool' | 'fertilizer';
}

export interface LearningInsight {
  id: string;
  pattern_type: 'visual' | 'seasonal' | 'treatment_success' | 'user_feedback';
  description: string;
  confidence: number;
  supporting_cases: number;
  discovered_at: string;
  validated: boolean;
}

export interface CategorySuggestion {
  id: string;
  suggested_category: string;
  suggested_subcategory?: string;
  description: string;
  reasoning: string;
  confidence: number;
  supporting_cases: string[];
  visual_indicators: string[];
  suggested_solutions: string[];
  suggested_products: string[];
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface CategoryApproval {
  suggestion_id: string;
  approved: boolean;
  admin_notes: string;
  reviewed_by: string;
  reviewed_at: string;
}