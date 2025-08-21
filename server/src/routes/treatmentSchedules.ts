import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get treatment schedules
router.get('/', async (req, res) => {
  try {
    const rootCauseId = req.query.rootCauseId as string;
    
    const where = rootCauseId ? { root_cause_id: rootCauseId } : {};
    
    const schedules = await prisma.treatmentSchedule.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        root_cause: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Get treatment schedules error:', error);
    res.status(500).json({ error: 'Failed to get treatment schedules' });
  }
});

// Get specific treatment schedule
router.get('/:id', async (req, res) => {
  try {
    const schedule = await prisma.treatmentSchedule.findUnique({
      where: { id: req.params.id },
      include: {
        root_cause: true
      }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Treatment schedule not found' });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Get treatment schedule error:', error);
    res.status(500).json({ error: 'Failed to get treatment schedule' });
  }
});

// Create treatment schedule (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('root_cause_id').isUUID(),
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('description').trim().isLength({ min: 10, max: 2000 }),
  body('total_duration').trim().isLength({ min: 1, max: 100 }),
  body('difficulty_level').isIn(['BEGINNER', 'INTERMEDIATE', 'EXPERT']),
  body('steps').isArray({ min: 1 }),
  body('success_indicators').isArray()
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    // Verify root cause exists
    const rootCause = await prisma.rootCause.findUnique({
      where: { id: req.body.root_cause_id }
    });

    if (!rootCause) {
      return res.status(404).json({ error: 'Root cause not found' });
    }

    const schedule = await prisma.treatmentSchedule.create({
      data: {
        root_cause_id: req.body.root_cause_id,
        name: req.body.name,
        description: req.body.description,
        total_duration: req.body.total_duration,
        difficulty_level: req.body.difficulty_level,
        steps: req.body.steps,
        success_indicators: req.body.success_indicators
      },
      include: {
        root_cause: true
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        admin_id: req.user!.id,
        action_type: 'TREATMENT_SCHEDULE_CREATE',
        target_type: 'TREATMENT_SCHEDULE',
        target_id: schedule.id,
        details: { name: schedule.name, root_cause: rootCause.name }
      }
    });

    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Create treatment schedule error:', error);
    res.status(500).json({ error: 'Failed to create treatment schedule' });
  }
});

// Update treatment schedule (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const schedule = await prisma.treatmentSchedule.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        updated_at: new Date()
      },
      include: {
        root_cause: true
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        admin_id: req.user!.id,
        action_type: 'TREATMENT_SCHEDULE_UPDATE',
        target_type: 'TREATMENT_SCHEDULE',
        target_id: req.params.id,
        details: req.body
      }
    });

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Update treatment schedule error:', error);
    res.status(500).json({ error: 'Failed to update treatment schedule' });
  }
});

// Delete treatment schedule (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    await prisma.treatmentSchedule.delete({
      where: { id: req.params.id }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        admin_id: req.user!.id,
        action_type: 'TREATMENT_SCHEDULE_DELETE',
        target_type: 'TREATMENT_SCHEDULE',
        target_id: req.params.id,
        details: {}
      }
    });

    res.json({
      success: true,
      message: 'Treatment schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete treatment schedule error:', error);
    res.status(500).json({ error: 'Failed to delete treatment schedule' });
  }
});

export default router;