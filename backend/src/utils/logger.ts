type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, metadata?: Record<string, unknown>): string {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(metadata && { metadata }),
    };
    return JSON.stringify(entry);
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, metadata));
    }
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    console.log(this.formatMessage('info', message, metadata));
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    console.warn(this.formatMessage('warn', message, metadata));
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
    console.error(this.formatMessage('error', message, errorMetadata));
  }
}

export const logger = new Logger();

