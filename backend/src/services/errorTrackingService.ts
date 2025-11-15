/**
 * Error Tracking service
 *
 * Captures and tracks errors with context for monitoring and alerting.
 * Maintains a rolling window of recent errors for analysis.
 *
 * T096: Implement monitoring and alerting (Cloud Logging, error tracking)
 */

export interface TrackedError {
  error: Error;
  context?: Record<string, unknown>;
  timestamp: Date;
}

export interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  errorRate: number;
  recentErrors: TrackedError[];
}

export class ErrorTrackingService {
  private errors: TrackedError[] = [];
  private readonly maxErrors = 1000; // Keep last 1000 errors
  private readonly windowMs = 60 * 60 * 1000; // 1 hour window for error rate

  captureError(error: Error, context?: Record<string, unknown>): void {
    const trackedError: TrackedError = {
      error,
      context,
      timestamp: new Date(),
    };

    this.errors.push(trackedError);

    // Maintain rolling window
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  getRecentErrors(limit: number = 100): TrackedError[] {
    return this.errors.slice(-limit).reverse(); // Most recent first
  }

  getErrorStats(): ErrorStats {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Filter errors within the time window
    const recentErrors = this.errors.filter(
      (e) => e.timestamp.getTime() >= windowStart
    );

    // Count by type
    const byType: Record<string, number> = {};
    recentErrors.forEach((e) => {
      const type = e.error.constructor.name;
      byType[type] = (byType[type] || 0) + 1;
    });

    // Calculate error rate (errors per minute)
    const windowMinutes = this.windowMs / (60 * 1000);
    const errorRate = recentErrors.length / windowMinutes;

    return {
      total: recentErrors.length,
      byType,
      errorRate,
      recentErrors: recentErrors.slice(-10).reverse(), // Last 10 errors
    };
  }

  clear(): void {
    this.errors = [];
  }
}

export const errorTrackingService = new ErrorTrackingService();

