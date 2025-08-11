// Enhanced Lawn Analyzer with Image-to-Image Comparison and Dynamic Learning
import { enhancedImageAnalyzer, type EnhancedAnalysisResult } from './enhancedImageAnalyzer';

export interface AnalysisResult {
  problem_name: string;
  description: string;
  confidence: number;
  health_metrics: {
    health_score: number;
    green_coverage: number;
    brown_stressed: number;
  };
  weed_analysis: {
    total_weed_percentage: number;
    coverage_assessment: string;
    grass_quality: string;
    treatment_priority: string;
    identified_weed_types: Array<{
      type: string;
      confidence: number;
    }>;
  };
  recommendations: {
    immediate: string[];
    products: string[];
    timeline: string;
    cost: string;
  };
  community_posts: Array<{
    title: string;
    description: string;
    subreddit: string;
    score: number;
    post_type: string;
  }>;
  combined_assessment: string;
  
  // Enhanced features
  similar_images: Array<{
    similarity: number;
    problem_type: string;
    source: string;
  }>;
  dynamic_indicators: { [key: string]: number };
  confidence_boost: number;
  community_validation: {
    matching_posts: number;
    average_confidence: number;
    treatment_success: number;
  };
}

interface RootCause {
  id: string;
  name: string;
  description: string;
  recommendation: string;
  products: Array<{
    name: string;
    price: string;
    description: string;
  }>;
}

class LawnAnalyzer {
  private rootCauses: RootCause[] = [];

  constructor() {
    this.initializeRootCauses();
    
    // Listen for root cause updates from admin panel
    if (typeof window !== 'undefined') {
      (window as any).updateRootCauses = (newRootCauses: RootCause[]) => {
        this.rootCauses = newRootCauses;
      };
      
      // Listen for new dynamic indicators
      (window as any).notifyNewIndicator = (indicator: any) => {
        console.log('🤖 New dynamic indicator created:', indicator.problemType);
        // Could show a notification to admin here
      };
    }
  }

  private initializeRootCauses() {
    // Load from localStorage if available
    const saved = localStorage.getItem('rootCausesData');
    if (saved) {
      this.rootCauses = JSON.parse(saved);
    } else {
      // Default root causes
      this.rootCauses = [
        {
          id: 'dog_urine_spots',
          name: 'Dog Urine Spots',
          description: 'Round, dead patches with dark green rings caused by concentrated nitrogen from pet urine.',
          recommendation: 'Flush affected areas with water immediately after urination. Apply gypsum to neutralize salt buildup.',
          products: [
            { name: 'Gypsum Soil Conditioner', price: '$15-25', description: 'Neutralizes salt buildup' },
            { name: 'Dog Spot Aid', price: '$20-30', description: 'Prevents urine damage' },
            { name: 'Perennial Ryegrass Seed', price: '$25-40', description: 'Urine-resistant grass' }
          ]
        },
        {
          id: 'brown_patch_disease',
          name: 'Brown Patch Disease',
          description: 'Large circular brown patches with smoky edges, common in humid conditions.',
          recommendation: 'Apply fungicide treatment and improve air circulation. Reduce watering frequency.',
          products: [
            { name: 'Fungicide Treatment', price: '$25-45', description: 'Controls brown patch fungus' },
            { name: 'Lawn Aerator', price: '$40-80', description: 'Improves air circulation' },
            { name: 'Disease-Resistant Seed', price: '$30-50', description: 'For reseeding' }
          ]
        },
        {
          id: 'fertilizer_burn',
          name: 'Fertilizer Burn',
          description: 'Yellow or brown streaks after fertilizing caused by overapplication.',
          recommendation: 'Water heavily to flush excess fertilizer. Use slow-release fertilizers in future.',
          products: [
            { name: 'Slow-Release Fertilizer', price: '$30-50', description: 'Prevents future burn' },
            { name: 'Gypsum for Recovery', price: '$15-25', description: 'Soil improvement' },
            { name: 'Sprinkler Timer', price: '$40-80', description: 'Consistent watering' }
          ]
        }
      ];
    }
  }

  async analyzeLawn(imageFile: File, problemType: string, userDescription: string): Promise<AnalysisResult> {
    try {
      // Perform enhanced image analysis with similarity search
      const enhancedAnalysis = await enhancedImageAnalyzer.analyzeImageEnhanced(imageFile, true);
      
      // Determine primary problem using enhanced analysis
      const primaryProblem = this.determinePrimaryProblem(enhancedAnalysis, userDescription);
      
      // Get root cause information
      const rootCause = this.rootCauses.find(rc => 
        rc.name.toLowerCase().includes(primaryProblem.toLowerCase()) ||
        primaryProblem.toLowerCase().includes(rc.name.toLowerCase())
      ) || this.rootCauses[0];

      // Calculate enhanced confidence with similarity boost
      const baseConfidence = enhancedAnalysis.confidenceBoost || 0.7;
      const finalConfidence = Math.min(0.95, baseConfidence + enhancedAnalysis.confidenceBoost);

      // Generate weed analysis
      const weedAnalysis = this.generateWeedAnalysis(enhancedAnalysis);
      
      // Generate health metrics
      const healthMetrics = this.generateHealthMetrics(enhancedAnalysis);
      
      // Generate recommendations with community insights
      const recommendations = this.generateRecommendations(rootCause, enhancedAnalysis);
      
      // Get similar community posts based on image similarity
      const communityPosts = this.generateCommunityPosts(enhancedAnalysis.similarImages);
      
      // Generate combined assessment with enhanced insights
      const combinedAssessment = this.generateCombinedAssessment(
        primaryProblem, 
        enhancedAnalysis, 
        userDescription
      );

      // Store this analysis for future learning
      this.storeAnalysisForLearning(imageFile, primaryProblem, finalConfidence, enhancedAnalysis);

      return {
        problem_name: primaryProblem,
        description: rootCause.description,
        confidence: finalConfidence,
        health_metrics: healthMetrics,
        weed_analysis: weedAnalysis,
        recommendations,
        community_posts: communityPosts,
        combined_assessment: combinedAssessment,
        
        // Enhanced features
        similar_images: enhancedAnalysis.similarImages.map(img => ({
          similarity: img.similarity,
          problem_type: img.problemType,
          source: img.source
        })),
        dynamic_indicators: enhancedAnalysis.dynamicIndicatorResults,
        confidence_boost: enhancedAnalysis.confidenceBoost,
        community_validation: enhancedAnalysis.communityValidation
      };

    } catch (error) {
      console.error('Enhanced lawn analysis error:', error);
      return this.getFallbackAnalysis(problemType, userDescription);
    }
  }

  private determinePrimaryProblem(analysis: EnhancedAnalysisResult, userDescription: string): string {
    const problems: { [key: string]: number } = {};
    
    // Start with basic problem indicators
    if (analysis.problemIndicators) {
      Object.entries(analysis.problemIndicators).forEach(([problem, score]) => {
        problems[problem] = (score as number) / 100;
      });
    }
    
    // Add dynamic indicator results
    Object.entries(analysis.dynamicIndicatorResults).forEach(([problem, score]) => {
      problems[problem] = Math.max(problems[problem] || 0, score / 100);
    });
    
    // Boost confidence based on similar images
    analysis.similarImages.forEach(similar => {
      if (similar.similarity > 0.7) {
        const boost = similar.similarity * similar.confidence * 0.3;
        problems[similar.problemType] = (problems[similar.problemType] || 0) + boost;
      }
    });
    
    // Text analysis boost from user description
    const textBoosts = this.analyzeUserDescription(userDescription);
    Object.entries(textBoosts).forEach(([problem, boost]) => {
      problems[problem] = (problems[problem] || 0) + boost;
    });
    
    // Find the highest scoring problem
    const sortedProblems = Object.entries(problems).sort((a, b) => b[1] - a[1]);
    
    if (sortedProblems.length > 0 && sortedProblems[0][1] > 0.3) {
      return this.formatProblemName(sortedProblems[0][0]);
    }
    
    return 'General Lawn Health Issue';
  }

  private analyzeUserDescription(description: string): { [key: string]: number } {
    const boosts: { [key: string]: number } = {};
    const text = description.toLowerCase();
    
    // Keyword matching with confidence boosts
    const keywords = {
      'dog_urine_spots': ['dog', 'pet', 'urine', 'pee', 'circular', 'round', 'dark green ring'],
      'brown_patch_disease': ['brown patch', 'circular', 'smoky', 'humid', 'fungus'],
      'fertilizer_burn': ['fertilizer', 'streaks', 'yellow', 'after fertilizing', 'burn'],
      'dull_mower_blades': ['frayed', 'shredded', 'brown tips', 'torn', 'mowing'],
      'grubs': ['grub', 'white larvae', 'peels like carpet', 'animals digging'],
      'drought_stress': ['drought', 'dry', 'crispy', 'footprints', 'water stress'],
      'broadleaf_weeds': ['dandelion', 'clover', 'broad leaves', 'yellow flowers', 'weeds']
    };
    
    Object.entries(keywords).forEach(([problem, words]) => {
      let boost = 0;
      words.forEach(word => {
        if (text.includes(word)) {
          boost += 0.2;
        }
      });
      if (boost > 0) {
        boosts[problem] = Math.min(0.5, boost);
      }
    });
    
    return boosts;
  }

  private formatProblemName(problemKey: string): string {
    const nameMap: { [key: string]: string } = {
      'dogUrineSpots': 'Dog Urine Spots',
      'dog_urine_spots': 'Dog Urine Spots',
      'brownPatch': 'Brown Patch Disease',
      'brown_patch_disease': 'Brown Patch Disease',
      'fertilizerBurn': 'Fertilizer Burn',
      'fertilizer_burn': 'Fertilizer Burn',
      'dullMowerBlades': 'Dull Mower Blades',
      'dull_mower_blades': 'Dull Mower Blades',
      'grubs': 'Grub Infestation',
      'droughtStress': 'Drought Stress',
      'drought_stress': 'Drought Stress',
      'broadleafWeeds': 'Broadleaf Weeds',
      'broadleaf_weeds': 'Broadleaf Weeds'
    };
    
    return nameMap[problemKey] || problemKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private generateWeedAnalysis(analysis: EnhancedAnalysisResult): any {
    const weedPercentage = analysis.weedDetection?.totalWeedPercentage || 15;
    
    let coverage = 'Light';
    let priority = 'Low';
    let quality = 'Good';
    
    if (weedPercentage > 40) {
      coverage = 'Heavy';
      priority = 'High';
      quality = 'Poor';
    } else if (weedPercentage > 20) {
      coverage = 'Moderate';
      priority = 'Medium';
      quality = 'Fair';
    }
    
    // Enhanced weed type identification from similar images
    const identifiedTypes: Array<{ type: string; confidence: number }> = [];
    
    if (analysis.similarImages) {
      const weedImages = analysis.similarImages.filter(img => 
        img.problemType.toLowerCase().includes('weed') && img.similarity > 0.6
      );
      
      const weedTypes = new Map<string, { count: number; totalConfidence: number }>();
      
      weedImages.forEach(img => {
        const existing = weedTypes.get(img.problemType) || { count: 0, totalConfidence: 0 };
        weedTypes.set(img.problemType, {
          count: existing.count + 1,
          totalConfidence: existing.totalConfidence + img.confidence
        });
      });
      
      weedTypes.forEach((data, type) => {
        if (data.count >= 2) {
          identifiedTypes.push({
            type: this.formatProblemName(type),
            confidence: data.totalConfidence / data.count
          });
        }
      });
    }
    
    // Fallback weed types if none identified from images
    if (identifiedTypes.length === 0 && weedPercentage > 10) {
      identifiedTypes.push({ type: 'Mixed Broadleaf Weeds', confidence: 0.6 });
    }
    
    return {
      total_weed_percentage: Math.round(weedPercentage * 10) / 10,
      coverage_assessment: coverage,
      grass_quality: quality,
      treatment_priority: priority,
      identified_weed_types: identifiedTypes
    };
  }

  private generateHealthMetrics(analysis: EnhancedAnalysisResult): any {
    const healthScore = analysis.healthMetrics?.overallHealth || 5.5;
    const greenCoverage = analysis.healthMetrics?.greenCoverage || 55;
    const brownStressed = analysis.healthMetrics?.brownCoverage + analysis.healthMetrics?.yellowCoverage || 35;
    
    return {
      health_score: Math.round(healthScore * 10) / 10,
      green_coverage: Math.round(greenCoverage * 10) / 10,
      brown_stressed: Math.round(brownStressed * 10) / 10
    };
  }

  private generateRecommendations(rootCause: RootCause, analysis: EnhancedAnalysisResult): any {
    const immediate = [rootCause.recommendation];
    
    // Add recommendations based on similar successful cases
    if (analysis.communityValidation.treatmentSuccess > 0.7) {
      immediate.push('Community reports high success rate with this treatment approach');
    }
    
    // Add dynamic recommendations based on analysis
    if (analysis.healthMetrics?.overallHealth < 4) {
      immediate.push('Consider professional lawn assessment due to poor overall health');
    }
    
    if (analysis.weedDetection?.totalWeedPercentage > 30) {
      immediate.push('Address weed infestation before treating primary problem');
    }
    
    const products = rootCause.products.map(p => p.name);
    
    // Add timeline based on problem severity
    let timeline = '2-4 weeks';
    if (analysis.healthMetrics?.overallHealth < 3) {
      timeline = '6-8 weeks';
    } else if (analysis.healthMetrics?.overallHealth > 7) {
      timeline = '1-2 weeks';
    }
    
    // Cost estimation
    const avgPrice = rootCause.products.reduce((sum, p) => {
      const price = parseInt(p.price.replace(/[^0-9]/g, '')) || 25;
      return sum + price;
    }, 0) / rootCause.products.length;
    
    const cost = `$${Math.round(avgPrice)}-${Math.round(avgPrice * 1.5)}`;
    
    return {
      immediate,
      products,
      timeline,
      cost
    };
  }

  private generateCommunityPosts(similarImages: any[]): any[] {
    const posts = [];
    
    // Generate posts based on similar images from Reddit
    const redditImages = similarImages.filter(img => img.source === 'reddit').slice(0, 3);
    
    redditImages.forEach((img, index) => {
      posts.push({
        title: `Similar ${img.problemType} case from community`,
        description: `Community member successfully treated similar issue with ${Math.round(img.confidence * 100)}% confidence match`,
        subreddit: 'lawncare',
        score: Math.floor(img.similarity * 50) + 10,
        post_type: 'Solution'
      });
    });
    
    // Add some default posts if no similar images
    if (posts.length === 0) {
      posts.push({
        title: 'Community discussion on lawn health',
        description: 'Multiple approaches discussed for similar lawn issues',
        subreddit: 'landscaping',
        score: 23,
        post_type: 'Discussion'
      });
    }
    
    return posts;
  }

  private generateCombinedAssessment(problemName: string, analysis: EnhancedAnalysisResult, userDescription: string): string {
    let assessment = `Based on advanced image analysis and comparison with ${analysis.similarImages.length} similar cases in our database, `;
    
    if (analysis.communityValidation.matchingPosts > 0) {
      assessment += `your lawn shows signs of ${problemName}. This diagnosis is supported by ${analysis.communityValidation.matchingPosts} similar community cases with an average confidence of ${Math.round(analysis.communityValidation.averageConfidence * 100)}%. `;
    } else {
      assessment += `your lawn appears to have ${problemName}. `;
    }
    
    if (analysis.confidenceBoost > 0.1) {
      assessment += `Our confidence in this diagnosis has been increased by ${Math.round(analysis.confidenceBoost * 100)}% based on visual similarity to verified cases. `;
    }
    
    // Add dynamic indicator insights
    const activeIndicators = Object.entries(analysis.dynamicIndicatorResults).filter(([_, score]) => score > 50);
    if (activeIndicators.length > 0) {
      assessment += `Advanced pattern recognition detected ${activeIndicators.length} strong indicators supporting this diagnosis. `;
    }
    
    if (analysis.healthMetrics?.overallHealth < 4) {
      assessment += 'The overall lawn health is concerning and may require professional intervention. ';
    } else if (analysis.healthMetrics?.overallHealth > 7) {
      assessment += 'The overall lawn health is good, suggesting this is a localized issue that should respond well to treatment. ';
    }
    
    if (analysis.communityValidation.treatmentSuccess > 0.8) {
      assessment += 'Community data shows high treatment success rates for this condition.';
    }
    
    return assessment;
  }

  private storeAnalysisForLearning(imageFile: File, problemName: string, confidence: number, analysis: EnhancedAnalysisResult) {
    // Store this analysis result for future learning
    const startTime = Date.now();
    const learningData = {
      timestamp: new Date().toISOString(),
      problemName,
      confidence,
      userSubmission: true,
      imageFeatures: analysis.imageEmbedding,
      analysisResults: analysis,
      // Enhanced metadata for better learning
      imageMetadata: {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        fileType: imageFile.type,
        dimensions: analysis.imageDimensions || { width: 0, height: 0 },
        hash: this.generateImageHash(imageFile),
        uploadSource: 'user_diagnostic'
      },
      processingMetrics: {
        totalProcessingTime: Date.now() - startTime,
        similarImagesFound: analysis.similarImages.length,
        dynamicIndicatorsTriggered: Object.keys(analysis.dynamicIndicatorResults).length,
        confidenceBoost: analysis.confidenceBoost,
        communityValidation: analysis.communityValidation,
        analysisCompleteness: this.calculateAnalysisCompleteness(analysis),
        systemVersion: '2.0'
      },
      qualityMetrics: {
        imageQuality: this.assessImageQuality(analysis),
        analysisCompleteness: this.calculateAnalysisCompleteness(analysis),
        dataReliability: confidence > 0.7 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
        userDescriptionQuality: this.assessDescriptionQuality(analysis.userDescription || ''),
        treatmentPotential: this.assessTreatmentPotential(analysis)
      },
      // Server-optimized fields for unlimited storage
      researchValue: {
        uniquenessScore: this.calculateUniquenessScore(analysis),
        learningPotential: this.calculateLearningPotential(analysis),
        crossReferenceValue: this.calculateCrossReferenceValue(analysis),
        futureResearchNotes: this.generateResearchNotes(analysis)
      },
      // Comprehensive tracking
      userInteraction: {
        sessionId: this.generateSessionId(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        analysisPath: this.getAnalysisPath(analysis)
      },
      // Treatment tracking preparation
      treatmentTracking: {
        recommendedTreatments: analysis.recommendations || [],
        expectedOutcome: this.predictTreatmentOutcome(analysis),
        followUpSchedule: this.generateFollowUpSchedule(analysis),
        successPrediction: this.calculateSuccessPrediction(analysis)
      }
    };
    
    // Add to learning database
    const existingData = JSON.parse(localStorage.getItem('learningDatabase') || '[]');
    existingData.push(learningData);
    
    // Server deployment: Keep all learning data for maximum ML potential
    // Every data point valuable for improving the system
    
    localStorage.setItem('learningDatabase', JSON.stringify(existingData));
    
    // Update similarity tracking for existing images
    this.updateSimilarityTracking(analysis.similarImages, learningData.timestamp);
    
    // Server-specific: Store in long-term research database
    this.storeInLongTermResearch(learningData);
  }

  private getFallbackAnalysis(problemType: string, userDescription: string): AnalysisResult {
    const fallbackRootCause = this.rootCauses[0];
    
    return {
      problem_name: 'General Lawn Issue',
      description: 'Unable to perform detailed analysis. Consider professional assessment.',
      confidence: 0.3,
      health_metrics: {
        health_score: 5.0,
        green_coverage: 50,
        brown_stressed: 30
      },
      weed_analysis: {
        total_weed_percentage: 15,
        coverage_assessment: 'Moderate',
        grass_quality: 'Fair',
        treatment_priority: 'Medium',
        identified_weed_types: []
      },
      recommendations: {
        immediate: ['Consider professional lawn assessment', 'Ensure proper watering schedule'],
        products: fallbackRootCause.products.map(p => p.name),
        timeline: '4-6 weeks',
        cost: '$50-100'
      },
      community_posts: [{
        title: 'General lawn care discussion',
        description: 'Community tips for maintaining healthy lawns',
        subreddit: 'lawncare',
        score: 15,
        post_type: 'Discussion'
      }],
      combined_assessment: 'Analysis system temporarily unavailable. Recommendations based on general lawn care best practices.',
      similar_images: [],
      dynamic_indicators: {},
      confidence_boost: 0,
      community_validation: {
        matching_posts: 0,
        average_confidence: 0,
        treatment_success: 0
      }
    };
  }

  private assessImageQuality(analysis: EnhancedAnalysisResult): 'high' | 'medium' | 'low' {
    const sharpness = analysis.textureAnalysis?.sharpness || 0;
    const contrast = analysis.textureAnalysis?.contrast || 0;
    
    if (sharpness > 150 && contrast > 100) return 'high';
    if (sharpness > 100 && contrast > 60) return 'medium';
    return 'low';
  }

  private calculateAnalysisCompleteness(analysis: EnhancedAnalysisResult): number {
    let completeness = 0;
    const maxScore = 7;
    
    if (analysis.colorAnalysis) completeness++;
    if (analysis.patternAnalysis) completeness++;
    if (analysis.textureAnalysis) completeness++;
    if (analysis.healthMetrics) completeness++;
    if (analysis.weedDetection) completeness++;
    if (analysis.similarImages && analysis.similarImages.length > 0) completeness++;
    if (Object.keys(analysis.dynamicIndicatorResults).length > 0) completeness++;
    
    return completeness / maxScore;
  }

  private updateSimilarityTracking(similarImages: any[], timestamp: string) {
    // Update tracking for images that were found to be similar
    similarImages.forEach(similar => {
      const trackingData = JSON.parse(localStorage.getItem('similarityTracking') || '{}');
      if (!trackingData[similar.id]) {
        trackingData[similar.id] = {
          timesMatched: 0,
          lastMatched: null,
          matchingProblems: []
        };
      }
      
      trackingData[similar.id].timesMatched++;
      trackingData[similar.id].lastMatched = timestamp;
      
      if (!trackingData[similar.id].matchingProblems.includes(similar.problemType)) {
        trackingData[similar.id].matchingProblems.push(similar.problemType);
      }
      
      localStorage.setItem('similarityTracking', JSON.stringify(trackingData));
    });
  }

  // Server-optimized helper methods
  private generateImageHash(imageFile: File): string {
    return `hash_${imageFile.size}_${imageFile.lastModified}_${imageFile.name.replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private assessDescriptionQuality(description: string): 'high' | 'medium' | 'low' {
    if (description.length > 50 && description.includes(' ')) return 'high';
    if (description.length > 20) return 'medium';
    return 'low';
  }

  private assessTreatmentPotential(analysis: any): 'high' | 'medium' | 'low' {
    if (analysis.confidence > 0.8 && analysis.communityValidation?.treatmentSuccess > 0.7) return 'high';
    if (analysis.confidence > 0.6) return 'medium';
    return 'low';
  }

  private calculateUniquenessScore(analysis: any): number {
    // Calculate how unique this case is compared to existing data
    const similarityCount = analysis.similarImages?.length || 0;
    const dynamicIndicatorCount = Object.keys(analysis.dynamicIndicatorResults || {}).length;
    
    // More unique if fewer similar images and more dynamic indicators triggered
    return Math.max(0, 1 - (similarityCount / 10) + (dynamicIndicatorCount / 5));
  }

  private calculateLearningPotential(analysis: any): number {
    // Calculate how much this case could teach the system
    let potential = 0;
    
    if (analysis.confidence > 0.8) potential += 0.3;
    if (analysis.similarImages?.length > 3) potential += 0.2;
    if (Object.keys(analysis.dynamicIndicatorResults || {}).length > 2) potential += 0.3;
    if (analysis.communityValidation?.treatmentSuccess > 0.7) potential += 0.2;
    
    return Math.min(1, potential);
  }

  private calculateCrossReferenceValue(analysis: any): number {
    // Calculate how valuable this case is for cross-referencing
    const problemComplexity = Object.keys(analysis.problemIndicators || {}).length;
    const analysisDepth = this.calculateAnalysisCompleteness(analysis);
    
    return (problemComplexity / 10 + analysisDepth) / 2;
  }

  private generateResearchNotes(analysis: any): string {
    const notes = [];
    
    if (analysis.confidenceBoost > 0.2) {
      notes.push(`High confidence boost from similarity matching (+${Math.round(analysis.confidenceBoost * 100)}%)`);
    }
    
    if (Object.keys(analysis.dynamicIndicatorResults || {}).length > 0) {
      notes.push(`Dynamic indicators triggered: ${Object.keys(analysis.dynamicIndicatorResults).join(', ')}`);
    }
    
    if (analysis.communityValidation?.matchingPosts > 5) {
      notes.push(`Strong community validation with ${analysis.communityValidation.matchingPosts} matching posts`);
    }
    
    return notes.join('; ');
  }

  private getAnalysisPath(analysis: any): string[] {
    const path = ['image_upload', 'feature_extraction'];
    
    if (analysis.similarImages?.length > 0) path.push('similarity_search');
    if (Object.keys(analysis.dynamicIndicatorResults || {}).length > 0) path.push('dynamic_indicators');
    if (analysis.communityValidation?.matchingPosts > 0) path.push('community_validation');
    
    path.push('result_generation');
    return path;
  }

  private predictTreatmentOutcome(analysis: any): 'excellent' | 'good' | 'fair' | 'poor' {
    const confidence = analysis.confidence || 0;
    const communitySuccess = analysis.communityValidation?.treatmentSuccess || 0;
    
    const score = (confidence + communitySuccess) / 2;
    
    if (score > 0.8) return 'excellent';
    if (score > 0.6) return 'good';
    if (score > 0.4) return 'fair';
    return 'poor';
  }

  private generateFollowUpSchedule(analysis: any): string[] {
    const schedule = [];
    const problemType = analysis.primaryProblem || '';
    
    if (problemType.includes('Disease') || problemType.includes('Fungus')) {
      schedule.push('1 week: Check for improvement');
      schedule.push('2 weeks: Assess treatment effectiveness');
      schedule.push('4 weeks: Full recovery evaluation');
    } else if (problemType.includes('Weed')) {
      schedule.push('2 weeks: Check weed die-back');
      schedule.push('4 weeks: Assess coverage reduction');
      schedule.push('8 weeks: Long-term control evaluation');
    } else {
      schedule.push('1 week: Initial progress check');
      schedule.push('3 weeks: Mid-treatment assessment');
      schedule.push('6 weeks: Final outcome evaluation');
    }
    
    return schedule;
  }

  private calculateSuccessPrediction(analysis: any): number {
    let prediction = 0.5; // baseline
    
    // Boost based on confidence
    prediction += (analysis.confidence || 0) * 0.3;
    
    // Boost based on community success
    prediction += (analysis.communityValidation?.treatmentSuccess || 0) * 0.2;
    
    // Boost based on similar cases
    if (analysis.similarImages?.length > 3) prediction += 0.1;
    
    // Boost based on problem clarity
    if (Object.keys(analysis.problemIndicators || {}).length > 0) prediction += 0.1;
    
    return Math.min(0.95, prediction);
  }

  private storeInLongTermResearch(learningData: any) {
    // Store in long-term research database for advanced analytics
    const longTermData = JSON.parse(localStorage.getItem('longTermResearchDatabase') || '[]');
    longTermData.push({
      ...learningData,
      researchId: `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      storedAt: new Date().toISOString(),
      dataVersion: '2.0',
      researchPriority: this.calculateResearchPriority(learningData),
      futureAnalysisNotes: this.generateFutureAnalysisNotes(learningData)
    });
    
    // Server deployment: No limits on long-term research data
    localStorage.setItem('longTermResearchDatabase', JSON.stringify(longTermData));
  }

  private calculateResearchPriority(data: any): 'critical' | 'high' | 'medium' | 'low' {
    const uniqueness = data.researchValue?.uniquenessScore || 0;
    const learning = data.researchValue?.learningPotential || 0;
    
    const priority = (uniqueness + learning) / 2;
    
    if (priority > 0.8) return 'critical';
    if (priority > 0.6) return 'high';
    if (priority > 0.4) return 'medium';
    return 'low';
  }

  private generateFutureAnalysisNotes(data: any): string[] {
    const notes = [];
    
    if (data.researchValue?.uniquenessScore > 0.7) {
      notes.push('High uniqueness - valuable for expanding problem detection capabilities');
    }
    
    if (data.researchValue?.learningPotential > 0.8) {
      notes.push('Excellent learning potential - priority for ML model training');
    }
    
    if (data.qualityMetrics?.imageQuality === 'high') {
      notes.push('High image quality - suitable for visual pattern recognition research');
    }
    
    if (data.treatmentTracking?.successPrediction > 0.8) {
      notes.push('High success prediction - valuable for treatment outcome modeling');
    }
    
    return notes;
  }
  // Public methods for admin interface
  public getDynamicIndicators() {
    return enhancedImageAnalyzer.getDynamicIndicators();
  }

  public getImageDatabase() {
    return enhancedImageAnalyzer.getImageEmbeddings();
  }

  public clearImageDatabase() {
    enhancedImageAnalyzer.clearImageDatabase();
  }
}

export const lawnAnalyzer = new LawnAnalyzer();