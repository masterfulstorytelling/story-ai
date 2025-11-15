/**
 * Performance Metrics service
 *
 * Collects and aggregates performance metrics including:
 * - Processing times for submissions
 * - Success/failure rates
 * - Summary statistics
 *
 * T097: Add performance metrics collection (processing time, success rates)
 */

export interface ProcessingTimeMetric {
  submissionId: string;
  durationMs: number;
  timestamp: Date;
}

export interface SubmissionMetric {
  submissionId: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface Metrics {
  processingTimes: ProcessingTimeMetric[];
  submissions: SubmissionMetric[];
  totalSubmissions: number;
  successfulSubmissions: number;
  failedSubmissions: number;
  successRate: number;
  averageProcessingTimeMs: number;
  medianProcessingTimeMs: number;
  minProcessingTimeMs: number;
  maxProcessingTimeMs: number;
}

export interface MetricsSummary {
  totalSubmissions: number;
  successRate: number;
  averageProcessingTimeMs: number;
  medianProcessingTimeMs: number;
  minProcessingTimeMs: number;
  maxProcessingTimeMs: number;
  timestamp: Date;
}

export class MetricsService {
  private processingTimes: ProcessingTimeMetric[] = [];
  private submissions: SubmissionMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  recordProcessingTime(submissionId: string, durationMs: number): void {
    const metric: ProcessingTimeMetric = {
      submissionId,
      durationMs,
      timestamp: new Date(),
    };

    this.processingTimes.push(metric);

    // Maintain rolling window
    if (this.processingTimes.length > this.maxMetrics) {
      this.processingTimes.shift();
    }
  }

  recordSubmissionSuccess(submissionId: string): void {
    const metric: SubmissionMetric = {
      submissionId,
      success: true,
      timestamp: new Date(),
    };

    this.submissions.push(metric);

    // Maintain rolling window
    if (this.submissions.length > this.maxMetrics) {
      this.submissions.shift();
    }
  }

  recordSubmissionFailure(submissionId: string, error: string): void {
    const metric: SubmissionMetric = {
      submissionId,
      success: false,
      error,
      timestamp: new Date(),
    };

    this.submissions.push(metric);

    // Maintain rolling window
    if (this.submissions.length > this.maxMetrics) {
      this.submissions.shift();
    }
  }

  getMetrics(timeWindowMs?: number): Metrics {
    const now = Date.now();
    const windowStart = timeWindowMs ? now - timeWindowMs : 0;

    // Filter metrics within time window
    const recentProcessingTimes = timeWindowMs
      ? this.processingTimes.filter(
          (m) => m.timestamp.getTime() >= windowStart
        )
      : this.processingTimes;

    const recentSubmissions = timeWindowMs
      ? this.submissions.filter((m) => m.timestamp.getTime() >= windowStart)
      : this.submissions;

    // Calculate submission statistics
    const totalSubmissions = recentSubmissions.length;
    const successfulSubmissions = recentSubmissions.filter((m) => m.success)
      .length;
    const failedSubmissions = recentSubmissions.filter((m) => !m.success).length;
    const successRate =
      totalSubmissions > 0 ? successfulSubmissions / totalSubmissions : 0;

    // Calculate processing time statistics
    const durations = recentProcessingTimes.map((m) => m.durationMs);
    const averageProcessingTimeMs =
      durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

    const sortedDurations = [...durations].sort((a, b) => a - b);
    const medianProcessingTimeMs =
      sortedDurations.length > 0
        ? sortedDurations.length % 2 === 0
          ? (sortedDurations[sortedDurations.length / 2 - 1] +
              sortedDurations[sortedDurations.length / 2]) /
            2
          : sortedDurations[Math.floor(sortedDurations.length / 2)]
        : 0;

    const minProcessingTimeMs =
      durations.length > 0 ? Math.min(...durations) : 0;
    const maxProcessingTimeMs =
      durations.length > 0 ? Math.max(...durations) : 0;

    return {
      processingTimes: recentProcessingTimes,
      submissions: recentSubmissions,
      totalSubmissions,
      successfulSubmissions,
      failedSubmissions,
      successRate,
      averageProcessingTimeMs,
      medianProcessingTimeMs,
      minProcessingTimeMs,
      maxProcessingTimeMs,
    };
  }

  getSummary(): MetricsSummary {
    const metrics = this.getMetrics();

    return {
      totalSubmissions: metrics.totalSubmissions,
      successRate: metrics.successRate,
      averageProcessingTimeMs: metrics.averageProcessingTimeMs,
      medianProcessingTimeMs: metrics.medianProcessingTimeMs,
      minProcessingTimeMs: metrics.minProcessingTimeMs,
      maxProcessingTimeMs: metrics.maxProcessingTimeMs,
      timestamp: new Date(),
    };
  }

  clear(): void {
    this.processingTimes = [];
    this.submissions = [];
  }
}

export const metricsService = new MetricsService();

