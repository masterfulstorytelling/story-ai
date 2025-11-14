import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Request error', err, {
    method: req.method,
    path: req.path,
    statusCode: err.statusCode,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

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

