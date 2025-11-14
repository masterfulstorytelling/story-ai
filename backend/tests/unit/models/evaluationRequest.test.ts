/**
 * Unit tests for EvaluationRequest model validation
 *
 * TDD: These tests are written FIRST and should FAIL until the model is implemented.
 */

import { EvaluationRequest, FileReference } from '../../../src/models/EvaluationRequest';

describe('EvaluationRequest Model', () => {
  describe('Validation', () => {
    it('should create valid request with email and URL', () => {
      const request = new EvaluationRequest({
        email: 'user@example.com',
        url: 'https://example.com',
      });

      expect(request.email).toBe('user@example.com');
      expect(request.url).toBe('https://example.com');
      expect(request.status).toBe('pending');
      expect(request.submitted_at).toBeInstanceOf(Date);
      expect(request.id).toBeDefined();
      expect(typeof request.id).toBe('string');
    });

    it('should create valid request with email and files', () => {
      const files: FileReference[] = [
        {
          filename: 'deck.pdf',
          file_path: 'gs://bucket/deck.pdf',
          file_type: 'pdf',
          file_size: 1024000, // 1MB
          uploaded_at: new Date(),
        },
      ];

      const request = new EvaluationRequest({
        email: 'user@example.com',
        uploaded_files: files,
      });

      expect(request.email).toBe('user@example.com');
      expect(request.uploaded_files).toEqual(files);
      expect(request.status).toBe('pending');
    });

    it('should create valid request with email, URL, and optional audience', () => {
      const request = new EvaluationRequest({
        email: 'user@example.com',
        url: 'https://example.com',
        user_provided_audience: 'CFOs at Fortune 500 companies',
      });

      expect(request.email).toBe('user@example.com');
      expect(request.url).toBe('https://example.com');
      expect(request.user_provided_audience).toBe('CFOs at Fortune 500 companies');
    });

    it('should throw error when email is missing', () => {
      expect(() => {
        // Intentionally omit email to test validation
        new EvaluationRequest({
          url: 'https://example.com',
        } as Partial<{ email: string; url: string }> as { email: string; url?: string });
      }).toThrow('Email is required');
    });

    it('should throw error when email format is invalid', () => {
      expect(() => {
        new EvaluationRequest({
          email: 'invalid-email',
          url: 'https://example.com',
        });
      }).toThrow('Invalid email format');
    });

    it('should throw error when both URL and files are missing', () => {
      expect(() => {
        new EvaluationRequest({
          email: 'user@example.com',
        });
      }).toThrow('Either URL or uploaded_files must be provided');
    });

    it('should throw error when URL format is invalid', () => {
      expect(() => {
        new EvaluationRequest({
          email: 'user@example.com',
          url: 'not-a-valid-url',
        });
      }).toThrow('Invalid URL format');
    });

    it('should throw error when URL is not HTTP/HTTPS', () => {
      expect(() => {
        new EvaluationRequest({
          email: 'user@example.com',
          url: 'ftp://example.com',
        });
      }).toThrow('URL must be HTTP or HTTPS');
    });

    it('should accept valid HTTP URL', () => {
      const request = new EvaluationRequest({
        email: 'user@example.com',
        url: 'http://example.com',
      });

      expect(request.url).toBe('http://example.com');
    });

    it('should accept valid HTTPS URL', () => {
      const request = new EvaluationRequest({
        email: 'user@example.com',
        url: 'https://example.com',
      });

      expect(request.url).toBe('https://example.com');
    });
  });

  describe('FileReference Validation', () => {
    it('should accept valid PDF file', () => {
      const file: FileReference = {
        filename: 'document.pdf',
        file_path: 'gs://bucket/document.pdf',
        file_type: 'pdf',
        file_size: 1024000, // 1MB
        uploaded_at: new Date(),
      };

      const request = new EvaluationRequest({
        email: 'user@example.com',
        uploaded_files: [file],
      });

      expect(request.uploaded_files).toHaveLength(1);
      expect(request.uploaded_files![0].file_type).toBe('pdf');
    });

    it('should accept valid PPTX file', () => {
      const file: FileReference = {
        filename: 'presentation.pptx',
        file_path: 'gs://bucket/presentation.pptx',
        file_type: 'pptx',
        file_size: 2048000, // 2MB
        uploaded_at: new Date(),
      };

      const request = new EvaluationRequest({
        email: 'user@example.com',
        uploaded_files: [file],
      });

      expect(request.uploaded_files![0].file_type).toBe('pptx');
    });

    it('should accept valid DOCX file', () => {
      const file: FileReference = {
        filename: 'document.docx',
        file_path: 'gs://bucket/document.docx',
        file_type: 'docx',
        file_size: 512000, // 512KB
        uploaded_at: new Date(),
      };

      const request = new EvaluationRequest({
        email: 'user@example.com',
        uploaded_files: [file],
      });

      expect(request.uploaded_files![0].file_type).toBe('docx');
    });

    it('should throw error when file type is invalid', () => {
      expect(() => {
        new EvaluationRequest({
          email: 'user@example.com',
          uploaded_files: [
            {
              filename: 'document.txt',
              file_path: 'gs://bucket/document.txt',
              file_type: 'txt' as 'pdf' | 'pptx' | 'docx',
              file_size: 1024,
              uploaded_at: new Date(),
            },
          ],
        });
      }).toThrow('Invalid file type');
    });

    it('should throw error when file size exceeds 50MB', () => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      expect(() => {
        new EvaluationRequest({
          email: 'user@example.com',
          uploaded_files: [
            {
              filename: 'large.pdf',
              file_path: 'gs://bucket/large.pdf',
              file_type: 'pdf',
              file_size: maxSize + 1,
              uploaded_at: new Date(),
            },
          ],
        });
      }).toThrow('File size exceeds 50MB limit');
    });

    it('should accept file at exactly 50MB limit', () => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      const request = new EvaluationRequest({
        email: 'user@example.com',
        uploaded_files: [
          {
            filename: 'large.pdf',
            file_path: 'gs://bucket/large.pdf',
            file_type: 'pdf',
            file_size: maxSize,
            uploaded_at: new Date(),
          },
        ],
      });

      expect(request.uploaded_files![0].file_size).toBe(maxSize);
    });

    it('should throw error when filename contains path traversal', () => {
      expect(() => {
        new EvaluationRequest({
          email: 'user@example.com',
          uploaded_files: [
            {
              filename: '../../../etc/passwd',
              file_path: 'gs://bucket/../../../etc/passwd',
              file_type: 'pdf',
              file_size: 1024,
              uploaded_at: new Date(),
            },
          ],
        });
      }).toThrow('Invalid filename');
    });
  });

  describe('Status Transitions', () => {
    it('should initialize with pending status', () => {
      const request = new EvaluationRequest({
        email: 'user@example.com',
        url: 'https://example.com',
      });

      expect(request.status).toBe('pending');
    });

    it('should allow transition from pending to processing', () => {
      const request = new EvaluationRequest({
        email: 'user@example.com',
        url: 'https://example.com',
      });

      request.status = 'processing';
      request.processing_started_at = new Date();

      expect(request.status).toBe('processing');
      expect(request.processing_started_at).toBeInstanceOf(Date);
    });

    it('should allow transition from processing to completed', () => {
      const request = new EvaluationRequest({
        email: 'user@example.com',
        url: 'https://example.com',
      });

      request.status = 'processing';
      request.processing_started_at = new Date();
      request.status = 'completed';
      request.completed_at = new Date();

      expect(request.status).toBe('completed');
      expect(request.completed_at).toBeInstanceOf(Date);
    });

    it('should allow transition from processing to failed', () => {
      const request = new EvaluationRequest({
        email: 'user@example.com',
        url: 'https://example.com',
      });

      request.status = 'processing';
      request.processing_started_at = new Date();
      request.status = 'failed';
      request.error_message = 'Processing failed';

      expect(request.status).toBe('failed');
      expect(request.error_message).toBe('Processing failed');
    });

    it('should throw error for invalid status transition', () => {
      const request = new EvaluationRequest({
        email: 'user@example.com',
        url: 'https://example.com',
      });

      expect(() => {
        request.status = 'completed'; // Cannot go from pending directly to completed
      }).toThrow('Invalid status transition');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const request = new EvaluationRequest({
        email: 'user@example.com',
        url: 'https://example.com',
        user_provided_audience: 'CFOs',
      });

      const json = request.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('email', 'user@example.com');
      expect(json).toHaveProperty('url', 'https://example.com');
      expect(json).toHaveProperty('user_provided_audience', 'CFOs');
      expect(json).toHaveProperty('status', 'pending');
      expect(json).toHaveProperty('submitted_at');
      expect(json.submitted_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should create from JSON correctly', () => {
      const json = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        url: 'https://example.com',
        status: 'pending',
        submitted_at: '2025-11-13T12:00:00Z',
      };

      const request = EvaluationRequest.fromJSON(json as Record<string, unknown>);

      expect(request.id).toBe(json.id);
      expect(request.email).toBe(json.email);
      expect(request.url).toBe(json.url);
      expect(request.status).toBe('pending');
      expect(request.submitted_at).toBeInstanceOf(Date);
    });
  });
});
