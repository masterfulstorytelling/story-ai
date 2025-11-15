/**
 * Unit tests for Error Tracking service
 *
 * TDD: These tests verify error tracking functionality for capturing
 * and reporting errors with context for monitoring and alerting.
 *
 * T096: Implement monitoring and alerting (Cloud Logging, error tracking)
 */

import { ErrorTrackingService } from '../../../src/services/errorTrackingService';

describe('ErrorTrackingService', () => {
  let errorTrackingService: ErrorTrackingService;

  beforeEach(() => {
    errorTrackingService = new ErrorTrackingService();
  });

  describe('Error Capture', () => {
    it('should capture error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', endpoint: '/test' };

      errorTrackingService.captureError(error, context);

      const errors = errorTrackingService.getRecentErrors(10);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        error: expect.objectContaining({
          message: 'Test error',
        }),
        context,
        timestamp: expect.any(Date),
      });
    });

    it('should capture error without context', () => {
      const error = new Error('Test error');

      errorTrackingService.captureError(error);

      const errors = errorTrackingService.getRecentErrors(10);
      expect(errors).toHaveLength(1);
      expect(errors[0].context).toBeUndefined();
    });

    it('should include stack trace in captured error', () => {
      const error = new Error('Test error');

      errorTrackingService.captureError(error);

      const errors = errorTrackingService.getRecentErrors(10);
      expect(errors[0].error.stack).toBeDefined();
    });
  });

  describe('Error Retrieval', () => {
    it('should return recent errors in reverse chronological order (most recent first)', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      errorTrackingService.captureError(error1);
      errorTrackingService.captureError(error2);

      const errors = errorTrackingService.getRecentErrors(10);
      expect(errors).toHaveLength(2);
      // Most recent first (reversed)
      expect(errors[0].error.message).toBe('Error 2');
      expect(errors[1].error.message).toBe('Error 1');
    });

    it('should limit returned errors to specified count', () => {
      for (let i = 0; i < 10; i++) {
        errorTrackingService.captureError(new Error(`Error ${i}`));
      }

      const errors = errorTrackingService.getRecentErrors(5);
      expect(errors).toHaveLength(5);
    });

    it('should return empty array when no errors captured', () => {
      const errors = errorTrackingService.getRecentErrors(10);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Error Statistics', () => {
    it('should count errors by type', () => {
      errorTrackingService.captureError(new Error('Type A error'));
      errorTrackingService.captureError(new Error('Type A error'));
      errorTrackingService.captureError(new TypeError('Type B error'));

      const stats = errorTrackingService.getErrorStats();
      expect(stats.total).toBe(3);
      expect(stats.byType).toMatchObject({
        Error: 2,
        TypeError: 1,
      });
    });

    it('should calculate error rate', () => {
      // Simulate errors over time
      for (let i = 0; i < 5; i++) {
        errorTrackingService.captureError(new Error(`Error ${i}`));
      }

      const stats = errorTrackingService.getErrorStats();
      expect(stats.total).toBe(5);
      expect(stats.errorRate).toBeGreaterThan(0);
    });
  });
});
