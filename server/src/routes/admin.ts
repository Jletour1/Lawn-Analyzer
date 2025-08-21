import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { collectRedditData } from '../services/redditService';
import { runBatchAnalysis } from '../services/analysisService';
import { generateSystemInsights } from '../services/insightsService';

const router = express.Router();
const prisma = new PrismaClient();

// Apply admin requirement to all routes
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const [
      totalUsers,
      totalSubmissions,
      pendingReviews,
      redditPosts,
      analyzedPosts,
      categorySuggestions,
      userStats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.submission.count(),
      prisma.submission.count({ where: { flagged_for_review: true } }),
      prisma.redditPost.count(),
      prisma.redditAnalysis.count(),
      prisma.categorySuggestion.count({ where: { status: 'PENDING' } }),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          image_upload_count: true,
          created_at: true,
          _count: {
            select: { submissions: true }
          }
        },
        orderBy: { image_upload_count: 'desc' },
        take: 10
      })
    ]);

    // Get recent activity
    const recentSubmissions = await prisma.submission.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        user_email: true,
        problem_description: true,
        created_at: true,
        admin_reviewed: true
      }
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalSubmissions,
          pendingReviews,
          redditPosts,
          analyzedPosts,
          categorySuggestions
        },
        recentActivity: recentSubmissions,
        topUsers: userStats
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// Get all submissions for admin review
router.get('/submissions', async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, name: true, image_upload_count: true }
          }
        }
      }),
      prisma.submission.count()
    ]);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Update submission (admin review)
router.put('/submissions/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { admin_reviewed, admin_notes, flagged_for_review, review_reason } = req.body;

    const submission = await prisma.submission.update({
      where: { id: req.params.id },
      data: {
        admin_reviewed,
        admin_notes,
        flagged_for_review,
        review_reason,
        reviewed_at: admin_reviewed ? new Date() : null
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        admin_id: req.user!.id,
        action_type: 'SUBMISSION_REVIEW',
        target_type: 'SUBMISSION',
        target_id: req.params.id,
        details: { admin_notes, flagged_for_review }
      }
    });

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// Trigger Reddit data collection
router.post('/reddit/collect', async (req: AuthenticatedRequest, res) => {
  try {
    const { subreddits, keywords, limit, startDate, endDate } = req.body;

    // Start collection in background
    const collectionPromise = collectRedditData({
      subreddits: subreddits || ['lawncare', 'landscaping', 'plantclinic'],
      keywords: keywords || ['brown spots', 'dead grass', 'lawn disease'],
      limit: limit || 500,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });

    // Don't wait for completion, return immediately
    res.json({
      success: true,
      message: 'Reddit collection started',
      estimatedDuration: '10-15 minutes'
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        admin_id: req.user!.id,
        action_type: 'REDDIT_COLLECTION',
        target_type: 'SYSTEM',
        target_id: 'reddit_collection',
        details: { subreddits, keywords, limit }
      }
    });

    // Handle collection completion
    collectionPromise.then(async (result) => {
      console.log('Reddit collection completed:', result);
      // Could send notification email to admin here
    }).catch((error) => {
      console.error('Reddit collection failed:', error);
    });

  } catch (error) {
    console.error('Reddit collection trigger error:', error);
    res.status(500).json({ error: 'Failed to start Reddit collection' });
  }
});

// Get Reddit data
router.get('/reddit', async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.redditPost.findMany({
        skip,
        take: limit,
        orderBy: { created_utc: 'desc' },
        include: {
          analysis: true,
          _count: {
            select: { comments: true }
          }
        }
      }),
      prisma.redditPost.count()
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get Reddit data error:', error);
    res.status(500).json({ error: 'Failed to get Reddit data' });
  }
});

// Trigger AI analysis
router.post('/analysis/run', async (req: AuthenticatedRequest, res) => {
  try {
    const { model, batchSize, confidence } = req.body;

    // Start analysis in background
    const analysisPromise = runBatchAnalysis({
      model: model || 'gpt-4o-mini',
      batchSize: batchSize || 40,
      confidenceThreshold: confidence || 0.7
    });

    res.json({
      success: true,
      message: 'AI analysis started',
      estimatedDuration: '20-30 minutes'
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        admin_id: req.user!.id,
        action_type: 'AI_ANALYSIS',
        target_type: 'SYSTEM',
        target_id: 'batch_analysis',
        details: { model, batchSize, confidence }
      }
    });

    // Handle analysis completion
    analysisPromise.then(async (result) => {
      console.log('AI analysis completed:', result);
    }).catch((error) => {
      console.error('AI analysis failed:', error);
    });

  } catch (error) {
    console.error('AI analysis trigger error:', error);
    res.status(500).json({ error: 'Failed to start AI analysis' });
  }
});

// Get analysis results
router.get('/analysis', async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      prisma.redditAnalysis.findMany({
        skip,
        take: limit,
        orderBy: { analyzed_at: 'desc' },
        include: {
          post: {
            select: {
              title: true,
              subreddit: true,
              score: true,
              has_image: true
            }
          }
        }
      }),
      prisma.redditAnalysis.count()
    ]);

    res.json({
      success: true,
      data: {
        analyses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get analysis results error:', error);
    res.status(500).json({ error: 'Failed to get analysis results' });
  }
});

// Get category suggestions
router.get('/category-suggestions', async (req: AuthenticatedRequest, res) => {
  try {
    const suggestions = await prisma.categorySuggestion.findMany({
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Get category suggestions error:', error);
    res.status(500).json({ error: 'Failed to get category suggestions' });
  }
});

// Review category suggestion
router.post('/category-suggestions/:id/review', async (req: AuthenticatedRequest, res) => {
  try {
    const { approved, notes } = req.body;
    const suggestionId = req.params.id;

    const suggestion = await prisma.categorySuggestion.update({
      where: { id: suggestionId },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        admin_notes: notes,
        reviewed_by: req.user!.id,
        reviewed_at: new Date()
      }
    });

    // If approved, create root cause
    if (approved) {
      await prisma.rootCause.create({
        data: {
          name: suggestion.suggested_category,
          category: categorizeNewCategory(suggestion.suggested_category),
          description: suggestion.description,
          visual_indicators: suggestion.visual_indicators,
          standard_root_cause: suggestion.description,
          standard_solutions: suggestion.suggested_solutions,
          standard_recommendations: suggestion.suggested_solutions.map(s => `Consider: ${s}`)
        }
      });
    }

    // Log admin action
    await prisma.adminAction.create({
      data: {
        admin_id: req.user!.id,
        action_type: 'CATEGORY_REVIEW',
        target_type: 'CATEGORY_SUGGESTION',
        target_id: suggestionId,
        details: { approved, notes }
      }
    });

    res.json({
      success: true,
      data: suggestion
    });
  } catch (error) {
    console.error('Review category suggestion error:', error);
    res.status(500).json({ error: 'Failed to review category suggestion' });
  }
});

// Helper function
function categorizeNewCategory(categoryName: string): 'DISEASE' | 'PEST' | 'ENVIRONMENTAL' | 'MAINTENANCE' | 'WEED' {
  const name = categoryName.toLowerCase();
  if (name.includes('disease') || name.includes('fungal')) return 'DISEASE';
  if (name.includes('pest') || name.includes('insect') || name.includes('grub')) return 'PEST';
  if (name.includes('weed')) return 'WEED';
  if (name.includes('mowing') || name.includes('maintenance')) return 'MAINTENANCE';
  return 'ENVIRONMENTAL';
}

export default router;