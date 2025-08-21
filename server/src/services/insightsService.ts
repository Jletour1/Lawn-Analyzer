import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SystemInsights {
  totalAnalyses: number;
  accuracyTrend: number;
  commonProblems: Array<{
    problem: string;
    count: number;
    successRate: number;
  }>;
  seasonalPatterns: Array<{
    season: string;
    problemTypes: string[];
    count: number;
  }>;
  treatmentEffectiveness: Array<{
    treatment: string;
    successRate: number;
    usageCount: number;
  }>;
}

export const generateSystemInsights = async (): Promise<SystemInsights> => {
  try {
    // Get total analyses
    const totalAnalyses = await prisma.redditAnalysis.count();

    // Calculate accuracy trend (simplified)
    const recentAnalyses = await prisma.redditAnalysis.findMany({
      where: {
        analyzed_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: { confidence: true }
    });

    const accuracyTrend = recentAnalyses.length > 0
      ? recentAnalyses.filter(a => a.confidence === 'high').length / recentAnalyses.length
      : 0;

    // Get common problems
    const problemCounts = await prisma.redditAnalysis.groupBy({
      by: ['root_cause'],
      _count: { root_cause: true },
      orderBy: { _count: { root_cause: 'desc' } },
      take: 10
    });

    const commonProblems = problemCounts.map(p => ({
      problem: p.root_cause,
      count: p._count.root_cause,
      successRate: 0.8 // Would calculate from user feedback
    }));

    // Seasonal patterns (simplified)
    const seasonalPatterns = [
      {
        season: 'Spring',
        problemTypes: ['Fungal diseases', 'Weed emergence'],
        count: Math.floor(totalAnalyses * 0.3)
      },
      {
        season: 'Summer',
        problemTypes: ['Drought stress', 'Grub damage'],
        count: Math.floor(totalAnalyses * 0.4)
      },
      {
        season: 'Fall',
        problemTypes: ['Leaf spot', 'Overseeding issues'],
        count: Math.floor(totalAnalyses * 0.2)
      },
      {
        season: 'Winter',
        problemTypes: ['Snow mold', 'Salt damage'],
        count: Math.floor(totalAnalyses * 0.1)
      }
    ];

    // Treatment effectiveness (would be calculated from user feedback)
    const treatmentEffectiveness = [
      { treatment: 'Fungicide application', successRate: 0.85, usageCount: 45 },
      { treatment: 'Proper watering schedule', successRate: 0.92, usageCount: 67 },
      { treatment: 'Soil aeration', successRate: 0.78, usageCount: 23 },
      { treatment: 'Fertilizer adjustment', successRate: 0.81, usageCount: 34 }
    ];

    return {
      totalAnalyses,
      accuracyTrend,
      commonProblems,
      seasonalPatterns,
      treatmentEffectiveness
    };

  } catch (error) {
    console.error('Generate insights error:', error);
    throw error;
  }
};