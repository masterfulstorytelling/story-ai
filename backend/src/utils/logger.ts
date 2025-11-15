import { cloudLoggingService } from '../services/cloudLoggingService';
import { errorTrackingService } from '../services/errorTrackingService';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private formatMessage(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): string {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(metadata && { metadata }),
    };
    return JSON.stringify(entry);
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    const formatted = this.formatMessage('debug', message, metadata);
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatted);
    }
    // Send to Cloud Logging (async, fire and forget)
    cloudLoggingService.debug(message, metadata).catch(() => {
      // Already handled in cloudLoggingService
    });
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    const formatted = this.formatMessage('info', message, metadata);
    console.log(formatted);
    // Send to Cloud Logging (async, fire and forget)
    cloudLoggingService.info(message, metadata).catch(() => {
      // Already handled in cloudLoggingService
    });
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    const formatted = this.formatMessage('warn', message, metadata);
    console.warn(formatted);
    // Send to Cloud Logging (async, fire and forget)
    cloudLoggingService.warn(message, metadata).catch(() => {
      // Already handled in cloudLoggingService
    });
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    const errorMetadata = {
      ...metadata,
      ...(error instanceof Error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };
    const formatted = this.formatMessage('error', message, errorMetadata);
    console.error(formatted);

    // Track error for monitoring
    if (error instanceof Error) {
      errorTrackingService.captureError(error, metadata);
    }

    // Send to Cloud Logging (async, fire and forget)
    cloudLoggingService.error(message, error, metadata).catch(() => {
      // Already handled in cloudLoggingService
    });
  }
}

export const logger = new Logger();
