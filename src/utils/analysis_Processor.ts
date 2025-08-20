// Analysis processing utilities for generating root causes and learning insights
import { getLocalData, saveLocalData } from './localStorage';

export interface GeneratedRootCause {
  id: string;
  name: string;
  category: 'disease' | 'pest' | 'environmental' | 'maintenance' | 'weed';
  description: string;
  visual_indicators: string[];
  standard_root_cause: string;
  standard_solutions: string[];
  standard_recommendations: string[];
  products: any[];
  confidence_threshold: number;
  success_rate: number;
  case_count: number;
  seasonal_factors: string[];
  created_at: string;
  updated_at: string;
}

export interface GeneratedLearningInsight {
  id: string;
  pattern_type: 'visual' | 'seasonal' | 'treatment_success' | 'user_feedback';
  description: string;
  confidence: number;
  supporting_cases: number;
  discovered_at: string;
  validated: boolean;
}

export const generateRootCausesFromAnalysis = (analyses: any[]): GeneratedRootCause[] => {
  console.log('🧠 Generating root causes from', analyses.length, 'analyses...');

  // Group analyses by problem type
  const problemGroups: { [key: string]: any[] } = {};

  analyses.forEach(analysis => {
    const rootCause = analysis.root_cause || 'Unknown';
    const problemKey = extractProblemKey(rootCause);

    if (!problemGroups[problemKey]) {
      problemGroups[problemKey] = [];
    }
    problemGroups[problemKey].push(analysis);
  });

  // Generate root causes from groups
  const rootCauses: GeneratedRootCause[] = [];

  Object.entries(problemGroups).forEach(([problemKey, groupAnalyses]) => {
    if (groupAnalyses.length < 2) return; // Need at least 2 cases to create a root cause

    const category = categorizeProblems(problemKey);
    const solutions = extractCommonSolutions(groupAnalyses);
    const products = extractCommonProducts(groupAnalyses);
    const successRate = calculateSuccessRate(groupAnalyses);

    const rootCause: GeneratedRootCause = {
      id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formatProblemName(problemKey) || 'Unknown Issue',
      category,
      description: generateDescription(problemKey, groupAnalyses),
      visual_indicators: extractVisualIndicators(groupAnalyses),
      standard_root_cause: generateStandardRootCause(problemKey, groupAnalyses),
      standard_solutions: solutions,
      standard_recommendations: generateRecommendations(solutions),
      products,
      confidence_threshold: Math.max(0.5, Math.min(successRate + 0.2, 0.9)),
      success_rate: successRate,
      case_count: groupAnalyses.length,
      seasonal_factors: extractSeasonalFactors(groupAnalyses),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    rootCauses.push(rootCause);
  });

  console.log('✅ Generated', rootCauses.length, 'root causes');
  return rootCauses;
};

export const generateLearningInsights = (analyses: any[]): GeneratedLearningInsight[] => {
  console.log('🔍 Generating learning insights from', analyses.length, 'analyses...');

  const insights: GeneratedLearningInsight[] = [];

  // Pattern 1: Treatment success patterns
  const treatmentPatterns = analyzeTreatmentPatterns(analyses);
  treatmentPatterns.forEach(pattern => {
    insights.push({
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pattern_type: 'treatment_success',
      description: pattern.description,
      confidence: pattern.confidence,
      supporting_cases: pattern.cases,
      discovered_at: new Date().toISOString(),
      validated: pattern.confidence > 0.8
    });
  });

  // Pattern 2: Seasonal patterns
  const seasonalPatterns = analyzeSeasonalPatterns(analyses);
  seasonalPatterns.forEach(pattern => {
    insights.push({
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pattern_type: 'seasonal',
      description: pattern.description,
      confidence: pattern.confidence,
      supporting_cases: pattern.cases,
      discovered_at: new Date().toISOString(),
      validated: pattern.confidence > 0.75
    });
  });

  // Pattern 3: Visual patterns
  const visualPatterns = analyzeVisualPatterns(analyses);
  visualPatterns.forEach(pattern => {
    insights.push({
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pattern_type: 'visual',
      description: pattern.description,
      confidence: pattern.confidence,
      supporting_cases: pattern.cases,
      discovered_at: new Date().toISOString(),
      validated: pattern.confidence > 0.85
    });
  });

  console.log('✅ Generated', insights.length, 'learning insights');
  return insights;
};

// Helper functions
const extractProblemKey = (rootCause: string): string => {
  const lowerCause = rootCause.toLowerCase();

  // Map common problems to standardized keys
  if (lowerCause.includes('brown patch') || lowerCause.includes('fungal')) return 'brown_patch_disease';
  if (lowerCause.includes('grub') || lowerCause.includes('white grub')) return 'grubs';
  if (lowerCause.includes('dollar spot')) return 'dollar_spot';
  if (lowerCause.includes('nitrogen') || lowerCause.includes('yellow')) return 'nitrogen_deficiency';
  if (lowerCause.includes('drought') || lowerCause.includes('dry')) return 'drought_stress';
  if (lowerCause.includes('overwater') || lowerCause.includes('too much water')) return 'overwatering';
  if (lowerCause.includes('weed') || lowerCause.includes('dandelion') || lowerCause.includes('clover')) return 'broadleaf_weeds';
  if (lowerCause.includes('dog urine') || lowerCause.includes('pet damage')) return 'dog_urine_spots';
  if (lowerCause.includes('dull') || lowerCause.includes('mower')) return 'dull_mower_blades';
  if (lowerCause.includes('fertilizer burn') || lowerCause.includes('chemical burn')) return 'fertilizer_burn';

  return 'general_lawn_issue';
};

const categorizeProblems = (problemKey: string): 'disease' | 'pest' | 'environmental' | 'maintenance' | 'weed' => {
  if (problemKey.includes('disease') || problemKey.includes('fungal') || problemKey.includes('patch') || problemKey.includes('spot')) return 'disease';
  if (problemKey.includes('grub') || problemKey.includes('bug') || problemKey.includes('pest')) return 'pest';
  if (problemKey.includes('drought') || problemKey.includes('water') || problemKey.includes('stress')) return 'environmental';
  if (problemKey.includes('mower') || problemKey.includes('maintenance') || problemKey.includes('fertilizer')) return 'maintenance';
  if (problemKey.includes('weed') || problemKey.includes('dandelion') || problemKey.includes('clover')) return 'weed';
  return 'environmental';
};

const extractCommonSolutions = (analyses: any[]): string[] => {
  const solutionCounts: { [key: string]: number } = {};

  analyses.forEach(analysis => {
    (analysis.solutions || []).forEach((solution: string) => {
      const normalizedSolution = solution.toLowerCase().trim();
      solutionCounts[normalizedSolution] = (solutionCounts[normalizedSolution] || 0) + 1;
    });
  });

  // Return solutions mentioned in at least 30% of cases
  const threshold = Math.max(1, Math.floor(analyses.length * 0.3));
  return Object.entries(solutionCounts)
    .filter(([_, count]) => count >= threshold)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 5)
    .map(([solution, _]) => solution);
};

const extractCommonProducts = (analyses: any[]): any[] => {
  const productCounts: { [key: string]: any } = {};

  analyses.forEach(analysis => {
    (analysis.products_mentioned || []).forEach((product: any) => {
      const key = product.name.toLowerCase();
      if (!productCounts[key]) {
        productCounts[key] = { ...product, count: 0 };
      }
      productCounts[key].count++;
    });
  });

  return Object.values(productCounts)
    .filter((product: any) => product.count >= 2)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 3);
};

const calculateSuccessRate = (analyses: any[]): number => {
  if (analyses.length === 0) return 0.5;
  
  const validConfidences = analyses
    .map(analysis => analysis.learning_confidence || analysis.confidence || 0.5)
    .filter(conf => !isNaN(conf) && conf >= 0 && conf <= 1);
  
  if (validConfidences.length === 0) return 0.5;
  
  const confidenceSum = validConfidences.reduce((sum, conf) => sum + conf, 0);
  return Math.min(Math.max(confidenceSum / validConfidences.length, 0), 1);
};

const formatProblemName = (problemKey: string): string => {
  if (!problemKey || problemKey === 'general_lawn_issue') {
    return 'General Lawn Issue';
  }
  
  return problemKey.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const generateDescription = (problemKey: string, analyses: any[]): string => {
  const commonTerms = extractCommonTerms(analyses);
  const problemName = formatProblemName(problemKey);
  const caseCount = analyses.length || 1;
  return `${problemName} identified from ${caseCount} case${caseCount > 1 ? 's' : ''}. ${commonTerms}`;
};

const extractVisualIndicators = (analyses: any[]): string[] => {
  const indicators = new Set<string>();

  analyses.forEach(analysis => {
    const rootCause = analysis.root_cause || '';
    if (rootCause.includes('brown')) indicators.add('Brown patches or discoloration');
    if (rootCause.includes('yellow')) indicators.add('Yellow or pale grass');
    if (rootCause.includes('circular')) indicators.add('Circular or ring-shaped patterns');
    if (rootCause.includes('dead')) indicators.add('Dead or dying grass areas');
    if (rootCause.includes('thin')) indicators.add('Thin or sparse grass coverage');
  });

  return Array.from(indicators).slice(0, 5);
};

const generateStandardRootCause = (problemKey: string, analyses: any[]): string => {
  const mostCommon = analyses[0]?.root_cause || 'No specific cause identified';
  const problemName = formatProblemName(problemKey);
  
  if (mostCommon.length > 200) {
    return `${problemName}: ${mostCommon.substring(0, 200)}...`;
  }
  
  return `${problemName}: ${mostCommon}`;
};

const generateRecommendations = (solutions: string[]): string[] => {
  return solutions.map(solution => `Consider: ${solution}`).slice(0, 3);
};

const extractSeasonalFactors = (analyses: any[]): string[] => {
  const factors = new Set<string>();

  analyses.forEach(analysis => {
    const reddit_data = analysis.reddit_data || {};
    const created = new Date(reddit_data.created_utc * 1000 || Date.now());
    const month = created.getMonth();

    if (month >= 2 && month <= 4) factors.add('Spring occurrence pattern');
    if (month >= 5 && month <= 7) factors.add('Summer peak activity');
    if (month >= 8 && month <= 10) factors.add('Fall season correlation');
    if (month >= 11 || month <= 1) factors.add('Winter dormancy period');
  });

  return Array.from(factors);
};

const extractCommonTerms = (analyses: any[]): string => {
  if (!analyses || analyses.length === 0) return 'No additional information available.';
  
  const terms = analyses.map(a => a.root_cause || '').join(' ').toLowerCase();
  if (terms.includes('fungal') || terms.includes('disease')) return 'Commonly associated with fungal diseases.';
  if (terms.includes('water') || terms.includes('moisture')) return 'Often related to watering issues.';
  if (terms.includes('pest') || terms.includes('insect')) return 'Typically caused by pest activity.';
  if (terms.includes('weed')) return 'Related to weed management and control.';
  if (terms.includes('maintenance')) return 'Associated with lawn maintenance practices.';
  return 'Various contributing factors identified.';
};

const analyzeTreatmentPatterns = (analyses: any[]): any[] => {
  const patterns = [];

  // Find treatments mentioned multiple times
  const treatmentCounts: { [key: string]: number } = {};
  analyses.forEach(analysis => {
    (analysis.solutions || []).forEach((solution: string) => {
      const key = solution.toLowerCase();
      treatmentCounts[key] = (treatmentCounts[key] || 0) + 1;
    });
  });

  Object.entries(treatmentCounts).forEach(([treatment, count]) => {
    if (count >= 3) {
      patterns.push({
        description: `${treatment} shows effectiveness in ${count} cases (${Math.round(count/analyses.length*100)}% of analyzed discussions)`,
        confidence: Math.min(count / analyses.length * 2, 0.95),
        cases: count
      });
    }
  });

  return patterns;
};

const analyzeSeasonalPatterns = (analyses: any[]): any[] => {
  const patterns = [];
  const seasonalData: { [key: string]: number } = {};

  analyses.forEach(analysis => {
    const reddit_data = analysis.reddit_data || {};
    const created = new Date(reddit_data.created_utc * 1000 || Date.now());
    const season = getSeasonFromDate(created);
    seasonalData[season] = (seasonalData[season] || 0) + 1;
  });

  Object.entries(seasonalData).forEach(([season, count]) => {
    if (count >= 2) {
      patterns.push({
        description: `${season} shows increased activity with ${count} cases reported during this period`,
        confidence: count / analyses.length,
        cases: count
      });
    }
  });

  return patterns;
};

const analyzeVisualPatterns = (analyses: any[]): any[] => {
  const patterns = [];
  const visualTerms = ['brown', 'yellow', 'circular', 'patches', 'spots', 'dead'];

  visualTerms.forEach(term => {
    const matchingCases = analyses.filter(analysis =>
      (analysis.root_cause || '').toLowerCase().includes(term)
    );

    if (matchingCases.length >= 3) {
      patterns.push({
        description: `Visual pattern: "${term}" appears in ${matchingCases.length} cases, indicating strong correlation with this symptom`,
        confidence: matchingCases.length / analyses.length,
        cases: matchingCases.length
      });
    }
  });

  return patterns;
};

const getSeasonFromDate = (date: Date): string => {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
};