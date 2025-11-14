/**
 * Unit tests for validation middleware
 *
 * Tests validation for:
 * - URL format and accessibility
 * - Email format
 * - File format and size
 *
 * TDD: These tests are written FIRST and should FAIL until the middleware is implemented.
 */

import { Request, Response } from 'express';
import { validateSubmission } from '../../../src/api/middleware/validation';

// Multer file type from @types/multer
type MulterFile = Express.Multer.File;

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });

    mockRequest = {
      body: {},
      files: [],
    };

    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };

    mockNext = jest.fn();
  });

  describe('Email validation', () => {
    it('should pass valid email', () => {
      mockRequest.body = {
        email: 'user@example.com',
        url: 'https://example.com',
      };

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(responseStatus).not.toHaveBeenCalled();
    });

    it('should reject missing email', () => {
      mockRequest.body = {
        url: 'https://example.com',
      };

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      const callArgs = responseJson.mock.calls[0][0];
      expect(callArgs.error).toBeDefined();
      expect(callArgs.message.toLowerCase()).toContain('email');
    });

    it('should reject invalid email format', () => {
      mockRequest.body = {
        email: 'invalid-email',
        url: 'https://example.com',
      };

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          message: expect.stringContaining('email'),
        })
      );
    });

    it('should accept various valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
      ];

      validEmails.forEach((email) => {
        mockRequest.body = {
          email,
          url: 'https://example.com',
        };

        validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        mockNext.mockClear();
      });
    });
  });

  describe('URL validation', () => {
    it('should pass valid HTTPS URL', () => {
      mockRequest.body = {
        email: 'user@example.com',
        url: 'https://example.com',
      };

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass valid HTTP URL', () => {
      mockRequest.body = {
        email: 'user@example.com',
        url: 'http://example.com',
      };

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid URL format', () => {
      mockRequest.body = {
        email: 'user@example.com',
        url: 'not-a-valid-url',
      };

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          message: expect.stringContaining('URL'),
        })
      );
    });

    it('should reject non-HTTP/HTTPS URLs', () => {
      const invalidUrls = ['ftp://example.com', 'file:///path/to/file', 'mailto:user@example.com'];

      invalidUrls.forEach((url) => {
        mockRequest.body = {
          email: 'user@example.com',
          url,
        };

        validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(responseStatus).toHaveBeenCalledWith(400);
        mockNext.mockClear();
        responseStatus.mockClear();
      });
    });

    it('should accept URL with path and query parameters', () => {
      mockRequest.body = {
        email: 'user@example.com',
        url: 'https://example.com/path/to/page?param=value',
      };

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Content requirement validation', () => {
    it('should pass when URL is provided', () => {
      mockRequest.body = {
        email: 'user@example.com',
        url: 'https://example.com',
      };

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass when files are provided', () => {
      mockRequest.body = {
        email: 'user@example.com',
      };
      mockRequest.files = [
        {
          fieldname: 'files',
          originalname: 'document.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 1024000,
          destination: '/tmp',
          filename: 'document.pdf',
          path: '/tmp/document.pdf',
          buffer: Buffer.from('test'),
        } as MulterFile,
      ];

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject when neither URL nor files are provided', () => {
      mockRequest.body = {
        email: 'user@example.com',
      };
      mockRequest.files = [];

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          message: expect.stringContaining('URL') || expect.stringContaining('file'),
        })
      );
    });
  });

  describe('File validation', () => {
    it('should accept valid PDF file', () => {
      mockRequest.body = {
        email: 'user@example.com',
      };
      mockRequest.files = [
        {
          fieldname: 'files',
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          size: 1024000, // 1MB
        } as MulterFile,
      ];

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept valid PPTX file', () => {
      mockRequest.body = {
        email: 'user@example.com',
      };
      mockRequest.files = [
        {
          fieldname: 'files',
          originalname: 'presentation.pptx',
          mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: 2048000, // 2MB
        } as MulterFile,
      ];

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept valid DOCX file', () => {
      mockRequest.body = {
        email: 'user@example.com',
      };
      mockRequest.files = [
        {
          fieldname: 'files',
          originalname: 'document.docx',
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 512000, // 512KB
        } as MulterFile,
      ];

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject unsupported file type', () => {
      mockRequest.body = {
        email: 'user@example.com',
      };
      mockRequest.files = [
        {
          fieldname: 'files',
          originalname: 'document.txt',
          mimetype: 'text/plain',
          size: 1024,
        } as MulterFile,
      ];

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      const callArgs = responseJson.mock.calls[0][0];
      expect(callArgs.message).toMatch(/file format|PDF|PPTX|DOCX/i);
    });

    it('should reject file exceeding 50MB limit', () => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      mockRequest.body = {
        email: 'user@example.com',
      };
      mockRequest.files = [
        {
          fieldname: 'files',
          originalname: 'large.pdf',
          mimetype: 'application/pdf',
          size: maxSize + 1,
        } as MulterFile,
      ];

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(413);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          message: expect.stringContaining('50MB') || expect.stringContaining('file size'),
        })
      );
    });

    it('should accept file at exactly 50MB limit', () => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      mockRequest.body = {
        email: 'user@example.com',
      };
      mockRequest.files = [
        {
          fieldname: 'files',
          originalname: 'large.pdf',
          mimetype: 'application/pdf',
          size: maxSize,
        } as MulterFile,
      ];

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept multiple files within limits', () => {
      mockRequest.body = {
        email: 'user@example.com',
      };
      mockRequest.files = [
        {
          fieldname: 'files',
          originalname: 'document1.pdf',
          mimetype: 'application/pdf',
          size: 1024000,
        },
        {
          fieldname: 'files',
          originalname: 'document2.pdf',
          mimetype: 'application/pdf',
          size: 2048000,
        },
      ] as MulterFile[];

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Optional fields', () => {
    it('should accept optional target audience field', () => {
      mockRequest.body = {
        email: 'user@example.com',
        url: 'https://example.com',
        user_provided_audience: 'CFOs at Fortune 500 companies',
      };

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass when target audience is not provided', () => {
      mockRequest.body = {
        email: 'user@example.com',
        url: 'https://example.com',
      };

      validateSubmission(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
