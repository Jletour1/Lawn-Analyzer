import { config } from './config';
import { LocalUserSubmission } from './localStorage';
import { extractImageFeatures, findSimilarCases, buildEnhancedPrompt, SimilarCase } from './imageSimilarity';
import { CategorySuggestion } from '../types';
import { getLocalData, saveLocalData } from './localStorage';
import { smartLearningEngine } from './smartLearningEngine';

export interface RealAnalysisResult {
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
  difficulty?: 'beginner' | 'intermediate' | 'expert';
  costEstimate?: string;
  timeline?: string;
  imageQuality?: {
    lighting: string;
    focus: string;
    resolution: string;
    obstruction: string;
  };
  visualIndicators?: {
    colorChanges: string[];
    textureIssues: string[];
    patchCharacteristics: {
      shape: string;
      size: string;
      edges: string;
      pattern: string;
    };
  };
  similarCases?: SimilarCase[];
  databaseInsights?: {
    totalSimilarCases: number;
    averageSuccessRate: number;
    commonTreatments: string[];
  };
  categorySuggestions?: CategorySuggestion[];
  treatmentSchedules?: any[];
}

const LAWN_DIAGNOSTIC_SYSTEM_PROMPT = `You are a professional lawn-care diagnostician. Analyze an image of a lawn and any user notes to identify likely issues and recommend next steps.

IMPORTANT: You have access to a smart learning system that has analyzed thousands of similar cases. Use this knowledge to improve your diagnosis accuracy.
Do this every time:

Inspect image quality (lighting, focus, resolution, obstruction) before diagnosing.

Identify the primary diagnosis and up to 3 differential diagnoses, explaining your reasoning from visible cues (color, texture, patch shapes, edges, patterns, presence of pests/weeds, soil exposure, thatch, moisture indicators).

Provide Immediate Actions (what to do this week) and Long-Term Prevention (ongoing).

Ask for missing data only if it materially affects confidence (e.g., watering schedule, mowing height, soil type/pH test, pet traffic, chemicals applied, recent weather extremes).

If you identify a problem that doesn't fit existing categories well, suggest new categories or subcategories that would better classify this type of issue.

Output a JSON object with the following structure:
{
  "confidence": 0.0-1.0,
  "rootCause": "Primary root cause in 1-2 sentences with visible reasoning",
  "solutions": ["Specific treatment recommendation 1", "Specific treatment recommendation 2"],
  "products": [
    {
      "name": "Product Name",
      "category": "Product Category",
      "affiliateLink": "",
      "price": "$XX.XX"
    }
  ],
  "healthScore": 1-10,
  "urgency": "low|medium|high",
  "similarCases": number,
  "difficulty": "beginner|intermediate|expert",
  "costEstimate": "$XX-XX",
  "timeline": "X-X weeks",
  "imageQuality": {
    "lighting": "poor|fair|good|excellent",
    "focus": "poor|fair|good|excellent",
    "resolution": "poor|fair|good|excellent",
    "obstruction": "none|minor|moderate|severe"
  },
  "visualIndicators": {
    "colorChanges": ["description of color changes"],
    "textureIssues": ["description of texture issues"],
    "patchCharacteristics": {
      "shape": "circular|irregular|linear|scattered",
      "size": "small|medium|large|variable",
      "edges": "sharp|fuzzy|gradual",
      "pattern": "random|clustered|uniform|spreading"
    }
  },
  "categorySuggestions": [
    {
      "suggestedCategory": "New category name",
      "suggestedSubcategory": "Optional subcategory",
      "description": "Description of the new category",
      "reasoning": "Why this new category is needed",
      "confidence": 0.0-1.0,
      "visualIndicators": ["indicator1", "indicator2"],
      "suggestedSolutions": ["solution1", "solution2"],
      "suggestedProducts": ["product1", "product2"]
    }
  ]
}

Be thorough, professional, and prioritize lawn health and safety.`;

export const performRealAnalysis = async (submission: LocalUserSubmission): Promise<RealAnalysisResult> => {
  console.log('performRealAnalysis called with API key:', !!config.openai.apiKey);
  console.log('API key starts with:', config.openai.apiKey?.substring(0, 10));

  if (!config.openai.apiKey) {
    throw new Error('OpenAI API key not configured. Please check your .env file.');
  }

  try {
    console.log('Starting real analysis...');

    // Get smart recommendations from learning engine
    console.log('Getting smart recommendations from learning engine...');
    const imageFeatures = await extractImageFeatures(submission.image_data);
    const smartRecommendations = smartLearningEngine.generateSmartRecommendations(
      imageFeatures,
      submission.problem_description,
      {
        grassType: submission.grass_type,
        location: submission.location,
        season: submission.season
      }
    );

    console.log('Smart recommendations generated:', smartRecommendations.length);

    // Extract image features and find similar cases
    console.log('Extracting image features...');
    console.log('Image features extracted:', imageFeatures);

    console.log('Finding similar cases...');
    let similarCases: SimilarCase[] = [];
    try {
      similarCases = await findSimilarCases(
        submission.image_data,
        submission.problem_description,
        5
      );
    } catch (similarError) {
      console.warn('Similar cases lookup failed:', similarError);
      similarCases = [];
    }
    console.log('Similar cases found:', similarCases.length);

    // Generate database insights
    const databaseInsights = {
      totalSimilarCases: similarCases.length,
      averageSuccessRate: similarCases.length > 0
        ? similarCases.reduce((sum, case_) => sum + case_.success_rate, 0) / similarCases.length
        : 0,
      commonTreatments: similarCases
        .flatMap(case_ => case_.solutions)
        .filter((treatment, index, arr) => arr.indexOf(treatment) === index)
        .slice(0, 3)
    };

    // Convert base64 image to proper format for OpenAI
    const imageData = submission.image_data;
    console.log('Image data length:', imageData.length);

    // Build enhanced prompt with similar cases
    let userPrompt = buildEnhancedPrompt(
      submission.problem_description,
      imageFeatures,
      similarCases,
      submission.grass_type,
      submission.location,
      submission.season
    );

    if (submission.recent_treatments) {
      userPrompt += `\nRecent treatments: ${submission.recent_treatments}`;
    }
    if (submission.pet_traffic) {
      userPrompt += `\nNote: This area receives heavy pet traffic`;
    }
    if (submission.has_dog) {
      userPrompt += `\nNote: The homeowner has a dog - consider dog urine spots as a potential cause, especially for circular brown patches with dark green rings`;
    }

    // Add smart recommendations to prompt
    if (smartRecommendations.length > 0) {
      userPrompt += `\n\nSMART LEARNING INSIGHTS:
Based on analysis of similar cases, here are the top recommendations from our learning system:

${smartRecommendations.map((rec, idx) => 
  `${idx + 1}. ${rec.root_cause} (${Math.round(rec.confidence * 100)}% confidence, ${Math.round(rec.expected_success_rate * 100)}% expected success)
   Reasoning: ${rec.reasoning}
   Solutions: ${rec.solutions.slice(0, 2).join(', ')}
   Source: ${rec.learning_source}`
).join('\n\n')}

Please consider these learned patterns in your analysis, but prioritize what you observe in the current image.`;
    }

    console.log('Making OpenAI API call...');
    console.log('Prompt length:', userPrompt.length);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.openai.project && { 'OpenAI-Project': config.openai.project })
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: LAWN_DIAGNOSTIC_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenAI response received:', !!data.choices?.[0]?.message?.content);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('No content in OpenAI response');
    }

    let result;
    try {
      result = JSON.parse(data.choices[0].message.content);
      console.log('Parsed OpenAI result:', Object.keys(result));
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', data.choices[0].message.content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Ensure all required fields are present with defaults
    const finalResult = {
      confidence: result.confidence || 0.5,
      rootCause: result.rootCause || 'Unable to determine root cause from image',
      solutions: result.solutions || ['Consult with a local lawn care professional'],
      products: result.products || [],
      healthScore: result.healthScore || 5,
      urgency: result.urgency || 'medium',
      difficulty: result.difficulty || 'intermediate',
      costEstimate: result.costEstimate || '$50-100',
      timeline: result.timeline || '2-4 weeks',
      imageQuality: result.imageQuality || {
        lighting: 'fair',
        focus: 'fair',
        resolution: 'fair',
        obstruction: 'minor'
      },
      visualIndicators: result.visualIndicators || {
        colorChanges: [],
        textureIssues: [],
        patchCharacteristics: {
          shape: 'irregular',
          size: 'medium',
          edges: 'gradual',
          pattern: 'scattered'
        }
      },
      similarCases,
      databaseInsights
    };

    // Learn from this analysis
    console.log('Teaching AI from this analysis...');
    const analysisForLearning = {
      id: submission.id,
      root_cause: finalResult.rootCause,
      solutions: finalResult.solutions,
      learning_confidence: finalResult.confidence,
      image_analysis: {
        dominant_colors: imageFeatures.dominantColors || [],
        texture_analysis: 'Analyzed texture patterns',
        problem_areas: finalResult.visualIndicators?.patchCharacteristics ? [{
          type: finalResult.visualIndicators.patchCharacteristics.shape,
          severity: finalResult.healthScore < 5 ? 0.8 : 0.4,
          location: 'detected area',
          description: finalResult.rootCause
        }] : []
      },
      grass_type_detected: submission.grass_type,
      seasonal_timing: submission.season,
      climate_zone: submission.location
    };

    smartLearningEngine.learnFromAnalysis(analysisForLearning as any);

    // Process category suggestions if any
    if (result.categorySuggestions && result.categorySuggestions.length > 0) {
      const categorySuggestions = result.categorySuggestions.map((suggestion: any) => ({
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        suggested_category: suggestion.suggestedCategory || '',
        suggested_subcategory: suggestion.suggestedSubcategory || '',
        description: suggestion.description || '',
        reasoning: suggestion.reasoning || '',
        confidence: suggestion.confidence || 0.5,
        supporting_cases: [submission.id],
        visual_indicators: suggestion.visualIndicators || [],
        suggested_solutions: suggestion.suggestedSolutions || [],
        suggested_products: suggestion.suggestedProducts || [],
        created_at: new Date().toISOString(),
        status: 'pending' as const,
      }));

      // Save category suggestions to localStorage for admin review
      const localData = getLocalData();
      if (!localData.category_suggestions) {
        localData.category_suggestions = [];
      }
      localData.category_suggestions.push(...categorySuggestions);
      saveLocalData(localData);

      finalResult.categorySuggestions = categorySuggestions;
      console.log('Saved', categorySuggestions.length, 'category suggestions for admin review');
    }

    // Check for treatment schedules based on root cause
    const treatmentSchedules = findMatchingTreatmentSchedules(finalResult.rootCause);
    if (treatmentSchedules.length > 0) {
      finalResult.treatmentSchedules = treatmentSchedules;
      console.log('Found', treatmentSchedules.length, 'treatment schedules for this root cause');
    }
    
    console.log('Real analysis completed successfully');
    return finalResult;

  } catch (error) {
    console.error('Real analysis failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

// Helper function to find matching treatment schedules
const findMatchingTreatmentSchedules = (rootCause: string): any[] => {
  try {
    const localData = getLocalData();
    const rootCauses = localData.root_causes || [];
    const treatmentSchedules = localData.treatment_schedules || [];
    
    // Extract category and subcategory from AI diagnosis
    const aiCategory = getAICategory({ rootCause });
    
    // Find root cause that matches the AI category/subcategory
    const matchingRootCause = rootCauses.find((rc: any) => {
      // First try exact name matching
      if (rc.name.toLowerCase() === aiCategory.category.toLowerCase()) {
        return true;
      }
      
      // Then try subcategory matching if it exists
      if (aiCategory.subcategory && rc.name.toLowerCase().includes(aiCategory.subcategory.toLowerCase())) {
        return true;
      }
      
      // Finally try visual indicator matching
      return rc.visual_indicators && rc.visual_indicators.some((indicator: string) => 
        rootCause.toLowerCase().includes(indicator.toLowerCase())
      );
    });
    
    if (matchingRootCause) {
      // Find schedules for this root cause
      const schedules = treatmentSchedules.filter((schedule: any) => 
        schedule.root_cause_id === matchingRootCause.id
      );
      
      console.log('Found matching root cause:', matchingRootCause.name, 'for AI category:', aiCategory.category, aiCategory.subcategory, 'with', schedules.length, 'schedules');
      return schedules;
    }
    
    console.log('No matching root cause found for AI category:', aiCategory.category, aiCategory.subcategory);
    return [];
  } catch (error) {
    console.error('Error finding treatment schedules:', error);
    return [];
  }
};