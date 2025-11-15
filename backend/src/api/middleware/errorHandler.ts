import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { errorTrackingService } from '../../services/errorTrackingService';
import { createAlertingService, AlertingConfig } from '../../services/alertingService';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

// Initialize alerting service with configuration
const alertingConfig: AlertingConfig = {
  highErrorRate: {
    threshold: 0.1, // 10% error rate
    handler: (alert) => {
      logger.warn('Alert triggered', {
        alertType: alert.type,
        severity: alert.severity,
        message: alert.message,
        context: alert.context,
      });
    },
  },
  longProcessingTime: {
    threshold: 15 * 60 * 1000, // 15 minutes
    handler: (alert) => {
      logger.warn('Alert triggered', {
        alertType: alert.type,
        severity: alert.severity,
        message: alert.message,
        context: alert.context,
      });
    },
  },
};

const alertingService = createAlertingService(alertingConfig);

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const context = {
    method: req.method,
    path: req.path,
    statusCode: err.statusCode,
    ip: req.ip,
  };

  logger.error('Request error', err, context);

  // Track error for monitoring (already done in logger.error, but ensure context is captured)
  if (err instanceof Error) {
    errorTrackingService.captureError(err, context);
  }

  // Record error for alerting
  alertingService.recordError();
  alertingService.checkAlerts();

  const statusCode = err.statusCode || 500;

  // Provide user-friendly error messages
  let message = err.message || 'An unexpected error occurred. Please try again later.';

  // Map common error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    VALIDATION_ERROR:
      'The information you provided is invalid. Please check your input and try again.',
    RATE_LIMIT_EXCEEDED: 'You have submitted too many requests. Please wait before trying again.',
    FILE_TOO_LARGE: 'The file you uploaded is too large. Please upload a file smaller than 50MB.',
    INVALID_FILE_TYPE: 'The file type is not supported. Please upload a PDF, PPTX, or DOCX file.',
    MISSING_EMAIL: 'Email address is required.',
    INVALID_EMAIL: 'Please provide a valid email address.',
    NOT_FOUND: 'The requested resource was not found.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    INTERNAL_ERROR: 'An internal error occurred. Our team has been notified and will investigate.',
  };

  // Use user-friendly message if available, otherwise use original message
  const errorCode = err.code || 'INTERNAL_ERROR';
  if (errorMessages[errorCode]) {
    message = errorMessages[errorCode];
  }

  // Don't expose internal error details in production
  const response: { error: string; message: string; details?: unknown } = {
    error: err.code || 'INTERNAL_ERROR',
    message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.details = {
      stack: err.stack,
      ...(err.statusCode && { statusCode: err.statusCode }),
    };
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
