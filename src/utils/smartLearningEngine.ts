// Enhanced Smart Learning Engine that makes AI learn from past analysis
import { getLocalData, saveLocalData } from './localStorage';
import { RootCause, LawnAnalysis } from '../types';

export interface LearningPattern {
  id: string;
  pattern_type: 'visual_similarity' | 'treatment_success' | 'seasonal_correlation' | 'user_feedback';
  confidence: number;
  success_rate: number;
  case_count: number;
  visual_features: {
    dominant_colors: string[];
    texture_patterns: string[];
    shape_characteristics: string[];
  };
  treatment_outcomes: {
    successful_treatments: string[];
    failed_treatments: string[];
    average_success_rate: number;
  };
  contextual_factors: {
    grass_types: string[];
    seasons: string[];
    locations: string[];
    common_descriptions: string[];
  };
  created_at: string;
  last_updated: string;
}

export interface SmartRecommendation {
  root_cause: string;
  confidence: number;
  reasoning: string;
  solutions: string[];
  products: any[];
  similar_cases: string[];
  learning_source: 'pattern_matching' | 'root_cause_template' | 'historical_success' | 'user_feedback';
  expected_success_rate: number;
}

export class SmartLearningEngine {
  private learningPatterns: LearningPattern[] = [];
  private rootCauses: RootCause[] = [];
  private historicalAnalyses: LawnAnalysis[] = [];

  constructor() {
    this.loadLearningData();
  }

  private loadLearningData() {
    const localData = getLocalData();
    this.learningPatterns = localData.learning_patterns || [];
    this.rootCauses = localData.root_causes || [];
    this.historicalAnalyses = localData.analyzed_posts || [];
    
    console.log('🧠 Smart Learning Engine loaded:', {
      patterns: this.learningPatterns.length,
      rootCauses: this.rootCauses.length,
      historicalAnalyses: this.historicalAnalyses.length
    });
  }

  // Learn from new analysis and update patterns
  public learnFromAnalysis(analysis: LawnAnalysis, userFeedback?: { rating: number; comments: string }) {
    console.log('📚 Learning from new analysis:', analysis.id);

    // Update success rates based on user feedback
    if (userFeedback && analysis.root_cause_id) {
      this.updateSuccessRates(analysis.root_cause_id, userFeedback.rating);
    }

    // Extract and learn visual patterns
    if (analysis.image_analysis) {
      this.learnVisualPatterns(analysis);
    }

    // Learn treatment effectiveness
    this.learnTreatmentPatterns(analysis, userFeedback);

    // Learn contextual correlations
    this.learnContextualPatterns(analysis);

    // Save updated learning data
    this.saveLearningData();
  }

  // Generate smart recommendations based on learned patterns
  public generateSmartRecommendations(
    imageFeatures: any,
    problemDescription: string,
    context: {
      grassType?: string;
      location?: string;
      season?: string;
    }
  ): SmartRecommendation[] {
    console.log('🎯 Generating smart recommendations using learned patterns...');

    const recommendations: SmartRecommendation[] = [];

    // 1. Pattern-based recommendations
    const patternRecommendations = this.getPatternBasedRecommendations(imageFeatures, problemDescription, context);
    recommendations.push(...patternRecommendations);

    // 2. Root cause template matching
    const templateRecommendations = this.getRootCauseTemplateRecommendations(problemDescription, context);
    recommendations.push(...templateRecommendations);

    // 3. Historical success-based recommendations
    const historicalRecommendations = this.getHistoricalSuccessRecommendations(imageFeatures, problemDescription);
    recommendations.push(...historicalRecommendations);

    // Sort by confidence and expected success rate
    return recommendations
      .sort((a, b) => (b.confidence * b.expected_success_rate) - (a.confidence * a.expected_success_rate))
      .slice(0, 5); // Top 5 recommendations
  }

  private getPatternBasedRecommendations(
    imageFeatures: any,
    problemDescription: string,
    context: any
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    for (const pattern of this.learningPatterns) {
      const similarity = this.calculatePatternSimilarity(pattern, imageFeatures, problemDescription, context);
      
      if (similarity > 0.6) {
        recommendations.push({
          root_cause: `Pattern-based diagnosis: ${pattern.pattern_type}`,
          confidence: similarity * pattern.confidence,
          reasoning: `Based on learned pattern from ${pattern.case_count} similar cases with ${Math.round(pattern.success_rate * 100)}% success rate`,
          solutions: pattern.treatment_outcomes.successful_treatments,
          products: [],
          similar_cases: [],
          learning_source: 'pattern_matching',
          expected_success_rate: pattern.success_rate
        });
      }
    }

    return recommendations;
  }

  private getRootCauseTemplateRecommendations(
    problemDescription: string,
    context: any
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    for (const rootCause of this.rootCauses) {
      const relevance = this.calculateRootCauseRelevance(rootCause, problemDescription, context);
      
      if (relevance > rootCause.confidence_threshold) {
        recommendations.push({
          root_cause: rootCause.standard_root_cause,
          confidence: relevance,
          reasoning: `Matches established root cause template with ${rootCause.case_count} documented cases`,
          solutions: rootCause.standard_solutions,
          products: rootCause.products,
          similar_cases: [],
          learning_source: 'root_cause_template',
          expected_success_rate: rootCause.success_rate
        });
      }
    }

    return recommendations;
  }

  private getHistoricalSuccessRecommendations(
    imageFeatures: any,
    problemDescription: string
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    // Find historically successful treatments for similar problems
    const similarAnalyses = this.historicalAnalyses.filter(analysis => 
      analysis.learning_confidence > 0.7 && 
      this.calculateTextSimilarity(analysis.root_cause, problemDescription) > 0.5
    );

    if (similarAnalyses.length > 0) {
      const successfulSolutions = this.extractSuccessfulSolutions(similarAnalyses);
      const avgSuccessRate = similarAnalyses.reduce((sum, a) => sum + a.learning_confidence, 0) / similarAnalyses.length;

      recommendations.push({
        root_cause: `Historical pattern analysis`,
        confidence: 0.8,
        reasoning: `Based on ${similarAnalyses.length} historically successful similar cases`,
        solutions: successfulSolutions,
        products: [],
        similar_cases: similarAnalyses.map(a => a.id),
        learning_source: 'historical_success',
        expected_success_rate: avgSuccessRate
      });
    }

    return recommendations;
  }

  private learnVisualPatterns(analysis: LawnAnalysis) {
    if (!analysis.image_analysis) return;

    const existingPattern = this.learningPatterns.find(p => 
      p.pattern_type === 'visual_similarity' &&
      this.arraysOverlap(p.visual_features.dominant_colors, analysis.image_analysis.dominant_colors)
    );

    if (existingPattern) {
      // Update existing pattern
      existingPattern.case_count++;
      existingPattern.confidence = Math.min(existingPattern.confidence + 0.05, 0.95);
      existingPattern.last_updated = new Date().toISOString();
    } else {
      // Create new visual pattern
      const newPattern: LearningPattern = {
        id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pattern_type: 'visual_similarity',
        confidence: 0.6,
        success_rate: analysis.learning_confidence,
        case_count: 1,
        visual_features: {
          dominant_colors: analysis.image_analysis.dominant_colors,
          texture_patterns: [analysis.image_analysis.texture_analysis],
          shape_characteristics: analysis.image_analysis.problem_areas.map(area => area.type)
        },
        treatment_outcomes: {
          successful_treatments: analysis.solutions,
          failed_treatments: [],
          average_success_rate: analysis.learning_confidence
        },
        contextual_factors: {
          grass_types: analysis.grass_type_detected ? [analysis.grass_type_detected] : [],
          seasons: analysis.seasonal_timing ? [analysis.seasonal_timing] : [],
          locations: analysis.climate_zone ? [analysis.climate_zone] : [],
          common_descriptions: [analysis.root_cause.substring(0, 100)]
        },
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };

      this.learningPatterns.push(newPattern);
    }
  }

  private learnTreatmentPatterns(analysis: LawnAnalysis, userFeedback?: { rating: number; comments: string }) {
    const successRate = userFeedback ? userFeedback.rating / 5 : analysis.learning_confidence;

    const treatmentPattern = this.learningPatterns.find(p => 
      p.pattern_type === 'treatment_success' &&
      p.treatment_outcomes.successful_treatments.some(t => analysis.solutions.includes(t))
    );

    if (treatmentPattern) {
      // Update treatment success rates
      treatmentPattern.case_count++;
      treatmentPattern.success_rate = (treatmentPattern.success_rate * (treatmentPattern.case_count - 1) + successRate) / treatmentPattern.case_count;
      treatmentPattern.last_updated = new Date().toISOString();

      if (successRate > 0.7) {
        // Add successful treatments
        analysis.solutions.forEach(solution => {
          if (!treatmentPattern.treatment_outcomes.successful_treatments.includes(solution)) {
            treatmentPattern.treatment_outcomes.successful_treatments.push(solution);
          }
        });
      } else if (successRate < 0.4) {
        // Track failed treatments
        analysis.solutions.forEach(solution => {
          if (!treatmentPattern.treatment_outcomes.failed_treatments.includes(solution)) {
            treatmentPattern.treatment_outcomes.failed_treatments.push(solution);
          }
        });
      }
    }
  }

  private learnContextualPatterns(analysis: LawnAnalysis) {
    // Learn seasonal correlations
    if (analysis.seasonal_timing) {
      const seasonalPattern = this.learningPatterns.find(p => 
        p.pattern_type === 'seasonal_correlation' &&
        p.contextual_factors.seasons.includes(analysis.seasonal_timing!)
      );

      if (seasonalPattern) {
        seasonalPattern.case_count++;
        seasonalPattern.confidence = Math.min(seasonalPattern.confidence + 0.02, 0.9);
      }
    }
  }

  private updateSuccessRates(rootCauseId: string, rating: number) {
    const rootCause = this.rootCauses.find(rc => rc.id === rootCauseId);
    if (rootCause) {
      const newSuccessRate = rating / 5;
      rootCause.success_rate = (rootCause.success_rate * rootCause.case_count + newSuccessRate) / (rootCause.case_count + 1);
      rootCause.case_count++;
      rootCause.updated_at = new Date().toISOString();
    }
  }

  private calculatePatternSimilarity(
    pattern: LearningPattern,
    imageFeatures: any,
    problemDescription: string,
    context: any
  ): number {
    let similarity = 0;

    // Visual similarity
    if (imageFeatures && pattern.visual_features.dominant_colors.length > 0) {
      const colorSimilarity = this.calculateColorSimilarity(
        pattern.visual_features.dominant_colors,
        imageFeatures.dominantColors || []
      );
      similarity += colorSimilarity * 0.4;
    }

    // Text similarity
    const textSimilarity = Math.max(
      ...pattern.contextual_factors.common_descriptions.map(desc =>
        this.calculateTextSimilarity(desc, problemDescription)
      )
    );
    similarity += textSimilarity * 0.4;

    // Context similarity
    let contextSimilarity = 0;
    if (context.grassType && pattern.contextual_factors.grass_types.includes(context.grassType)) {
      contextSimilarity += 0.3;
    }
    if (context.season && pattern.contextual_factors.seasons.includes(context.season)) {
      contextSimilarity += 0.3;
    }
    if (context.location && pattern.contextual_factors.locations.some(loc => 
      loc.toLowerCase().includes(context.location!.toLowerCase())
    )) {
      contextSimilarity += 0.4;
    }
    similarity += Math.min(contextSimilarity, 1) * 0.2;

    return Math.min(similarity, 1);
  }

  private calculateRootCauseRelevance(rootCause: RootCause, problemDescription: string, context: any): number {
    let relevance = 0;

    // Check visual indicators
    const indicatorMatches = rootCause.visual_indicators.filter(indicator =>
      problemDescription.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    relevance += (indicatorMatches / rootCause.visual_indicators.length) * 0.6;

    // Check seasonal factors
    if (context.season && rootCause.seasonal_factors.includes(context.season)) {
      relevance += 0.2;
    }

    // Check description similarity
    const descSimilarity = this.calculateTextSimilarity(rootCause.description, problemDescription);
    relevance += descSimilarity * 0.2;

    return Math.min(relevance, 1);
  }

  private calculateColorSimilarity(colors1: string[], colors2: string[]): number {
    if (colors1.length === 0 || colors2.length === 0) return 0;
    
    const matches = colors1.filter(color1 => 
      colors2.some(color2 => this.colorsAreSimilar(color1, color2))
    ).length;
    
    return matches / Math.max(colors1.length, colors2.length);
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => 
      word.length > 3 && words2.includes(word)
    ).length;
    
    return commonWords / Math.max(words1.length, words2.length);
  }

  private colorsAreSimilar(color1: string, color2: string): boolean {
    // Simple color similarity check - could be enhanced with actual color distance
    return color1 === color2 || 
           (color1.includes('brown') && color2.includes('brown')) ||
           (color1.includes('green') && color2.includes('green')) ||
           (color1.includes('yellow') && color2.includes('yellow'));
  }

  private arraysOverlap<T>(arr1: T[], arr2: T[]): boolean {
    return arr1.some(item => arr2.includes(item));
  }

  private extractSuccessfulSolutions(analyses: LawnAnalysis[]): string[] {
    const solutionCounts: { [key: string]: number } = {};
    
    analyses.forEach(analysis => {
      analysis.solutions.forEach(solution => {
        solutionCounts[solution] = (solutionCounts[solution] || 0) + 1;
      });
    });

    return Object.entries(solutionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([solution]) => solution);
  }

  private saveLearningData() {
    const localData = getLocalData();
    localData.learning_patterns = this.learningPatterns;
    localData.root_causes = this.rootCauses;
    saveLocalData(localData);
    
    console.log('💾 Learning data saved:', {
      patterns: this.learningPatterns.length,
      rootCauses: this.rootCauses.length
    });
  }

  // Get learning insights for admin dashboard
  public getLearningInsights() {
    return {
      totalPatterns: this.learningPatterns.length,
      visualPatterns: this.learningPatterns.filter(p => p.pattern_type === 'visual_similarity').length,
      treatmentPatterns: this.learningPatterns.filter(p => p.pattern_type === 'treatment_success').length,
      seasonalPatterns: this.learningPatterns.filter(p => p.pattern_type === 'seasonal_correlation').length,
      averageSuccessRate: this.learningPatterns.length > 0 
        ? this.learningPatterns.reduce((sum, p) => sum + p.success_rate, 0) / this.learningPatterns.length 
        : 0,
      totalCases: this.learningPatterns.reduce((sum, p) => sum + p.case_count, 0),
      rootCausesLearned: this.rootCauses.length,
      historicalAnalyses: this.historicalAnalyses.length
    };
  }
}

// Export singleton instance
export const smartLearningEngine = new SmartLearningEngine();