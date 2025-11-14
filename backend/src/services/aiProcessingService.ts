/**
 * AI Processing Service Client
 *
 * Makes HTTP requests to the FastAPI AI processing service to process
 * evaluation requests through the multi-agent pipeline.
 */

import { env } from '../config/env';
import { logger } from '../utils/logger';
import { EvaluationRequest, FileReference } from '../models/EvaluationRequest';

export interface ProcessingRequest {
  submission_id: string;
  url?: string;
  file_paths?: Array<{
    bucket: string;
    path: string;
    filename: string;
  }>;
  user_provided_audience?: string;
  bucket_name?: string;
}

export interface ProcessingResult {
  submission_id: string;
  audiences: Array<Record<string, unknown>>;
  assessments: Record<string, unknown>;
  report: Record<string, unknown> | null;
  status: 'completed' | 'failed';
  validated_citations: Array<Record<string, unknown>>;
  error?: string;
  // Additional fields from pipeline
  report_content?: string;
  pdf_content?: string;
}

export interface ProcessingError extends Error {
  statusCode?: number;
  response?: unknown;
}

/**
 * Process evaluation request through AI processing service
 *
 * @param evaluationRequest - The evaluation request to process
 * @param bucketName - Cloud Storage bucket name for file downloads
 * @returns Processing result with audiences, assessments, report, etc.
 * @throws ProcessingError if the request fails
 */
export async function processEvaluation(
  evaluationRequest: EvaluationRequest,
  bucketName: string = env.cloudStorageBucket
): Promise<ProcessingResult> {
  const submissionId = evaluationRequest.id;

  logger.info('Calling AI processing service', {
    submissionId,
    hasUrl: !!evaluationRequest.url,
    hasFiles: !!evaluationRequest.uploaded_files,
    userProvidedAudience: !!evaluationRequest.user_provided_audience,
  });

  // Convert FileReference[] to file_paths format expected by API
  const filePaths = evaluationRequest.uploaded_files?.map((file: FileReference) => ({
    bucket: bucketName,
    path: file.file_path,
    filename: file.filename,
  }));

  // Build request payload
  const requestPayload: ProcessingRequest = {
    submission_id: submissionId,
    url: evaluationRequest.url,
    file_paths: filePaths && filePaths.length > 0 ? filePaths : undefined,
    user_provided_audience: evaluationRequest.user_provided_audience,
    bucket_name: bucketName,
  };

  // Remove undefined fields
  const cleanPayload = Object.fromEntries(
    Object.entries(requestPayload).filter(([_, value]) => value !== undefined)
  );

  try {
    const url = `${env.aiProcessingUrl}/process`;
    const timeout = 10 * 60 * 1000; // 10 minutes timeout

    logger.info('Sending request to AI processing service', {
      url,
      submissionId,
    });

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: unknown;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }

      const error: ProcessingError = new Error(
        `AI processing service returned ${response.status}: ${errorText}`
      ) as ProcessingError;
      error.statusCode = response.status;
      error.response = errorData;

      logger.error('AI processing service request failed', error, {
        submissionId,
        statusCode: response.status,
        response: errorData,
      });

      throw error;
    }

    const result: ProcessingResult = await response.json();

    logger.info('AI processing service request completed', {
      submissionId,
      status: result.status,
      audienceCount: result.audiences?.length || 0,
      hasReport: !!result.report,
    });

    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError: ProcessingError = new Error(
        'AI processing service request timed out after 10 minutes'
      ) as ProcessingError;
      timeoutError.statusCode = 504;

      logger.error('AI processing service request timed out', timeoutError, {
        submissionId,
      });

      throw timeoutError;
    }

    // Re-throw ProcessingError as-is
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }

    // Wrap other errors
    const wrappedError: ProcessingError = new Error(
      `Failed to call AI processing service: ${error instanceof Error ? error.message : String(error)}`
    ) as ProcessingError;
    wrappedError.cause = error;

    logger.error('Failed to call AI processing service', wrappedError, {
      submissionId,
    });

    throw wrappedError;
  }
}

