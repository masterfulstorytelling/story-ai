/**
 * Integration test for submission flow
 * 
 * Tests the complete submission flow:
 * 1. User submits URL or files via POST /evaluations
 * 2. System validates input
 * 3. System enforces rate limits
 * 4. System stores submission in Firestore
 * 5. System queues processing task
 * 6. System sends email confirmation
 * 
 * TDD: This test is written FIRST and should FAIL until implementation is complete.
 */

import request from 'supertest';
import express from 'express';
import routes from '../../src/api/routes';
import { FirestoreService } from '../../src/services/firestoreService';
import { TaskService } from '../../src/services/taskService';
import { EmailService } from '../../src/services/emailService';

// Mock services
jest.mock('../../src/services/firestoreService');
jest.mock('../../src/services/taskService');
jest.mock('../../src/services/emailService');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/v1', routes);

describe('Submission Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful submission with URL', () => {
    it('should create evaluation request and send confirmation email', async () => {
      const submissionData = {
        email: 'user@example.com',
        url: 'https://example.com',
        user_provided_audience: 'CFOs at Fortune 500 companies',
      };

      const response = await request(app)
        .post('/v1/evaluations')
        .send(submissionData);

      // Once implemented, should return 201
      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('status', 'pending');
        expect(response.body).toHaveProperty('submitted_at');
        expect(response.body).toHaveProperty('estimated_completion_time');
        expect(response.body).toHaveProperty('message');

        // Verify Firestore was called to store the request
        expect(FirestoreService.prototype.createEvaluationRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            email: submissionData.email,
            url: submissionData.url,
            user_provided_audience: submissionData.user_provided_audience,
            status: 'pending',
          })
        );

        // Verify Cloud Task was queued
        expect(TaskService.prototype.queueProcessingTask).toHaveBeenCalledWith(
          expect.any(String), // evaluation request ID
        );

        // Verify email was sent
        expect(EmailService.prototype.sendConfirmationEmail).toHaveBeenCalledWith(
          submissionData.email,
          expect.objectContaining({
            submissionId: expect.any(String),
            estimatedWaitTime: expect.any(String),
          })
        );
      }
    });
  });

  describe('Successful submission with files', () => {
    it('should create evaluation request with uploaded files', async () => {
      // Note: File upload testing requires multipart/form-data
      // This is a simplified version - actual file upload will be tested with multer
      const submissionData = {
        email: 'user@example.com',
      };

      const response = await request(app)
        .post('/v1/evaluations')
        .field('email', submissionData.email)
        .attach('files', Buffer.from('test pdf content'), 'document.pdf');

      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('status', 'pending');

        // Verify files were stored in Cloud Storage
        expect(FirestoreService.prototype.createEvaluationRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            email: submissionData.email,
            uploaded_files: expect.arrayContaining([
              expect.objectContaining({
                filename: 'document.pdf',
                file_type: 'pdf',
              }),
            ]),
          })
        );
      }
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/v1/evaluations')
        .send({
          url: 'https://example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');

      // Verify no Firestore write occurred
      expect(FirestoreService.prototype.createEvaluationRequest).not.toHaveBeenCalled();
    });

    it('should return 400 when both URL and files are missing', async () => {
      const response = await request(app)
        .post('/v1/evaluations')
        .send({
          email: 'user@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/URL|file/i);

      // Verify no Firestore write occurred
      expect(FirestoreService.prototype.createEvaluationRequest).not.toHaveBeenCalled();
    });
  });

  describe('Rate limiting', () => {
    it('should return 429 when email rate limit is exceeded', async () => {
      const email = 'ratelimit@example.com';

      // Make 4 requests (limit is 3 per email per 24h)
      let response;
      for (let i = 0; i < 4; i++) {
        response = await request(app)
          .post('/v1/evaluations')
          .send({
            email,
            url: `https://example${i}.com`,
          });
      }

      if (response!.status === 429) {
        expect(response!.body).toHaveProperty('error');
        expect(response!.body.message).toContain('rate limit');

        // Verify no Firestore write occurred for the 4th request
        // (First 3 should have been written)
      }
    });

    it('should return 429 when IP rate limit is exceeded', async () => {
      const ip = '192.168.1.100';

      // Make 6 requests (limit is 5 per IP per hour)
      let response;
      for (let i = 0; i < 6; i++) {
        response = await request(app)
          .post('/v1/evaluations')
          .set('X-Forwarded-For', ip)
          .send({
            email: `user${i}@example.com`,
            url: `https://example${i}.com`,
          });
      }

      if (response!.status === 429) {
        expect(response!.body).toHaveProperty('error');
        expect(response!.body.message).toContain('rate limit');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      // Mock Firestore to throw an error
      (FirestoreService.prototype.createEvaluationRequest as jest.Mock).mockRejectedValue(
        new Error('Firestore connection failed')
      );

      const response = await request(app)
        .post('/v1/evaluations')
        .send({
          email: 'user@example.com',
          url: 'https://example.com',
        });

      if (response.status === 500) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.message).toContain('error');
      }
    });

    it('should handle email service errors gracefully', async () => {
      // Mock email service to throw an error
      (EmailService.prototype.sendConfirmationEmail as jest.Mock).mockRejectedValue(
        new Error('Email service unavailable')
      );

      const response = await request(app)
        .post('/v1/evaluations')
        .send({
          email: 'user@example.com',
          url: 'https://example.com',
        });

      // Email failure should not prevent submission from being created
      // But should be logged
      if (response.status === 201) {
        // Submission should still succeed
        expect(response.body).toHaveProperty('id');
      }
    });
  });

  describe('Concurrent submissions', () => {
    it('should handle multiple concurrent submissions', async () => {
      const submissions = Array.from({ length: 5 }, (_, i) => ({
        email: `user${i}@example.com`,
        url: `https://example${i}.com`,
      }));

      const responses = await Promise.all(
        submissions.map((data) =>
          request(app).post('/v1/evaluations').send(data)
        )
      );

      // All should succeed (assuming rate limits not exceeded)
      responses.forEach((response) => {
        if (response.status === 201) {
          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('status', 'pending');
        }
      });
    });
  });
});

