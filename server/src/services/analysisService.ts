import { OpenAI } from 'openai';
import { PrismaClient } from '@prisma/client';
import { LAWN_DIAGNOSTIC_SYSTEM_PROMPT } from '../utils/prompts';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT
});

export interface AnalysisResult {
  confidence: number;
  rootCause: string;
  solutions: string[];
  products: any[];
  healthScore: number;
  urgency: 'low' | 'medium' | 'high';
  difficulty: 'beginner' | 'intermediate' | 'expert';
  costEstimate: string;
  timeline: string;
  imageQuality: {
    lighting: string;
    focus: string;
    resolution: string;
    obstruction: string;
  };
  visualIndicators: {
    colorChanges: string[];
    textureIssues: string[];
    patchCharacteristics: {
      shape: string;
      size: string;
      edges: string;
      pattern: string;
    };
  };
  categorySuggestions?: any[];
}

export const analyzeSubmission = async (submission: any): Promise<AnalysisResult> => {
  try {
    console.log('Starting AI analysis for submission:', submission.id);

    // Build analysis prompt
    let userPrompt = `Please analyze this lawn image for problems and provide diagnosis.

Problem description: ${submission.problem_description}`;

    if (submission.grass_type) userPrompt += `\nGrass type: ${submission.grass_type}`;
    if (submission.location) userPrompt += `\nLocation: ${submission.location}`;
    if (submission.season) userPrompt += `\nSeason: ${submission.season}`;
    if (submission.recent_treatments) userPrompt += `\nRecent treatments: ${submission.recent_treatments}`;
    if (submission.pet_traffic) userPrompt += `\nNote: This area receives heavy pet traffic`;
    if (submission.has_dog) userPrompt += `\nNote: The homeowner has a dog - consider dog urine spots as a potential cause`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
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
                url: submission.image_url
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.3
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('No content in OpenAI response');
    }

    const result = JSON.parse(response.choices[0].message.content);

    // Process and validate result
    const analysisResult: AnalysisResult = {
      confidence: result.confidence || 0.5,
      rootCause: result.rootCause || 'Unable to determine root cause',
      solutions: result.solutions || [],
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
      categorySuggestions: result.categorySuggestions || []
    };

    // Save category suggestions if any
    if (result.categorySuggestions && result.categorySuggestions.length > 0) {
      for (const suggestion of result.categorySuggestions) {
        await prisma.categorySuggestion.create({
          data: {
            suggested_category: suggestion.suggestedCategory || '',
            suggested_subcategory: suggestion.suggestedSubcategory || '',
            description: suggestion.description || '',
            reasoning: suggestion.reasoning || '',
            confidence: suggestion.confidence || 0.5,
            supporting_cases: [submission.id],
            visual_indicators: suggestion.visualIndicators || [],
            suggested_solutions: suggestion.suggestedSolutions || [],
            suggested_products: suggestion.suggestedProducts || []
          }
        });
      }
    }

    console.log('AI analysis completed successfully for submission:', submission.id);
    return analysisResult;

  } catch (error) {
    console.error('Analysis service error:', error);
    throw error;
  }
};

export const runBatchAnalysis = async (options: {
  model?: string;
  batchSize?: number;
  confidenceThreshold?: number;
}) => {
  try {
    console.log('Starting batch analysis...');

    // Get unanalyzed Reddit posts
    const posts = await prisma.redditPost.findMany({
      where: {
        analysis: null
      },
      take: options.batchSize || 50,
      orderBy: { score: 'desc' }
    });

    console.log(`Found ${posts.length} posts to analyze`);

    let analyzed = 0;
    let failed = 0;

    for (const post of posts) {
      try {
        // Build analysis prompt for Reddit post
        const prompt = `Analyze this Reddit lawn care discussion:

Title: ${post.title}
Content: ${post.selftext || 'No additional content'}
Subreddit: r/${post.subreddit}
Score: ${post.score} upvotes`;

        const response = await openai.chat.completions.create({
          model: options.model || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a lawn care expert analyzing Reddit discussions. Extract the main problem and solutions discussed.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          max_tokens: 1000,
          temperature: 0.3
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');

        // Save analysis
        await prisma.redditAnalysis.create({
          data: {
            post_id: post.id,
            model: options.model || 'gpt-4o-mini',
            root_cause: result.rootCause || 'Discussion analysis',
            solutions: result.solutions || [],
            confidence: result.confidence || 'medium',
            categories: result.categories || [],
            reasoning_json: result,
            weed_percentage: result.weedPercentage || 0,
            health_score: result.healthScore || 5,
            treatment_urgency: result.urgency || 'medium'
          }
        });

        analyzed++;
        console.log(`Analyzed post ${analyzed}/${posts.length}: ${post.title.substring(0, 50)}...`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Failed to analyze post ${post.id}:`, error);
        failed++;
      }
    }

    console.log(`Batch analysis complete: ${analyzed} analyzed, ${failed} failed`);
    return { analyzed, failed, total: posts.length };

  } catch (error) {
    console.error('Batch analysis error:', error);
    throw error;
  }
};