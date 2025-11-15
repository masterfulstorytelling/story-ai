/**
 * Cloud Logging service
 *
 * Integrates with Google Cloud Logging for structured logging
 * with proper severity levels and metadata.
 *
 * T096: Implement monitoring and alerting (Cloud Logging, error tracking)
 */

import { Logging } from '@google-cloud/logging';
import { env } from '../config/env';

export interface LogMetadata {
  [key: string]: unknown;
}

export interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
}

export class CloudLoggingService {
  private logging: Logging | null = null;
  private log: ReturnType<Logging['log']> | null = null;
  private projectId: string;

  constructor(projectId?: string) {
    // Lazy evaluation to avoid accessing env at module load time
    try {
      this.projectId = projectId || env.gcpProjectId;
    } catch {
      // If env is not available (e.g., in tests), use a default
      this.projectId = projectId || 'test-project';
    }
  }

  private getLog(): ReturnType<Logging['log']> | null {
    if (!this.log) {
      try {
        this.logging = new Logging({ projectId: this.projectId });
        this.log = this.logging.log('story-eval-mvp');
      } catch (err) {
        // Fail silently if Cloud Logging cannot be initialized
        console.error('Failed to initialize Cloud Logging:', err);
        return null;
      }
    }
    return this.log;
  }

  private async writeLog(
    severity: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR',
    message: string,
    metadata?: LogMetadata,
    error?: ErrorDetails
  ): Promise<void> {
    const log = this.getLog();
    if (!log) {
      return; // Cloud Logging not available
    }

    try {
      const entry = log.entry(
        {
          severity,
          resource: {
            type: 'cloud_run_revision',
            labels: {
              project_id: this.projectId,
              service_name: 'story-eval-backend',
            },
          },
        },
        {
          message,
          ...(metadata && { metadata }),
          ...(error && { error }),
        }
      );

      await log.write(entry);
    } catch (err) {
      // Fail silently to avoid breaking application if logging fails
      // Log to console as fallback
      console.error('Failed to write to Cloud Logging:', err);
    }
  }

  async debug(message: string, metadata?: LogMetadata): Promise<void> {
    await this.writeLog('DEBUG', message, metadata);
  }

  async info(message: string, metadata?: LogMetadata): Promise<void> {
    await this.writeLog('INFO', message, metadata);
  }

  async warn(message: string, metadata?: LogMetadata): Promise<void> {
    await this.writeLog('WARNING', message, metadata);
  }

  async error(
    message: string,
    error?: Error | unknown,
    metadata?: LogMetadata
  ): Promise<void> {
    const errorDetails: ErrorDetails | undefined =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined;

    await this.writeLog('ERROR', message, metadata, errorDetails);
  }
}

export const cloudLoggingService = new CloudLoggingService();

