import { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  notFoundHandler,
  AppError,
} from '../../../../src/api/middleware/errorHandler';
import { logger } from '../../../../src/utils/logger';

jest.mock('../../../../src/utils/logger');

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      method: 'GET',
      path: '/test',
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle errors with status code', () => {
      const error: AppError = new Error('Not found') as AppError;
      error.statusCode = 404;
      error.code = 'NOT_FOUND';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'NOT_FOUND',
        message: 'The requested resource was not found.',
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should default to 500 for errors without status code', () => {
      const error = new Error('Internal error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'INTERNAL_ERROR',
        message: 'An internal error occurred. Our team has been notified and will investigate.',
      });
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            stack: expect.any(String),
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.not.objectContaining({
          details: expect.anything(),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should log error with request metadata', () => {
      const error = new Error('Test error');
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith(
        'Request error',
        error,
        expect.objectContaining({
          method: 'GET',
          path: '/test',
        })
      );
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with route information', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'NOT_FOUND',
        message: 'Route GET /test not found',
      });
    });
  });
});
