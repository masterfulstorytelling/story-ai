/**
 * Unit tests for comprehensive health check endpoint
 *
 * TDD: These tests verify health check functionality including dependency verification.
 *
 * T101: Add health check endpoints for all services
 */

import request from 'supertest';
import express from 'express';

// Mock services
const mockFirestoreInstance = {
  collection: jest.fn(),
};

const mockBucketInstance = {
  exists: jest.fn(),
};

jest.mock('../../../../src/services/firestoreService', () => {
  return {
    getFirestore: jest.fn(() => mockFirestoreInstance),
    COLLECTIONS: {
      EVALUATION_REQUESTS: 'evaluation_requests',
    },
  };
});

jest.mock('../../../../src/services/storageService', () => {
  return {
    getBucket: jest.fn(() => mockBucketInstance),
    BUCKETS: {
      UPLOADS: 'storyai-uploads',
    },
  };
});

import routes from '../../../../src/api/routes';

const app = express();
app.use(express.json());
app.use(routes);

describe('Health Check Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default state
    mockFirestoreInstance.collection.mockReturnValue({
      limit: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
      })),
    });
    mockBucketInstance.exists.mockResolvedValue([true]);
  });

  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should verify Firestore connection when requested', async () => {
      mockFirestoreInstance.collection.mockReturnValue({
        limit: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
        })),
      });
      mockBucketInstance.exists.mockResolvedValue([true]);

      const response = await request(app).get('/health?check=dependencies');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.dependencies).toBeDefined();
      expect(response.body.dependencies.firestore).toBe('healthy');
      expect(response.body.dependencies.cloudStorage).toBe('healthy');
    });

    it('should verify Cloud Storage connection when requested', async () => {
      mockFirestoreInstance.collection.mockReturnValue({
        limit: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
        })),
      });
      mockBucketInstance.exists.mockResolvedValue([true]);

      const response = await request(app).get('/health?check=dependencies');

      expect(response.status).toBe(200);
      expect(response.body.dependencies).toBeDefined();
      expect(response.body.dependencies.cloudStorage).toBe('healthy');
    });

    it('should report unhealthy if Firestore is unavailable', async () => {
      mockFirestoreInstance.collection.mockReturnValue({
        limit: jest.fn(() => ({
          get: jest.fn().mockRejectedValue(new Error('Connection failed')),
        })),
      });
      mockBucketInstance.exists.mockResolvedValue([true]);

      const response = await request(app).get('/health?check=dependencies');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.dependencies.firestore).toBe('unavailable');
    });
  });
});
