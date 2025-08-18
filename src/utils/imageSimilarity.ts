// Image similarity and database matching utilities
import { getLocalData } from './localStorage';

export interface ImageFeatures {
  dominantColors: string[];
  brightness: number;
  contrast: number;
  textureScore: number;
  greenness: number;
  brownness: number;
}

export interface SimilarCase {
  id: string;
  similarity_score: number;
  root_cause: string;
  success_rate: number;
  image_path?: string;
  reddit_title?: string;
  solutions: string[];
}

// Extract basic visual features from image
export const extractImageFeatures = (imageData: string): Promise<ImageFeatures> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Resize for analysis
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      
      let totalR = 0, totalG = 0, totalB = 0;
      let brightness = 0;
      let greenPixels = 0;
      let brownPixels = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        totalR += r;
        totalG += g;
        totalB += b;
        brightness += (r + g + b) / 3;
        
        // Detect green (healthy grass)
        if (g > r && g > b && g > 80) {
          greenPixels++;
        }
        
        // Detect brown (dead/diseased grass)
        if (r > 100 && g > 60 && b < 80 && Math.abs(r - g) < 50) {
          brownPixels++;
        }
      }
      
      const pixelCount = data.length / 4;
      const avgR = totalR / pixelCount;
      const avgG = totalG / pixelCount;
      const avgB = totalB / pixelCount;
      
      // Calculate contrast (simplified)
      let contrast = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const pixelBrightness = (r + g + b) / 3;
        contrast += Math.abs(pixelBrightness - (brightness / pixelCount));
      }
      contrast = contrast / pixelCount;
      
      resolve({
        dominantColors: [
          `rgb(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)})`
        ],
        brightness: brightness / pixelCount,
        contrast: contrast,
        textureScore: contrast / 50, // Simplified texture measure
        greenness: greenPixels / pixelCount,
        brownness: brownPixels / pixelCount
      });
    };
    
    img.src = imageData;
  });
};

// Calculate similarity between two sets of image features
export const calculateSimilarity = (features1: ImageFeatures, features2: ImageFeatures): number => {
  // Normalize and weight different features
  const brightnessSim = 1 - Math.abs(features1.brightness - features2.brightness) / 255;
  const contrastSim = 1 - Math.abs(features1.contrast - features2.contrast) / 100;
  const greennessSim = 1 - Math.abs(features1.greenness - features2.greenness);
  const brownnessSim = 1 - Math.abs(features1.brownness - features2.brownness);
  const textureSim = 1 - Math.abs(features1.textureScore - features2.textureScore) / 5;
  
  // Weighted average (grass health indicators weighted higher)
  return (
    brightnessSim * 0.15 +
    contrastSim * 0.15 +
    greennessSim * 0.3 +
    brownnessSim * 0.25 +
    textureSim * 0.15
  );
};

// Find similar cases from local database
export const findSimilarCases = async (
  imageData: string, 
  problemDescription: string,
  limit: number = 5
): Promise<SimilarCase[]> => {
  try {
    const localData = getLocalData();
    const submissions = localData.submissions || [];
    const redditPosts = localData.reddit_analyses || [];
    
    if (submissions.length === 0 && redditPosts.length === 0) {
      console.log('No database data available for similarity matching');
      return [];
    }
    
    const currentFeatures = await extractImageFeatures(imageData);
    const similarities: SimilarCase[] = [];
    
    // Check user submissions
    for (const submission of submissions) {
      if (submission.image_data && submission.analysis_result) {
        try {
          const submissionFeatures = await extractImageFeatures(submission.image_data);
          const imageSimilarity = calculateSimilarity(currentFeatures, submissionFeatures);
          
          // Text similarity (simple keyword matching)
          const currentWords = problemDescription.toLowerCase().split(/\s+/);
          const submissionWords = submission.problem_description.toLowerCase().split(/\s+/);
          const commonWords = currentWords.filter(word => 
            word.length > 3 && submissionWords.includes(word)
          );
          const textSimilarity = commonWords.length / Math.max(currentWords.length, submissionWords.length);
          
          // Combined similarity
          const totalSimilarity = (imageSimilarity * 0.7) + (textSimilarity * 0.3);
          
          if (totalSimilarity > 0.3) {
            similarities.push({
              id: submission.id,
              similarity_score: totalSimilarity,
              root_cause: submission.analysis_result.rootCause || 'Unknown issue',
              success_rate: submission.analysis_result.confidence || 0.5,
              image_path: submission.image_data,
              solutions: submission.analysis_result.solutions || []
            });
          }
        } catch (error) {
          console.warn('Error analyzing submission similarity:', error);
        }
      }
    }
    
    // Check Reddit posts (simplified - based on text similarity only)
    for (const post of redditPosts.slice(0, 50)) { // Limit for performance
      if (post.title && post.selftext) {
        const postText = `${post.title} ${post.selftext}`.toLowerCase();
        const currentWords = problemDescription.toLowerCase().split(/\s+/);
        const postWords = postText.split(/\s+/);
        const commonWords = currentWords.filter(word => 
          word.length > 3 && postWords.includes(word)
        );
        const textSimilarity = commonWords.length / Math.max(currentWords.length, postWords.length);
        
        if (textSimilarity > 0.2) {
          similarities.push({
            id: post.id,
            similarity_score: textSimilarity * 0.8, // Lower weight for text-only
            root_cause: `Reddit discussion: ${post.title}`,
            success_rate: Math.min(post.score / 50, 1), // Use Reddit score as proxy
            reddit_title: post.title,
            solutions: [] // Would need to extract from comments
          });
        }
      }
    }
    
    // Sort by similarity and return top matches
    return similarities
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);
      
  } catch (error) {
    console.error('Error finding similar cases:', error);
    return [];
  }
};

// Generate enhanced analysis prompt with similar cases
export const buildEnhancedPrompt = (
  problemDescription: string,
  imageFeatures: ImageFeatures,
  similarCases: SimilarCase[],
  grassType?: string,
  location?: string,
  season?: string
): string => {
  let prompt = `Please analyze this lawn image for problems and provide diagnosis.

Problem description: ${problemDescription}`;

  // Add context information
  if (grassType) prompt += `\nGrass type: ${grassType}`;
  if (location) prompt += `\nLocation: ${location}`;
  if (season) prompt += `\nSeason: ${season}`;

  // Add image analysis
  prompt += `\n\nImage Analysis:
- Brightness: ${Math.round(imageFeatures.brightness)}/255
- Green coverage: ${Math.round(imageFeatures.greenness * 100)}%
- Brown/dead areas: ${Math.round(imageFeatures.brownness * 100)}%
- Texture variation: ${imageFeatures.textureScore.toFixed(2)}`;

  // Add similar cases for context
  if (similarCases.length > 0) {
    prompt += `\n\nSimilar Cases Found (${similarCases.length}):`;
    similarCases.forEach((case_, index) => {
      prompt += `\n${index + 1}. Similarity: ${Math.round(case_.similarity_score * 100)}%
   Root Cause: ${case_.root_cause}
   Success Rate: ${Math.round(case_.success_rate * 100)}%`;
      if (case_.solutions.length > 0) {
        prompt += `\n   Solutions: ${case_.solutions.slice(0, 2).join('; ')}`;
      }
    });
    
    prompt += `\n\nPlease consider these similar cases when making your diagnosis, but prioritize the current image and description.`;
  }

  return prompt;
};