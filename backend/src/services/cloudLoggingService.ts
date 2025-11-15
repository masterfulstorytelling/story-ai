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
  private disabled: boolean = false;

  constructor(projectId?: string, enableInTests: boolean = false) {
    // Lazy evaluation to avoid accessing env at module load time
    try {
      this.projectId = projectId || env.gcpProjectId;
    } catch {
      // If env is not available (e.g., in tests), disable Cloud Logging
      this.projectId = projectId || 'test-project';
      if (!enableInTests) {
        this.disabled = true;
      }
    }

    // Disable Cloud Logging in test environments or CI unless explicitly enabled
    // This prevents authentication errors when credentials are not available
    if (
      !enableInTests &&
      (process.env.NODE_ENV === 'test' || process.env.CI || process.env.JEST_WORKER_ID)
    ) {
      this.disabled = true;
    }
  }

  private getLog(): ReturnType<Logging['log']> | null {
    if (this.disabled) {
      return null;
    }

    if (!this.log) {
      try {
        this.logging = new Logging({ projectId: this.projectId });
        this.log = this.logging.log('story-eval-mvp');
      } catch {
        // Fail silently if Cloud Logging cannot be initialized
        // Disable Cloud Logging to prevent further attempts
        this.disabled = true;
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
    if (this.disabled) {
      return; // Cloud Logging disabled
    }

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
      // Disable Cloud Logging to prevent further attempts
      this.disabled = true;
      // Only log to console in development, not in tests
      if (process.env.NODE_ENV !== 'test') {
        console.error('Failed to write to Cloud Logging:', err);
      }
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

  async error(message: string, error?: Error | unknown, metadata?: LogMetadata): Promise<void> {
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

// Export singleton instance - initialization is lazy
// Disabled in test/CI environments to prevent authentication errors
export const cloudLoggingService = new CloudLoggingService();
