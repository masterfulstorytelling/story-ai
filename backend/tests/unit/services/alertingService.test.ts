/**
 * Unit tests for Alerting service
 *
 * TDD: These tests verify alerting functionality for monitoring
 * error rates, processing times, and triggering alerts.
 *
 * T096: Implement monitoring and alerting (Cloud Logging, error tracking)
 */

import { AlertingService } from '../../../src/services/alertingService';

describe('AlertingService', () => {
  let alertingService: AlertingService;
  let mockAlertHandler: jest.Mock;

  beforeEach(() => {
    mockAlertHandler = jest.fn();
    alertingService = new AlertingService({
      highErrorRate: { threshold: 0.1, handler: mockAlertHandler },
      longProcessingTime: { threshold: 900000, handler: mockAlertHandler }, // 15 minutes
    });
  });

  describe('Error Rate Monitoring', () => {
    it('should trigger alert when error rate exceeds threshold', () => {
      // Simulate high error rate (11 errors out of 100 requests = 11%)
      for (let i = 0; i < 11; i++) {
        alertingService.recordError();
      }
      for (let i = 0; i < 89; i++) {
        alertingService.recordSuccess();
      }

      alertingService.checkAlerts();

      expect(mockAlertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'highErrorRate',
          severity: 'warning',
        })
      );
    });

    it('should not trigger alert when error rate is below threshold', () => {
      // Simulate low error rate (5 errors out of 100 requests = 5%)
      for (let i = 0; i < 5; i++) {
        alertingService.recordError();
      }
      for (let i = 0; i < 95; i++) {
        alertingService.recordSuccess();
      }

      alertingService.checkAlerts();

      expect(mockAlertHandler).not.toHaveBeenCalled();
    });
  });

  describe('Processing Time Monitoring', () => {
    it('should trigger alert when processing time exceeds threshold', () => {
      alertingService.recordProcessingTime(1000000); // 16.67 minutes

      alertingService.checkAlerts();

      expect(mockAlertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'longProcessingTime',
          severity: 'warning',
        })
      );
    });

    it('should not trigger alert when processing time is below threshold', () => {
      alertingService.recordProcessingTime(600000); // 10 minutes

      alertingService.checkAlerts();

      expect(mockAlertHandler).not.toHaveBeenCalled();
    });
  });

  describe('Alert Cooldown', () => {
    it('should not trigger duplicate alerts within cooldown period', () => {
      // Trigger first alert
      alertingService.recordProcessingTime(1000000);
      alertingService.checkAlerts();

      expect(mockAlertHandler).toHaveBeenCalledTimes(1);

      // Try to trigger again immediately
      alertingService.recordProcessingTime(1000000);
      alertingService.checkAlerts();

      // Should not trigger again due to cooldown
      expect(mockAlertHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Alert Context', () => {
    it('should include context in alert', () => {
      alertingService.recordError();
      alertingService.recordError();
      alertingService.recordSuccess();
      alertingService.checkAlerts();

      expect(mockAlertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            errorRate: expect.any(Number),
            totalRequests: expect.any(Number),
          }),
        })
      );
    });
  });
});
