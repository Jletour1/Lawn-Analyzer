import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all root causes (public endpoint)
router.get('/', async (req, res) => {
  try {
    const rootCauses = await prisma.rootCause.findMany({
      orderBy: { name: 'asc' },
      include: {
        treatment_schedules: {
          select: {
            id: true,
            name: true,
            difficulty_level: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: rootCauses
    });
  } catch (error) {
    console.error('Get root causes error:', error);
    res.status(500).json({ error: 'Failed to get root causes' });
  }
});

// Get specific root cause
router.get('/:id', async (req, res) => {
  try {
    const rootCause = await prisma.rootCause.findUnique({
      where: { id: req.params.id },
      include: {
        treatment_schedules: true
      }
    });

    if (!rootCause) {
      return res.status(404).json({ error: 'Root cause not found' });
    }

    res.json({
      success: true,
      data: rootCause
    });
  } catch (error) {
    console.error('Get root cause error:', error);
    res.status(500).json({ error: 'Failed to get root cause' });
  }
});

// Create new root cause (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('category').isIn(['DISEASE', 'PEST', 'ENVIRONMENTAL', 'MAINTENANCE', 'WEED']),
  body('description').trim().isLength({ min: 10, max: 2000 }),
  body('visual_indicators').isArray(),
  body('standard_solutions').isArray()
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const rootCause = await prisma.rootCause.create({
      data: {
        name: req.body.name,
        category: req.body.category,
        description: req.body.description,
        visual_indicators: req.body.visual_indicators,
        standard_root_cause: req.body.standard_root_cause || req.body.description,
        standard_solutions: req.body.standard_solutions,
        standard_recommendations: req.body.standard_recommendations || [],
        products: req.body.products || [],
        confidence_threshold: req.body.confidence_threshold || 0.7,
        success_rate: req.body.success_rate || 0.5,
        seasonal_factors: req.body.seasonal_factors || []
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        admin_id: req.user!.id,
        action_type: 'ROOT_CAUSE_CREATE',
        target_type: 'ROOT_CAUSE',
        target_id: rootCause.id,
        details: { name: rootCause.name }
      }
    });

    res.status(201).json({
      success: true,
      data: rootCause
    });
  } catch (error) {
    console.error('Create root cause error:', error);
    res.status(500).json({ error: 'Failed to create root cause' });
  }
});

// Update root cause (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const rootCause = await prisma.rootCause.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        updated_at: new Date()
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        admin_id: req.user!.id,
        action_type: 'ROOT_CAUSE_UPDATE',
        target_type: 'ROOT_CAUSE',
        target_id: req.params.id,
        details: req.body
      }
    });

    res.json({
      success: true,
      data: rootCause
    });
  } catch (error) {
    console.error('Update root cause error:', error);
    res.status(500).json({ error: 'Failed to update root cause' });
  }
});

// Delete root cause (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    await prisma.rootCause.delete({
      where: { id: req.params.id }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        admin_id: req.user!.id,
        action_type: 'ROOT_CAUSE_DELETE',
        target_type: 'ROOT_CAUSE',
        target_id: req.params.id,
        details: {}
      }
    });

    res.json({
      success: true,
      message: 'Root cause deleted successfully'
    });
  } catch (error) {
    console.error('Delete root cause error:', error);
    res.status(500).json({ error: 'Failed to delete root cause' });
  }
});

export default router;