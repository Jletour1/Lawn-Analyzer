// Mock AI analysis for local development
import { LocalUserSubmission } from './localStorage';
import { extractImageFeatures, findSimilarCases, SimilarCase } from './imageSimilarity';

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

      for (const pattern of mockAnalysisPatterns) {
        const matchCount = pattern.keywords.filter(keyword =>
          description.includes(keyword)
        ).length;

        if (matchCount > 0) {
          selectedPattern = pattern;
          break;
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

      resolve({
        ...result,
        similarCases,
        databaseInsights
      });
    }, 2000 + Math.random() * 1000); // 2-3 second delay
  });
};