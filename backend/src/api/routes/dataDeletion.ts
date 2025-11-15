/**
 * GDPR Data Deletion endpoint
 *
 * Implements GDPR-compliant data deletion per data-model.md:
 * - Users can request deletion of all their data
 * - Deletes evaluation requests, files, scraped content, reports
 * - Returns confirmation of deletion
 *
 * T100: Implement GDPR data deletion endpoint in backend/src/api/routes/dataDeletion.ts
 */

import { Router, Request, Response } from 'express';
import { getFirestore, COLLECTIONS } from '../../services/firestoreService';
import { getBucket, BUCKETS } from '../../services/storageService';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * POST /data-deletion
 * Delete all user data for a given email address (GDPR compliance)
 * 
 * Note: Mounted at /v1 in index.ts, so full path is /v1/data-deletion
 */
router.post('/data-deletion', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate email is provided
    if (!email) {
      res.status(400).json({
        error: 'MISSING_EMAIL',
        message: 'Email address is required',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: 'INVALID_EMAIL',
        message: 'Invalid email address format',
      });
      return;
    }

    logger.info('GDPR data deletion request received', { email });

    const firestore = getFirestore();
    let deletedCount = 0;
    const errors: string[] = [];

    // Find all evaluation requests for this email
    const evaluationRequestsRef = firestore.collection(COLLECTIONS.EVALUATION_REQUESTS);
    const query = evaluationRequestsRef.where('email', '==', email);
    const snapshot = await query.get();

    if (snapshot.empty) {
      logger.info('No data found for email', { email });
      res.status(200).json({
        success: true,
        message: 'No data found for this email address',
        deletedCount: 0,
      });
      return;
    }

    // Delete each evaluation request and all associated data
    for (const doc of snapshot.docs) {
      try {
        const evaluationData = doc.data();
        const submissionId = doc.id;

        // Delete uploaded files from Cloud Storage
        if (evaluationData.uploaded_files && Array.isArray(evaluationData.uploaded_files)) {
          const uploadsBucket = getBucket(BUCKETS.UPLOADS);
          for (const fileRef of evaluationData.uploaded_files) {
            if (fileRef.file_path) {
              // Extract path from gs://bucket/path format
              const pathMatch = fileRef.file_path.match(/gs:\/\/[^/]+\/(.+)/);
              if (pathMatch) {
                const filePath = pathMatch[1];
                try {
                  const file = uploadsBucket.file(filePath);
                  await file.delete();
                  logger.debug('Deleted uploaded file', { filePath, submissionId });
                } catch (fileError) {
                  // Log but continue - file might already be deleted
                  logger.warn('Failed to delete uploaded file', {
                    filePath,
                    submissionId,
                    error: fileError,
                  });
                  errors.push(`Failed to delete file ${filePath}`);
                }
              }
            }
          }
        }

        // Delete report PDF if it exists
        const reportsRef = doc.ref.collection(COLLECTIONS.REPORTS);
        const reportsSnapshot = await reportsRef.get();
        const reportsBucket = getBucket(BUCKETS.REPORTS);

        for (const reportDoc of reportsSnapshot.docs) {
          const reportData = reportDoc.data();
          if (reportData.pdf_file_path) {
            const pathMatch = reportData.pdf_file_path.match(/gs:\/\/[^/]+\/(.+)/);
            if (pathMatch) {
              const filePath = pathMatch[1];
              try {
                const file = reportsBucket.file(filePath);
                await file.delete();
                logger.debug('Deleted report PDF', { filePath, submissionId });
              } catch (fileError) {
                logger.warn('Failed to delete report PDF', {
                  filePath,
                  submissionId,
                  error: fileError,
                });
                errors.push(`Failed to delete report PDF ${filePath}`);
              }
            }
          }
          await reportDoc.ref.delete();
        }

        // Delete subcollections: audiences, evaluations, parsed_content, scraped_content
        const subcollections = [
          COLLECTIONS.AUDIENCES,
          COLLECTIONS.EVALUATIONS,
          COLLECTIONS.PARSED_CONTENT,
          COLLECTIONS.SCRAPED_CONTENT,
        ];

        for (const subcollectionName of subcollections) {
          const subcollectionRef = doc.ref.collection(subcollectionName);
          const subSnapshot = await subcollectionRef.get();
          for (const subDoc of subSnapshot.docs) {
            await subDoc.ref.delete();
          }
        }

        // Delete the main evaluation request document
        await doc.ref.delete();
        deletedCount++;

        logger.debug('Deleted evaluation request and all associated data', {
          submissionId,
          email,
        });
      } catch (error) {
        const errorMessage = `Failed to delete evaluation request ${doc.id}: ${error}`;
        errors.push(errorMessage);
        logger.error('Error deleting evaluation request', error, {
          submissionId: doc.id,
          email,
        });
      }
    }

    logger.info('GDPR data deletion completed', {
      email,
      deletedCount,
      errorCount: errors.length,
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted data for ${email}. ${deletedCount} evaluation request(s) and associated data deleted.`,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error('Failed to process GDPR data deletion request', error, {
      email: req.body.email,
    });
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process data deletion request',
    });
  }
});

export default router;

