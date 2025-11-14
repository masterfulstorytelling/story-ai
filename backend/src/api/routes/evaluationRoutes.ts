/**
 * Evaluation routes
 *
 * POST /evaluations - Submit content for evaluation
 */

import { Router, Request, Response } from 'express';

// Multer file type from @types/multer
type MulterFile = Express.Multer.File;
import { validateSubmission } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';
import { fileUploadMiddleware } from '../middleware/fileUpload';
import { createSubmission } from '../../services/submissionService';
import { sendConfirmationEmail } from '../../services/emailService';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * POST /evaluations
 * Submit content (URL and/or files) for evaluation
 */
router.post(
  '/evaluations',
  fileUploadMiddleware, // Handle file uploads first
  validateSubmission, // Validate input
  rateLimiter, // Check rate limits
  async (req: Request, res: Response) => {
    try {
      const { email, url, user_provided_audience } = req.body;
      const files = req.files as MulterFile[] | undefined;

      // Create submission
      const submission = await createSubmission({
        email,
        url,
        files,
        user_provided_audience,
      });

      // Send confirmation email (fire and forget - don't block response)
      sendConfirmationEmail(email, {
        submissionId: submission.id,
        estimatedWaitTime: '5-10 minutes',
      }).catch((error) => {
        // Log error but don't fail the request
        logger.error('Failed to send confirmation email', error, {
          submissionId: submission.id,
          email,
        });
      });

      // Return success response
      res.status(201).json({
        id: submission.id,
        status: submission.status,
        submitted_at: submission.submitted_at.toISOString(),
        estimated_completion_time: submission.estimated_completion_time.toISOString(),
        message: submission.message,
      });
    } catch (error) {
      logger.error('Failed to create evaluation submission', error, {
        email: req.body.email,
      });
      throw error; // Let error handler middleware handle it
    }
  }
);

export default router;
