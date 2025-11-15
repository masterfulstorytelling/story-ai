/**
 * Unit tests for GDPR data deletion endpoint
 *
 * TDD: These tests verify GDPR-compliant data deletion functionality.
 *
 * T100: Implement GDPR data deletion endpoint in backend/src/api/routes/dataDeletion.ts
 */

import request from 'supertest';
import express from 'express';

// Mock services - these are function-based, not class-based
const mockFirestoreInstance = {
  collection: jest.fn(),
};

jest.mock('../../../../src/services/firestoreService', () => {
  return {
    getFirestore: jest.fn(() => mockFirestoreInstance),
    COLLECTIONS: {
      EVALUATION_REQUESTS: 'evaluation_requests',
      REPORTS: 'reports',
      AUDIENCES: 'audiences',
      EVALUATIONS: 'evaluations',
      PARSED_CONTENT: 'parsed_content',
      SCRAPED_CONTENT: 'scraped_content',
    },
  };
});

jest.mock('../../../../src/services/storageService', () => {
  const mockFile = {
    delete: jest.fn().mockResolvedValue(undefined),
  };
  return {
    getBucket: jest.fn((_bucketName?: string) => ({
      file: jest.fn(() => mockFile),
    })),
    BUCKETS: {
      UPLOADS: 'storyai-uploads',
      REPORTS: 'storyai-reports',
    },
  };
});

import routes from '../../../../src/api/routes';

const app = express();
app.use(express.json());
app.use(routes); // Mount all routes (includes /v1 prefix from index.ts)

describe('GDPR Data Deletion Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default empty state after clearing
    mockFirestoreInstance.collection.mockReturnValue({
      where: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          empty: true,
          docs: [],
        }),
      })),
    });
  });

  describe('POST /v1/data-deletion', () => {
    it('should require email parameter', async () => {
      const response = await request(app).post('/v1/data-deletion').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('MISSING_EMAIL');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/v1/data-deletion')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('INVALID_EMAIL');
    });

    it('should return success even if no data found', async () => {
      // Mock returns empty result (already set in beforeEach)

      const response = await request(app)
        .post('/v1/data-deletion')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(0);
    });

    it('should delete all user data for valid email', async () => {
      // Mock evaluation request with data
      const mockSubcollection = {
        get: jest.fn().mockResolvedValue({ docs: [] }),
      };

      const mockDoc = {
        id: 'submission-123',
        data: () => ({
          email: 'user@example.com',
          uploaded_files: [
            {
              file_path: 'gs://storyai-uploads/submissions/file1.pdf',
            },
          ],
        }),
        ref: {
          collection: jest.fn(() => mockSubcollection),
          delete: jest.fn().mockResolvedValue(undefined),
        },
      };

      const mockQueryResult = {
        empty: false,
        docs: [mockDoc],
      };

      const mockQuery = {
        get: jest.fn().mockResolvedValue(mockQueryResult),
      };

      const mockCollection = {
        where: jest.fn(() => mockQuery),
      };

      // Override the collection mock for this test - must be AFTER beforeEach
      // Use mockReturnValueOnce to override just for this call
      mockFirestoreInstance.collection.mockReturnValueOnce(mockCollection);

      const response = await request(app)
        .post('/v1/data-deletion')
        .send({ email: 'user@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBe(1);
      expect(response.body.message).toContain('deleted');
    });
  });
});
