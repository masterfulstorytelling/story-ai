/**
 * Evaluation routes
 *
 * POST /evaluations - Submit content for evaluation
 * GET /evaluations/:id - Get evaluation status and results
 */

import { Router, Request, Response } from 'express';

// Multer file type from @types/multer
type MulterFile = Express.Multer.File;
import { validateSubmission } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';
import { fileUploadMiddleware } from '../middleware/fileUpload';
import { createSubmission } from '../../services/submissionService';
import { sendConfirmationEmail } from '../../services/emailService';
import { getFirestore, COLLECTIONS } from '../../services/firestoreService';
import { EvaluationRequest } from '../../models/EvaluationRequest';
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

/**
 * GET /evaluations/:id
 * Get evaluation status and results
 */
router.get('/evaluations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Evaluation ID is required' });
      return;
    }

    logger.info('Fetching evaluation status', { id });

    const firestore = getFirestore();

    // Fetch evaluation request
    const requestRef = firestore.collection(COLLECTIONS.EVALUATION_REQUESTS).doc(id);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      logger.warn('Evaluation request not found', { id });
      res.status(404).json({ error: 'Evaluation not found' });
      return;
    }

    const evaluationRequest = EvaluationRequest.fromJSON(requestDoc.data()!);

    // Fetch processing result if available
    const evaluationRef = firestore.collection(COLLECTIONS.EVALUATIONS).doc(id);
    const evaluationDoc = await evaluationRef.get();

    // Build response
    const response: {
      id: string;
      status: string;
      submitted_at: string;
      email: string;
      url?: string;
      processing_started_at?: string;
      completed_at?: string;
      error_message?: string;
      estimated_completion_time?: string;
      result?: {
        audiences?: Array<Record<string, unknown>>;
        assessments?: Record<string, unknown>;
        report?: Record<string, unknown> | null;
        validated_citations?: Array<Record<string, unknown>>;
      };
    } = {
      id: evaluationRequest.id,
      status: evaluationRequest.status,
      submitted_at: evaluationRequest.submitted_at.toISOString(),
      email: evaluationRequest.email,
    };

    // Add optional fields from evaluation request
    if (evaluationRequest.url) {
      response.url = evaluationRequest.url;
    }
    if (evaluationRequest.processing_started_at) {
      response.processing_started_at = evaluationRequest.processing_started_at.toISOString();
    }
    if (evaluationRequest.completed_at) {
      response.completed_at = evaluationRequest.completed_at.toISOString();
    }
    if (evaluationRequest.error_message) {
      response.error_message = evaluationRequest.error_message;
    }

    // Add processing result if available
    if (evaluationDoc.exists) {
      const evaluationData = evaluationDoc.data()!;
      response.result = {
        audiences: evaluationData.audiences,
        assessments: evaluationData.assessments,
        report: evaluationData.report,
        validated_citations: evaluationData.validated_citations,
      };
    }

    // Calculate estimated completion time if still processing
    if (evaluationRequest.status === 'pending' || evaluationRequest.status === 'processing') {
      const estimatedCompletionTime = new Date();
      estimatedCompletionTime.setMinutes(estimatedCompletionTime.getMinutes() + 10);
      response.estimated_completion_time = estimatedCompletionTime.toISOString();
    }

    logger.info('Evaluation status retrieved', {
      id,
      status: evaluationRequest.status,
      hasResult: evaluationDoc.exists,
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error('Failed to get evaluation status', error, {
      id: req.params.id,
    });
    throw error; // Let error handler middleware handle it
  }
});

export default router;
