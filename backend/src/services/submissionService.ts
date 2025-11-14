/**
 * Submission service
 *
 * Orchestrates the submission flow:
 * 1. Create EvaluationRequest model
 * 2. Upload files to Cloud Storage (if any)
 * 3. Store evaluation request in Firestore
 * 4. Queue processing task
 *
 * Depends on: EvaluationRequest model, FirestoreService, StorageService, TaskService
 */

import { EvaluationRequest, FileReference } from '../models/EvaluationRequest';
import { getFirestore, COLLECTIONS } from './firestoreService';
import { getBucket, BUCKETS } from './storageService';
import { createTask, TaskPayload } from './taskService';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

// Multer file type from @types/multer
type MulterFile = Express.Multer.File;

export interface SubmissionData {
  email: string;
  url?: string;
  files?: MulterFile[];
  user_provided_audience?: string;
}

export interface SubmissionResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submitted_at: Date;
  estimated_completion_time: Date;
  message: string;
}

/**
 * Process file uploads and return FileReference array
 */
async function processFileUploads(files: MulterFile[]): Promise<FileReference[]> {
  const bucket = getBucket(BUCKETS.UPLOADS);
  const fileReferences: FileReference[] = [];

  for (const file of files) {
    // Generate unique filename to prevent collisions
    const fileId = randomUUID();
    const fileExtension = getFileExtension(file.originalname);
    const cloudFileName = `${fileId}${fileExtension}`;
    const cloudPath = `submissions/${cloudFileName}`;

    // Upload to Cloud Storage
    const cloudFile = bucket.file(cloudPath);
    await cloudFile.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        originalName: file.originalname,
      },
    });

    // Determine file type from extension
    const fileType = getFileTypeFromExtension(fileExtension);

    fileReferences.push({
      filename: file.originalname,
      file_path: `gs://${BUCKETS.UPLOADS}/${cloudPath}`,
      file_type: fileType,
      file_size: file.size,
      uploaded_at: new Date(),
    });

    logger.info('File uploaded to Cloud Storage', {
      originalName: file.originalname,
      cloudPath,
      fileType,
      size: file.size,
    });
  }

  return fileReferences;
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.substring(lastDot) : '';
}

function getFileTypeFromExtension(extension: string): 'pdf' | 'pptx' | 'docx' {
  const ext = extension.toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.pptx') return 'pptx';
  if (ext === '.docx') return 'docx';
  throw new Error(`Unsupported file extension: ${extension}`);
}

/**
 * Create evaluation request submission
 */
export async function createSubmission(data: SubmissionData): Promise<SubmissionResult> {
  try {
    // Process file uploads if any
    let uploadedFiles: FileReference[] | undefined;
    if (data.files && data.files.length > 0) {
      uploadedFiles = await processFileUploads(data.files);
    }

    // Create EvaluationRequest model
    const evaluationRequest = new EvaluationRequest({
      email: data.email,
      url: data.url,
      uploaded_files: uploadedFiles,
      user_provided_audience: data.user_provided_audience,
    });

    // Store in Firestore
    const firestore = getFirestore();
    const docRef = firestore.collection(COLLECTIONS.EVALUATION_REQUESTS).doc(evaluationRequest.id);

    await docRef.set(evaluationRequest.toJSON());

    logger.info('Evaluation request stored in Firestore', {
      id: evaluationRequest.id,
      email: data.email,
      hasUrl: !!data.url,
      hasFiles: !!uploadedFiles && uploadedFiles.length > 0,
    });

    // Queue processing task
    const taskPayload: TaskPayload = {
      submissionId: evaluationRequest.id,
    };

    await createTask(taskPayload);

    logger.info('Processing task queued', {
      submissionId: evaluationRequest.id,
    });

    // Calculate estimated completion time (5-10 minutes from now)
    const estimatedCompletionTime = new Date();
    estimatedCompletionTime.setMinutes(estimatedCompletionTime.getMinutes() + 10);

    return {
      id: evaluationRequest.id,
      status: evaluationRequest.status,
      submitted_at: evaluationRequest.submitted_at,
      estimated_completion_time: estimatedCompletionTime,
      message:
        'Your evaluation request has been received. You will receive a report via email within 10 minutes.',
    };
  } catch (error) {
    logger.error('Failed to create submission', error, {
      email: data.email,
      hasUrl: !!data.url,
      hasFiles: !!data.files && data.files.length > 0,
    });
    throw error;
  }
}
