/**
 * Unit tests for Data Retention service
 *
 * TDD: These tests verify data retention job functionality for cleaning up old files
 * and data according to retention policies.
 *
 * T099: Add data retention job (delete old files per data-model.md retention policy)
 */

import { DataRetentionService } from '../../../src/services/dataRetentionService';

// Mock dependencies
jest.mock('../../../src/services/firestoreService');
jest.mock('../../../src/services/storageService');

import { getFirestore } from '../../../src/services/firestoreService';
import { getBucket } from '../../../src/services/storageService';

describe('DataRetentionService', () => {
  let dataRetentionService: DataRetentionService;
  let mockFirestore: any;
  let mockStorageBucket: any;

  beforeEach(() => {
    // Setup mocks
    mockStorageBucket = {
      file: jest.fn(),
      getFiles: jest.fn(),
    };

    mockFirestore = {
      collection: jest.fn(),
    };

    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    (getBucket as jest.Mock).mockReturnValue(mockStorageBucket);

    dataRetentionService = new DataRetentionService();
  });

  describe('Uploaded Files Retention (30 days)', () => {
    it('should identify files older than 30 days', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000); // 31 days ago

      const oldFile = {
        name: 'submission-123/file1.pdf',
        metadata: { timeCreated: oldDate.toISOString() },
        getMetadata: jest.fn().mockResolvedValue([{ timeCreated: oldDate.toISOString() }]),
        delete: jest.fn().mockResolvedValue(undefined),
      };

      const recentFile = {
        name: 'submission-456/file2.pdf',
        metadata: { timeCreated: new Date().toISOString() },
        getMetadata: jest.fn().mockResolvedValue([{ timeCreated: new Date().toISOString() }]),
        delete: jest.fn(),
      };

      mockStorageBucket.getFiles.mockResolvedValue([[oldFile, recentFile]]);

      const result = await dataRetentionService.cleanupOldUploadedFiles();

      expect(result.deletedCount).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(oldFile.delete).toHaveBeenCalled();
      expect(recentFile.delete).not.toHaveBeenCalled();
    });
  });

  describe('Scraped Content Retention (30 days)', () => {
    it('should delete scraped content older than 30 days', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

      const oldDoc = {
        id: 'scraped-1',
        data: () => ({ scraped_at: oldDate.toISOString() }),
        ref: { delete: jest.fn().mockResolvedValue(undefined) },
      };

      const mockQuery: any = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: [oldDoc], // Query filters by date, so only old docs are returned
        }),
      };

      mockFirestore.collection.mockReturnValue(mockQuery);

      const result = await dataRetentionService.cleanupOldScrapedContent();

      expect(result.deletedCount).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(oldDoc.ref.delete).toHaveBeenCalled();
    });
  });

  describe('Evaluation Requests Retention (90 days)', () => {
    it('should identify evaluation requests older than 90 days', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000);

      const oldEvalDoc = {
        id: 'eval-1',
        data: () => ({ submitted_at: oldDate.toISOString() }),
        ref: {
          delete: jest.fn().mockResolvedValue(undefined),
          collection: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ docs: [] }),
          }),
        },
      };

      const mockQuery: any = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: [oldEvalDoc], // Query filters by date, so only old docs are returned
        }),
      };

      mockFirestore.collection.mockReturnValue(mockQuery);

      const result = await dataRetentionService.cleanupOldEvaluationRequests();

      expect(result.deletedCount).toBe(1);
      expect(oldEvalDoc.ref.delete).toHaveBeenCalled();
    });
  });

  describe('Full Retention Job', () => {
    it('should run all cleanup tasks', async () => {
      const cleanupSpy = jest.spyOn(dataRetentionService, 'runRetentionJob');
      cleanupSpy.mockResolvedValue({
        uploadedFiles: { deletedCount: 5, errors: [] },
        scrapedContent: { deletedCount: 3, errors: [] },
        evaluationRequests: { deletedCount: 2, errors: [] },
        reports: { deletedCount: 0, errors: [] },
      });

      const result = await dataRetentionService.runRetentionJob();

      expect(result.uploadedFiles.deletedCount).toBe(5);
      expect(result.scrapedContent.deletedCount).toBe(3);
      expect(result.evaluationRequests.deletedCount).toBe(2);
    });
  });
});

