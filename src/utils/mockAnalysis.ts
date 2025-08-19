// Mock AI analysis for local development
import { LocalUserSubmission } from './localStorage';
import { extractImageFeatures, findSimilarCases, SimilarCase } from './imageSimilarity';
import { CategorySuggestion } from '../types';
import { getLocalData, saveLocalData } from './localStorage';
import { smartLearningEngine } from './smartLearningEngine';

export interface MockAnalysisResult {
  confidence: number;
  rootCause: string;
  solutions: string[];
  products: Array<{
    name: string;
    category: string;
    affiliateLink: string;
    price: string;
  }>;
  healthScore: number;
  urgency: 'low' | 'medium' | 'high';
  similarCases: number;
  difficulty?: 'beginner' | 'intermediate' | 'expert';
  costEstimate?: string;
  timeline?: string;
  similarCases?: SimilarCase[];
  databaseInsights?: {
    totalSimilarCases: number;
    averageSuccessRate: number;
    commonTreatments: string[];
  };
  categorySuggestions?: CategorySuggestion[];
}

// Mock analysis patterns based on common lawn problems
const mockAnalysisPatterns = [
  {
    keywords: ['brown', 'patch', 'circular', 'ring'],
    result: {
      confidence: 0.87,
      rootCause: "Primary diagnosis: Brown patch fungal disease. Visible indicators include circular brown patches with darker outer rings, typical of Rhizoctonia solani infection. The fuzzy patch edges and scattered distribution pattern are characteristic of this common warm-season fungal disease.",
      solutions: [
        "Apply fungicide containing propiconazole or azoxystrobin to affected areas",
        "Improve air circulation by pruning nearby shrubs and trees",
        "Reduce watering frequency but increase duration for deep, infrequent watering",
        "Avoid nitrogen fertilizer until disease is controlled"
      ],
      products: [
        {
          name: "BioAdvanced Disease Control for Lawns",
          category: "Fungicide",
          affiliateLink: "https://amazon.com/dp/B000RUJZS2",
          price: "$24.99"
        },
        {
          name: "Scotts DiseaseEx Lawn Fungicide",
          category: "Fungicide",
          affiliateLink: "https://amazon.com/dp/B01N5R8DJN",
          price: "$32.47"
        }
      ],
      healthScore: 6,
      urgency: 'medium' as const,
      similarCases: 23,
      difficulty: 'intermediate' as const,
      costEstimate: '$45-85',
      timeline: '3-4 weeks'
    }
  },
  {
    keywords: ['yellow', 'nitrogen', 'pale', 'light green'],
    result: {
      confidence: 0.92,
      rootCause: "Primary diagnosis: Nitrogen deficiency. The uniform yellowing pattern and pale green coloration indicate insufficient nitrogen availability. This is common in sandy soils or areas with heavy rainfall that leaches nutrients.",
      solutions: [
        "Apply a balanced lawn fertilizer with slow-release nitrogen",
        "Consider soil test to determine exact nutrient needs",
        "Apply organic compost to improve soil structure and nutrient retention",
        "Ensure proper watering to help nutrient uptake"
      ],
      products: [
        {
          name: "Milorganite Organic Nitrogen Fertilizer",
          category: "Fertilizer",
          affiliateLink: "https://amazon.com/dp/B000F8W852",
          price: "$19.98"
        },
        {
          name: "Scotts Turf Builder Lawn Food",
          category: "Fertilizer",
          affiliateLink: "https://amazon.com/dp/B000F8VFXO",
          price: "$47.98"
        }
      ],
      healthScore: 7,
      urgency: 'low' as const,
      similarCases: 45,
      difficulty: 'beginner' as const,
      costEstimate: '$25-50',
      timeline: '2-3 weeks'
    }
  },
  {
    keywords: ['dog', 'urine', 'pee', 'pet', 'circular', 'round', 'spots'],
    result: {
      confidence: 0.91,
      rootCause: "Primary diagnosis: Dog urine spots. The circular brown patches with darker green outer rings are characteristic of dog urine damage. High nitrogen content in urine burns grass in the center while fertilizing the edges, creating the distinctive ring pattern.",
      solutions: [
        "Water affected areas immediately after dog urination to dilute the urine",
        "Train dog to use a designated area of the yard",
        "Apply gypsum to help neutralize soil pH in affected areas",
        "Overseed damaged spots with grass seed after soil treatment"
      ],
      products: [
        {
          name: "Espoma Organic Lawn Food",
          category: "Soil Amendment",
          affiliateLink: "https://amazon.com/dp/B002Y0A95C",
          price: "$19.99"
        },
        {
          name: "Jonathan Green Grass Seed",
          category: "Grass Seed",
          affiliateLink: "https://amazon.com/dp/B01N0QQ7XH",
          price: "$24.99"
        }
      ],
      healthScore: 6,
      urgency: 'medium' as const,
      similarCases: 34,
      difficulty: 'intermediate' as const,
      costEstimate: '$25-50',
      timeline: '2-4 weeks'
    }
  },
  {
    keywords: ['grub', 'white', 'larvae', 'peels', 'carpet', 'soft'],
    result: {
      confidence: 0.94,
      rootCause: "Primary diagnosis: White grub infestation. The grass peeling away like carpet and soft, spongy areas are classic signs of grub damage. These C-shaped white larvae feed on grass roots, causing sections to die and detach from soil.",
      solutions: [
        "Apply beneficial nematodes for biological grub control",
        "Use grub-specific insecticide if infestation is severe",
        "Maintain proper lawn thickness to prevent adult beetle egg-laying",
        "Water deeply but less frequently to discourage beetles"
      ],
      products: [
        {
          name: "BioLogic Scanmask Beneficial Nematodes",
          category: "Biological Control",
          affiliateLink: "https://amazon.com/dp/B000MR6C2G",
          price: "$29.95"
        },
        {
          name: "Bayer Advanced Grub Killer Plus",
          category: "Insecticide",
          affiliateLink: "https://amazon.com/dp/B004GULFHK",
          price: "$42.99"
        }
      ],
      healthScore: 4,
      urgency: 'high' as const,
      similarCases: 18,
      difficulty: 'intermediate' as const,
      costEstimate: '$35-75',
      timeline: '4-6 weeks'
    }
  },
  {
    keywords: ['weed', 'dandelion', 'clover', 'broadleaf'],
    result: {
      confidence: 0.89,
      rootCause: "Primary diagnosis: Broadleaf weed invasion. The presence of dandelions, clover, and other broad-leaved weeds indicates weak grass competition and possible soil compaction or pH issues.",
      solutions: [
        "Apply selective broadleaf herbicide in fall or early spring",
        "Overseed thin areas to improve grass density",
        "Test and adjust soil pH if needed (6.0-7.0 ideal)",
        "Improve lawn care practices to strengthen grass competition"
      ],
      products: [
        {
          name: "Ortho WeedClear Lawn Weed Killer",
          category: "Herbicide",
          affiliateLink: "https://amazon.com/dp/B000UJVDXY",
          price: "$18.97"
        },
        {
          name: "Jonathan Green Black Beauty Grass Seed",
          category: "Grass Seed",
          affiliateLink: "https://amazon.com/dp/B01N0QQ7XH",
          price: "$39.99"
        }
      ],
      healthScore: 6,
      urgency: 'medium' as const,
      similarCases: 67,
      difficulty: 'beginner' as const,
      costEstimate: '$30-60',
      timeline: '6-8 weeks'
    }
  }

];

export const performMockAnalysis = (submission: LocalUserSubmission): Promise<MockAnalysisResult> => {
  return new Promise(async (resolve) => {
    // Simulate API delay
    setTimeout(async () => {
      // Get smart recommendations from learning engine
      const imageFeatures = await extractImageFeatures(submission.image_data);
      const smartRecommendations = smartLearningEngine.generateSmartRecommendations(
        imageFeatures,
        submission.problem_description,
        {
          grassType: submission.grass_type,
          location: submission.location,
          season: submission.season,
          hasDog: submission.has_dog
        }
      );

      console.log('Mock analysis using smart recommendations:', smartRecommendations.length);

      // Find similar cases from database
      const similarCases = await findSimilarCases(
        submission.image_data,
        submission.problem_description,
        3
      );

      // Generate database insights
      const databaseInsights = {
        totalSimilarCases: similarCases.length,
        averageSuccessRate: similarCases.length > 0
          ? similarCases.reduce((sum, case_) => sum + case_.success_rate, 0) / similarCases.length
          : 0,
        commonTreatments: similarCases
          .flatMap(case_ => case_.solutions)
          .filter((treatment, index, arr) => arr.indexOf(treatment) === index)
          .slice(0, 2)
      };

      const description = submission.problem_description.toLowerCase();

      // Find matching pattern based on keywords
      let selectedPattern = mockAnalysisPatterns[0]; // default

      // If user has a dog and description suggests circular patches, consider dog urine
      if (submission.has_dog && (description.includes('brown') || description.includes('circular') || description.includes('round') || description.includes('patch'))) {
        // Use dog urine pattern but adjust confidence based on other factors
        const dogUrinePattern = mockAnalysisPatterns.find(p => p.keywords.some(k => k.includes('urine')));
        if (dogUrinePattern) {
          selectedPattern = {
            ...dogUrinePattern,
            result: {
              ...dogUrinePattern.result,
              rootCause: `Potential dog urine spots detected. ${dogUrinePattern.result.rootCause} Consider this alongside other possible causes like fungal diseases, as symptoms can be similar.`,
              confidence: Math.min(dogUrinePattern.result.confidence * 1.2, 0.95)
            }
          };
        }
      }

      // If we have smart recommendations, use the best one
      else if (smartRecommendations.length > 0) {
        const bestRecommendation = smartRecommendations[0];
        selectedPattern = {
          keywords: ['smart', 'learning'],
          result: {
            confidence: bestRecommendation.confidence,
            rootCause: bestRecommendation.root_cause + '. ' + bestRecommendation.reasoning,
            solutions: bestRecommendation.solutions,
            products: bestRecommendation.products || mockAnalysisPatterns[0].result.products,
            healthScore: Math.round((1 - bestRecommendation.expected_success_rate) * 10) || 5,
            urgency: bestRecommendation.expected_success_rate > 0.8 ? 'low' as const : 
                    bestRecommendation.expected_success_rate > 0.6 ? 'medium' as const : 'high' as const,
            similarCases: bestRecommendation.similar_cases.length,
            difficulty: 'intermediate' as const,
            costEstimate: '$35-75',
            timeline: '2-4 weeks'
          }
        };
      } else {
        // Fallback to keyword matching
        for (const pattern of mockAnalysisPatterns) {
          const matchCount = pattern.keywords.filter(keyword =>
            description.includes(keyword)
          ).length;

          if (matchCount > 0) {
            selectedPattern = pattern;
            break;
          }
        }
      }
      // Adjust confidence based on description quality
      const result = { ...selectedPattern.result };

      // Boost confidence if we have similar cases
      if (similarCases.length > 0) {
        result.confidence = Math.min(result.confidence * 1.2, 0.95);
      }

      if (submission.problem_description.length < 50) {
        result.confidence *= 0.8; // Lower confidence for short descriptions
      }
      if (submission.grass_type) {
        result.confidence *= 1.1; // Higher confidence with grass type
      }
      if (submission.location) {
        result.confidence *= 1.05; // Slight boost with location
      }

      result.confidence = Math.min(result.confidence, 0.95); // Cap at 95%

      // Learn from this mock analysis
      const analysisForLearning = {
        id: submission.id,
        root_cause: result.rootCause,
        solutions: result.solutions,
        learning_confidence: result.confidence,
        image_analysis: {
          dominant_colors: imageFeatures.dominantColors || [],
          texture_analysis: 'Mock texture analysis',
          problem_areas: [{
            type: 'detected_issue',
            severity: result.healthScore < 5 ? 0.8 : 0.4,
            location: 'mock area',
            description: result.rootCause
          }]
        },
        grass_type_detected: submission.grass_type,
        seasonal_timing: submission.season,
        climate_zone: submission.location
      };

      smartLearningEngine.learnFromAnalysis(analysisForLearning as any);


    // Occasionally suggest new categories for testing (10% chance)
    let categorySuggestions: CategorySuggestion[] = [];
    if (Math.random() < 0.1) {
      const newCategorySuggestions = generateMockCategorySuggestions(submission);
      if (newCategorySuggestions.length > 0) {
        // Save to localStorage for admin review
        const localData = getLocalData();
        if (!localData.category_suggestions) {
          localData.category_suggestions = [];
        }
        localData.category_suggestions.push(...newCategorySuggestions);
        saveLocalData(localData);
        categorySuggestions = newCategorySuggestions;
      }
    }
      resolve({
        ...result,
        similarCases,
        databaseInsights,
        categorySuggestions
      });
    }, 2000 + Math.random() * 1000); // 2-3 second delay
  });
};

const generateMockCategorySuggestions = (submission: LocalUserSubmission): CategorySuggestion[] => {
  const description = submission.problem_description.toLowerCase();
  const suggestions: CategorySuggestion[] = [];

  // Generate suggestions based on unique patterns
  if (description.includes('purple') || description.includes('violet')) {
    suggestions.push({
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      suggested_category: 'Purple Leaf Spot Disease',
      suggested_subcategory: 'Fungal Discoloration',
      description: 'A fungal disease causing distinctive purple or violet discoloration on grass blades, often confused with other leaf spot diseases.',
      reasoning: 'The purple coloration mentioned is not typical of standard brown patch or dollar spot diseases. This appears to be a distinct fungal issue requiring its own category.',
      confidence: 0.78,
      supporting_cases: [submission.id],
      visual_indicators: ['Purple or violet spots on grass blades', 'Irregular patch shapes', 'Leaf blade discoloration'],
      suggested_solutions: ['Apply copper-based fungicide', 'Improve air circulation', 'Reduce leaf wetness duration'],
      suggested_products: ['Copper fungicide spray', 'Organic neem oil treatment'],
      created_at: new Date().toISOString(),
      status: 'pending'
    });
  }

  if (description.includes('metallic') || description.includes('shiny') || description.includes('reflective')) {
    suggestions.push({
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      suggested_category: 'Metallic Sheen Disorder',
      suggested_subcategory: 'Environmental Stress',
      description: 'An unusual condition where grass develops a metallic or shiny appearance, often due to environmental stress or chemical exposure.',
      reasoning: 'The metallic or shiny appearance described is not covered by existing categories and may indicate a unique environmental stress response.',
      confidence: 0.65,
      supporting_cases: [submission.id],
      visual_indicators: ['Metallic or shiny grass appearance', 'Unusual light reflection', 'Possible chemical residue'],
      suggested_solutions: ['Test soil for chemical contamination', 'Flush area with water', 'Monitor for recovery'],
      suggested_products: ['Soil test kit', 'Activated charcoal soil amendment'],
      created_at: new Date().toISOString(),
      status: 'pending'
    });
  }

  if (description.includes('spiral') || description.includes('twisted') || description.includes('curled')) {
    suggestions.push({
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      suggested_category: 'Grass Blade Curl Syndrome',
      suggested_subcategory: 'Growth Abnormality',
      description: 'A condition where grass blades exhibit abnormal curling, twisting, or spiral growth patterns, potentially due to herbicide damage or genetic factors.',
      reasoning: 'The spiral or twisted growth pattern is distinct from normal pest damage or disease symptoms and warrants its own diagnostic category.',
      confidence: 0.72,
      supporting_cases: [submission.id],
      visual_indicators: ['Twisted or curled grass blades', 'Spiral growth patterns', 'Abnormal blade development'],
      suggested_solutions: ['Check for herbicide drift', 'Test soil pH', 'Consider grass variety replacement'],
      suggested_products: ['pH test strips', 'Soil conditioner', 'Grass seed for reseeding'],
      created_at: new Date().toISOString(),
      status: 'pending'
    });
  }

  return suggestions;
};

// Helper function to find matching treatment schedules (same as in realAnalysis)
const findMatchingTreatmentSchedules = (rootCause: string): any[] => {
  try {
    const localData = getLocalData();
    const rootCauses = localData.root_causes || [];
    const treatmentSchedules = localData.treatment_schedules || [];
    
    // Find root cause that matches the AI diagnosis
    const matchingRootCause = rootCauses.find((rc: any) => {
      const rcName = rc.name.toLowerCase();
      const rcDescription = rc.description.toLowerCase();
      const diagnosisLower = rootCause.toLowerCase();
      
      // Check if diagnosis contains root cause name or key terms
      return diagnosisLower.includes(rcName) || 
             rcName.includes(diagnosisLower.split(' ')[0]) ||
             rc.visual_indicators.some((indicator: string) => 
               diagnosisLower.includes(indicator.toLowerCase())
             );
    });
    
    if (matchingRootCause) {
      // Find schedules for this root cause
      const schedules = treatmentSchedules.filter((schedule: any) => 
        schedule.root_cause_id === matchingRootCause.id
      );
      
      console.log('Found matching root cause:', matchingRootCause.name, 'with', schedules.length, 'schedules');
      return schedules;
    }
    
    return [];
  } catch (error) {
    console.error('Error finding treatment schedules:', error);
    return [];
  }
};