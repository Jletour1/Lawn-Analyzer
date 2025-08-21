import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { uploadToS3, deleteFromS3 } from '../services/s3Service';
import { analyzeSubmission } from '../services/analysisService';
import { sendNotificationEmail } from '../services/emailService';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Submit new analysis
router.post('/', upload.single('image'), [
  body('user_email').isEmail().normalizeEmail(),
  body('problem_description').trim().isLength({ min: 10, max: 2000 }),
  body('grass_type').optional().trim(),
  body('location').optional().trim(),
  body('season').optional().isIn(['spring', 'summer', 'fall', 'winter'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Upload image to S3
    const imageUpload = await uploadToS3(req.file, 'submissions');
    
    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        user_id: req.user?.id || 'anonymous',
        user_email: req.body.user_email,
        user_name: req.body.user_name,
        user_phone: req.body.user_phone,
        image_url: imageUpload.url,
        image_filename: imageUpload.filename,
        problem_description: req.body.problem_description,
        grass_type: req.body.grass_type,
        location: req.body.location,
        season: req.body.season,
        recent_treatments: req.body.recent_treatments,
        pet_traffic: req.body.pet_traffic === 'true',
        has_dog: req.body.has_dog === 'true'
      }
    });

    // Trigger AI analysis
    try {
      const analysisResult = await analyzeSubmission(submission);
      
      // Update submission with analysis
      await prisma.submission.update({
        where: { id: submission.id },
        data: { analysis_result: analysisResult }
      });

      // Send notification email
      if (req.body.user_email) {
        await sendNotificationEmail(req.body.user_email, {
          submissionId: submission.id,
          analysisResult
        });
      }

      res.json({
        success: true,
        data: {
          id: submission.id,
          analysis: analysisResult
        }
      });
    } catch (analysisError) {
      console.error('Analysis failed:', analysisError);
      
      // Flag for manual review
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          flagged_for_review: true,
          review_reason: 'AI analysis failed'
        }
      });

      res.status(500).json({ 
        error: 'Analysis failed, submission flagged for manual review',
        submissionId: submission.id
      });
    }
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

// Get user's submissions
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { user_id: req.user!.id },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Get specific submission
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const submission = await prisma.submission.findFirst({
      where: {
        id: req.params.id,
        user_id: req.user!.id
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Failed to get submission' });
  }
});

export default router;