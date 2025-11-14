/**
 * Cloud Tasks handler for processing evaluation requests
 *
 * This handler is invoked by Cloud Tasks when a processing task is queued.
 * It orchestrates:
 * 1. Fetching the evaluation request from Firestore
 * 2. Calling the AI processing service (T088)
 * 3. Generating and delivering the report (T089)
 * 4. Updating status in Firestore
 */

import { Request, Response } from 'express';
import { getFirestore, COLLECTIONS } from '../../services/firestoreService';
import { EvaluationRequest } from '../../models/EvaluationRequest';
import { logger } from '../../utils/logger';
import { TaskPayload } from '../../services/taskService';
import { processEvaluation as processWithAI } from '../../services/aiProcessingService';
import { deliverReport } from '../../services/reportDeliveryService';

/**
 * Process evaluation request handler
 *
 * Expected request body:
 * {
 *   submissionId: string
 * }
 */
export async function processEvaluationHandler(
  req: Request,
  res: Response
): Promise<void> {
  let submissionId: string | undefined;

  try {
    // Parse request body (Cloud Tasks sends base64-encoded JSON)
    const payload: TaskPayload = req.body;
    submissionId = payload.submissionId;

    if (!submissionId) {
      logger.error('Missing submissionId in task payload', { body: req.body });
      res.status(400).json({ error: 'Missing submissionId in task payload' });
      return;
    }

    logger.info('Processing evaluation request', { submissionId });

    // Fetch evaluation request from Firestore
    const firestore = getFirestore();
    const docRef = firestore
      .collection(COLLECTIONS.EVALUATION_REQUESTS)
      .doc(submissionId);

    const doc = await docRef.get();

    if (!doc.exists) {
      logger.error('Evaluation request not found', { submissionId });
      res.status(404).json({ error: 'Evaluation request not found' });
      return;
    }

    const evaluationRequest = EvaluationRequest.fromJSON(doc.data()!);

    // Update status to processing
    evaluationRequest.status = 'processing';
    await docRef.update(evaluationRequest.toJSON());

    logger.info('Evaluation request status updated to processing', {
      submissionId,
    });

    // Call AI processing service (T088)
    const processingResult = await processWithAI(evaluationRequest);

    if (processingResult.status === 'failed') {
      throw new Error(
        processingResult.error || 'AI processing service returned failed status'
      );
    }

    logger.info('AI processing completed', {
      submissionId,
      audienceCount: processingResult.audiences?.length || 0,
      hasReport: !!processingResult.report,
    });

    // Deliver report via email (T089)
    try {
      await deliverReport({
        evaluationRequest,
        processingResult,
      });
      logger.info('Report delivered successfully', { submissionId });
    } catch (error) {
      // Log error but don't fail the entire processing
      // The report is still stored in Firestore and can be retrieved
      logger.error('Failed to deliver report via email', error, {
        submissionId,
        email: evaluationRequest.email,
      });
      // Continue processing - report is still available via status endpoint
    }

    // Store processing result in Firestore (for T090 status endpoint)
    const evaluationsRef = firestore.collection(COLLECTIONS.EVALUATIONS);
    await evaluationsRef.doc(submissionId).set({
      submission_id: submissionId,
      audiences: processingResult.audiences,
      assessments: processingResult.assessments,
      report: processingResult.report,
      validated_citations: processingResult.validated_citations,
      status: processingResult.status,
      created_at: new Date().toISOString(),
    });

    // Update status to completed
    evaluationRequest.status = 'completed';
    await docRef.update(evaluationRequest.toJSON());

    logger.info('Evaluation request processing completed', { submissionId });

    res.status(200).json({
      success: true,
      submissionId,
      message: 'Evaluation processed successfully',
    });
  } catch (error) {
    logger.error('Failed to process evaluation request', error, {
      submissionId,
    });

    // Update status to failed if we have a submissionId
    if (submissionId) {
      try {
        const firestore = getFirestore();
        const docRef = firestore
          .collection(COLLECTIONS.EVALUATION_REQUESTS)
          .doc(submissionId);

        const doc = await docRef.get();
        if (doc.exists) {
          const evaluationRequest = EvaluationRequest.fromJSON(doc.data()!);
          evaluationRequest.status = 'failed';
          evaluationRequest.error_message =
            error instanceof Error ? error.message : 'Unknown error';
          await docRef.update(evaluationRequest.toJSON());
        }
      } catch (updateError) {
        logger.error('Failed to update status to failed', updateError, {
          submissionId,
        });
      }
    }

    // Return 500 to trigger Cloud Tasks retry (if configured)
    res.status(500).json({
      error: 'Failed to process evaluation request',
      submissionId,
    });
  }
}

