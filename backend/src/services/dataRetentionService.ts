/**
 * Data Retention service
 *
 * Implements data retention policies per data-model.md:
 * - Uploaded files: Delete after 30 days
 * - Scraped content: Delete after 30 days
 * - Evaluation requests: Retain for 90 days (delete after)
 * - Generated reports: Retain for 1 year (delete after)
 *
 * T099: Add data retention job (delete old files per data-model.md retention policy)
 */

import { DocumentReference } from '@google-cloud/firestore';
import { getFirestore, COLLECTIONS } from './firestoreService';
import { getBucket, BUCKETS } from './storageService';
import { logger } from '../utils/logger';

export interface CleanupResult {
  deletedCount: number;
  errors: string[];
}

export interface RetentionJobResult {
  uploadedFiles: CleanupResult;
  scrapedContent: CleanupResult;
  evaluationRequests: CleanupResult;
  reports: CleanupResult;
}

export class DataRetentionService {
  private readonly UPLOADED_FILES_RETENTION_DAYS = 30;
  private readonly SCRAPED_CONTENT_RETENTION_DAYS = 30;
  private readonly EVALUATION_REQUESTS_RETENTION_DAYS = 90;
  private readonly REPORTS_RETENTION_DAYS = 365;

  /**
   * Clean up uploaded files older than retention period
   */
  async cleanupOldUploadedFiles(): Promise<CleanupResult> {
    const result: CleanupResult = {
      deletedCount: 0,
      errors: [],
    };

    try {
      const bucket = getBucket(BUCKETS.UPLOADS);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.UPLOADED_FILES_RETENTION_DAYS);

      logger.info('Starting cleanup of old uploaded files', {
        retentionDays: this.UPLOADED_FILES_RETENTION_DAYS,
        cutoffDate: cutoffDate.toISOString(),
      });

      // List all files in the uploads bucket
      const [files] = await bucket.getFiles();

      for (const file of files) {
        try {
          const [metadata] = await file.getMetadata();
          const timeCreatedStr = metadata.timeCreated;

          if (!timeCreatedStr) {
            logger.warn('File missing timeCreated metadata', { fileName: file.name });
            continue;
          }

          const timeCreated = new Date(timeCreatedStr);

          if (timeCreated < cutoffDate) {
            await file.delete();
            result.deletedCount++;
            logger.debug('Deleted old uploaded file', {
              fileName: file.name,
              timeCreated: timeCreated.toISOString(),
            });
          }
        } catch (error) {
          const errorMessage = `Failed to delete file ${file.name}: ${error}`;
          result.errors.push(errorMessage);
          logger.error('Error deleting uploaded file', error, {
            fileName: file.name,
          });
        }
      }

      logger.info('Completed cleanup of old uploaded files', {
        deletedCount: result.deletedCount,
        errorCount: result.errors.length,
      });
    } catch (error) {
      const errorMessage = `Failed to cleanup uploaded files: ${error}`;
      result.errors.push(errorMessage);
      logger.error('Failed to cleanup uploaded files', error);
    }

    return result;
  }

  /**
   * Clean up scraped content older than retention period
   */
  async cleanupOldScrapedContent(): Promise<CleanupResult> {
    const result: CleanupResult = {
      deletedCount: 0,
      errors: [],
    };

    try {
      const firestore = getFirestore();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.SCRAPED_CONTENT_RETENTION_DAYS);

      logger.info('Starting cleanup of old scraped content', {
        retentionDays: this.SCRAPED_CONTENT_RETENTION_DAYS,
        cutoffDate: cutoffDate.toISOString(),
      });

      // Query scraped content older than cutoff date
      const scrapedContentRef = firestore.collection(COLLECTIONS.SCRAPED_CONTENT);
      const query = scrapedContentRef.where('scraped_at', '<', cutoffDate);
      const snapshot = await query.get();

      for (const doc of snapshot.docs) {
        try {
          await doc.ref.delete();
          result.deletedCount++;
          logger.debug('Deleted old scraped content', {
            docId: doc.id,
            scrapedAt: doc.data().scraped_at,
          });
        } catch (error) {
          const errorMessage = `Failed to delete scraped content ${doc.id}: ${error}`;
          result.errors.push(errorMessage);
          logger.error('Error deleting scraped content', error, {
            docId: doc.id,
          });
        }
      }

      logger.info('Completed cleanup of old scraped content', {
        deletedCount: result.deletedCount,
        errorCount: result.errors.length,
      });
    } catch (error) {
      const errorMessage = `Failed to cleanup scraped content: ${error}`;
      result.errors.push(errorMessage);
      logger.error('Failed to cleanup scraped content', error);
    }

    return result;
  }

  /**
   * Clean up evaluation requests older than retention period
   */
  async cleanupOldEvaluationRequests(): Promise<CleanupResult> {
    const result: CleanupResult = {
      deletedCount: 0,
      errors: [],
    };

    try {
      const firestore = getFirestore();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.EVALUATION_REQUESTS_RETENTION_DAYS);

      logger.info('Starting cleanup of old evaluation requests', {
        retentionDays: this.EVALUATION_REQUESTS_RETENTION_DAYS,
        cutoffDate: cutoffDate.toISOString(),
      });

      // Query evaluation requests older than cutoff date
      const evaluationRequestsRef = firestore.collection(COLLECTIONS.EVALUATION_REQUESTS);
      const query = evaluationRequestsRef.where('submitted_at', '<', cutoffDate);
      const snapshot = await query.get();

      for (const doc of snapshot.docs) {
        try {
          // Delete the document and all subcollections
          await this.deleteEvaluationRequestWithSubcollections(doc.ref);
          result.deletedCount++;
          logger.debug('Deleted old evaluation request', {
            docId: doc.id,
            submittedAt: doc.data().submitted_at,
          });
        } catch (error) {
          const errorMessage = `Failed to delete evaluation request ${doc.id}: ${error}`;
          result.errors.push(errorMessage);
          logger.error('Error deleting evaluation request', error, {
            docId: doc.id,
          });
        }
      }

      logger.info('Completed cleanup of old evaluation requests', {
        deletedCount: result.deletedCount,
        errorCount: result.errors.length,
      });
    } catch (error) {
      const errorMessage = `Failed to cleanup evaluation requests: ${error}`;
      result.errors.push(errorMessage);
      logger.error('Failed to cleanup evaluation requests', error);
    }

    return result;
  }

  /**
   * Clean up reports older than retention period
   */
  async cleanupOldReports(): Promise<CleanupResult> {
    const result: CleanupResult = {
      deletedCount: 0,
      errors: [],
    };

    try {
      const firestore = getFirestore();
      const bucket = getBucket(BUCKETS.REPORTS);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.REPORTS_RETENTION_DAYS);

      logger.info('Starting cleanup of old reports', {
        retentionDays: this.REPORTS_RETENTION_DAYS,
        cutoffDate: cutoffDate.toISOString(),
      });

      // Query reports older than cutoff date
      const reportsRef = firestore.collection(COLLECTIONS.REPORTS);
      const query = reportsRef.where('generated_at', '<', cutoffDate);
      const snapshot = await query.get();

      for (const doc of snapshot.docs) {
        try {
          const reportData = doc.data();

          // Delete PDF file from Cloud Storage if it exists
          if (reportData.pdf_file_path) {
            // Extract path from gs://bucket/path format
            const pathMatch = reportData.pdf_file_path.match(/gs:\/\/[^/]+\/(.+)/);
            if (pathMatch) {
              const filePath = pathMatch[1];
              const file = bucket.file(filePath);
              try {
                await file.delete();
                logger.debug('Deleted report PDF file', {
                  filePath,
                  reportId: doc.id,
                });
              } catch (fileError) {
                // Log but don't fail - file might already be deleted
                logger.warn('Failed to delete report PDF file', {
                  filePath,
                  reportId: doc.id,
                  error: fileError,
                });
              }
            }
          }

          // Delete Firestore document
          await doc.ref.delete();
          result.deletedCount++;
          logger.debug('Deleted old report', {
            reportId: doc.id,
            generatedAt: reportData.generated_at,
          });
        } catch (error) {
          const errorMessage = `Failed to delete report ${doc.id}: ${error}`;
          result.errors.push(errorMessage);
          logger.error('Error deleting report', error, {
            reportId: doc.id,
          });
        }
      }

      logger.info('Completed cleanup of old reports', {
        deletedCount: result.deletedCount,
        errorCount: result.errors.length,
      });
    } catch (error) {
      const errorMessage = `Failed to cleanup reports: ${error}`;
      result.errors.push(errorMessage);
      logger.error('Failed to cleanup reports', error);
    }

    return result;
  }

  /**
   * Delete an evaluation request and all its subcollections
   */
  private async deleteEvaluationRequestWithSubcollections(
    docRef: DocumentReference
  ): Promise<void> {
    // Delete subcollections: audiences, evaluations, reports, parsed_content, scraped_content
    const subcollections = [
      COLLECTIONS.AUDIENCES,
      COLLECTIONS.EVALUATIONS,
      COLLECTIONS.REPORTS,
      COLLECTIONS.PARSED_CONTENT,
      COLLECTIONS.SCRAPED_CONTENT,
    ];

    for (const subcollectionName of subcollections) {
      const subcollectionRef = docRef.collection(subcollectionName);
      const snapshot = await subcollectionRef.get();

      for (const subDoc of snapshot.docs) {
        await subDoc.ref.delete();
      }
    }

    // Delete the main document
    await docRef.delete();
  }

  /**
   * Run the complete data retention job
   */
  async runRetentionJob(): Promise<RetentionJobResult> {
    logger.info('Starting data retention job');

    const [uploadedFiles, scrapedContent, evaluationRequests, reports] = await Promise.all([
      this.cleanupOldUploadedFiles(),
      this.cleanupOldScrapedContent(),
      this.cleanupOldEvaluationRequests(),
      this.cleanupOldReports(),
    ]);

    const result: RetentionJobResult = {
      uploadedFiles,
      scrapedContent,
      evaluationRequests,
      reports,
    };

    const totalDeleted =
      uploadedFiles.deletedCount +
      scrapedContent.deletedCount +
      evaluationRequests.deletedCount +
      reports.deletedCount;
    const totalErrors =
      uploadedFiles.errors.length +
      scrapedContent.errors.length +
      evaluationRequests.errors.length +
      reports.errors.length;

    logger.info('Completed data retention job', {
      totalDeleted,
      totalErrors,
      details: result,
    });

    return result;
  }
}

export const dataRetentionService = new DataRetentionService();
