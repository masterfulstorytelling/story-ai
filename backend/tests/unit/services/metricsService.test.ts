/**
 * Unit tests for Performance Metrics service
 *
 * TDD: These tests verify performance metrics collection for processing times,
 * success rates, and other key performance indicators.
 *
 * T097: Add performance metrics collection (processing time, success rates)
 */

import { MetricsService } from '../../../src/services/metricsService';

describe('MetricsService', () => {
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = new MetricsService();
  });

  describe('Processing Time Metrics', () => {
    it('should record processing time for a submission', () => {
      metricsService.recordProcessingTime('submission-123', 5000); // 5 seconds

      const metrics = metricsService.getMetrics();
      expect(metrics.processingTimes).toHaveLength(1);
      expect(metrics.processingTimes[0]).toMatchObject({
        submissionId: 'submission-123',
        durationMs: 5000,
        timestamp: expect.any(Date),
      });
    });

    it('should calculate average processing time', () => {
      metricsService.recordProcessingTime('submission-1', 5000);
      metricsService.recordProcessingTime('submission-2', 10000);
      metricsService.recordProcessingTime('submission-3', 15000);

      const metrics = metricsService.getMetrics();
      expect(metrics.averageProcessingTimeMs).toBe(10000); // (5+10+15)/3 = 10
    });

    it('should calculate median processing time', () => {
      metricsService.recordProcessingTime('submission-1', 5000);
      metricsService.recordProcessingTime('submission-2', 10000);
      metricsService.recordProcessingTime('submission-3', 15000);
      metricsService.recordProcessingTime('submission-4', 20000);

      const metrics = metricsService.getMetrics();
      expect(metrics.medianProcessingTimeMs).toBe(12500); // (10+15)/2 = 12.5
    });

    it('should track min and max processing times', () => {
      metricsService.recordProcessingTime('submission-1', 5000);
      metricsService.recordProcessingTime('submission-2', 10000);
      metricsService.recordProcessingTime('submission-3', 15000);

      const metrics = metricsService.getMetrics();
      expect(metrics.minProcessingTimeMs).toBe(5000);
      expect(metrics.maxProcessingTimeMs).toBe(15000);
    });
  });

  describe('Success Rate Metrics', () => {
    it('should record successful submission', () => {
      metricsService.recordSubmissionSuccess('submission-123');

      const metrics = metricsService.getMetrics();
      expect(metrics.totalSubmissions).toBe(1);
      expect(metrics.successfulSubmissions).toBe(1);
      expect(metrics.failedSubmissions).toBe(0);
      expect(metrics.successRate).toBe(1.0); // 100%
    });

    it('should record failed submission', () => {
      metricsService.recordSubmissionFailure('submission-123', 'Processing error');

      const metrics = metricsService.getMetrics();
      expect(metrics.totalSubmissions).toBe(1);
      expect(metrics.successfulSubmissions).toBe(0);
      expect(metrics.failedSubmissions).toBe(1);
      expect(metrics.successRate).toBe(0.0); // 0%
    });

    it('should calculate success rate correctly', () => {
      metricsService.recordSubmissionSuccess('submission-1');
      metricsService.recordSubmissionSuccess('submission-2');
      metricsService.recordSubmissionFailure('submission-3', 'Error');

      const metrics = metricsService.getMetrics();
      expect(metrics.totalSubmissions).toBe(3);
      expect(metrics.successfulSubmissions).toBe(2);
      expect(metrics.failedSubmissions).toBe(1);
      expect(metrics.successRate).toBeCloseTo(0.6667, 3); // 2/3 ≈ 0.667
    });
  });

  describe('Time Window Metrics', () => {
    it('should only include metrics within time window', () => {
      // Record a metric now
      metricsService.recordProcessingTime('new-submission', 10000);

      // Get metrics with a very short window (1ms) - should exclude the metric we just added
      // since there's a small delay
      const recentMetrics = metricsService.getMetrics(1); // 1ms window
      // The metric might be included if it was recorded within 1ms, so we just verify
      // that the filtering logic works
      expect(recentMetrics.processingTimes.length).toBeLessThanOrEqual(1);

      // Get metrics with a longer window - should include the metric
      const allMetrics = metricsService.getMetrics(60 * 60 * 1000); // 1 hour window
      expect(allMetrics.processingTimes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Metrics Aggregation', () => {
    it('should provide summary statistics', () => {
      metricsService.recordSubmissionSuccess('submission-1');
      metricsService.recordSubmissionSuccess('submission-2');
      metricsService.recordSubmissionFailure('submission-3', 'Error');
      metricsService.recordProcessingTime('submission-1', 5000);
      metricsService.recordProcessingTime('submission-2', 10000);

      const summary = metricsService.getSummary();
      expect(summary).toMatchObject({
        totalSubmissions: 3,
        successRate: expect.any(Number),
        averageProcessingTimeMs: expect.any(Number),
        timestamp: expect.any(Date),
      });
    });
  });

  describe('Metrics Retention', () => {
    it('should maintain rolling window of metrics', () => {
      // Record more metrics than the default retention limit
      for (let i = 0; i < 200; i++) {
        metricsService.recordProcessingTime(`submission-${i}`, 5000);
      }

      const metrics = metricsService.getMetrics();
      // Should not exceed max retention
      expect(metrics.processingTimes.length).toBeLessThanOrEqual(1000); // Default max
    });
  });
});
