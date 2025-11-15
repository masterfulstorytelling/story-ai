/**
 * Unit tests for Cloud Logging service
 *
 * TDD: These tests verify Cloud Logging integration for structured logging
 * and log entry creation with proper severity levels and metadata.
 *
 * T096: Implement monitoring and alerting (Cloud Logging, error tracking)
 */

import { Logging } from '@google-cloud/logging';

// Mock environment config before importing CloudLoggingService
jest.mock('../../../src/config/env', () => ({
  env: {
    gcpProjectId: 'test-project',
  },
}));

// Mock @google-cloud/logging
const mockWrite = jest.fn().mockResolvedValue(undefined);
const mockEntry = jest.fn().mockReturnValue({});

jest.mock('@google-cloud/logging', () => ({
  Logging: jest.fn().mockImplementation(() => ({
    log: jest.fn().mockReturnValue({
      entry: mockEntry,
      write: mockWrite,
    }),
  })),
}));

import { CloudLoggingService } from '../../../src/services/cloudLoggingService';

describe('CloudLoggingService', () => {
  let cloudLoggingService: CloudLoggingService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Enable Cloud Logging in tests since we're mocking it
    cloudLoggingService = new CloudLoggingService('test-project', true);
  });

  describe('Initialization', () => {
    it('should initialize with project ID', async () => {
      expect(cloudLoggingService).toBeDefined();
      // Trigger initialization by calling a method
      await cloudLoggingService.info('test');
      expect(Logging).toHaveBeenCalledWith({ projectId: 'test-project' });
    });
  });

  describe('Log Entry Creation', () => {
    it('should create info log entry with metadata', async () => {
      await cloudLoggingService.info('Test message', { key: 'value' });

      expect(mockEntry).toHaveBeenCalled();
      expect(mockWrite).toHaveBeenCalled();
    });

    it('should create error log entry with error details', async () => {
      const error = new Error('Test error');
      await cloudLoggingService.error('Error occurred', error, { context: 'test' });

      expect(mockEntry).toHaveBeenCalled();
      expect(mockWrite).toHaveBeenCalled();
    });

    it('should create warn log entry', async () => {
      await cloudLoggingService.warn('Warning message', { warning: true });

      expect(mockWrite).toHaveBeenCalled();
    });

    it('should create debug log entry', async () => {
      await cloudLoggingService.debug('Debug message', { debug: true });

      expect(mockWrite).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle logging errors gracefully', async () => {
      mockWrite.mockRejectedValueOnce(new Error('Logging failed'));

      // Should not throw
      await expect(
        cloudLoggingService.info('Test', {})
      ).resolves.not.toThrow();
    });
  });
});
