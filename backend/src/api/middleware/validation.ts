/**
 * Validation middleware for evaluation submissions
 * 
 * Validates:
 * - Email format (required)
 * - URL format and protocol (HTTP/HTTPS only, optional)
 * - File format (PDF, PPTX, DOCX) and size (max 50MB)
 * - At least one of URL or files must be provided
 */

import { Request, Response, NextFunction } from 'express';

// Multer file type from @types/multer
type MulterFile = Express.Multer.File;

export interface ValidationError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
];

const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.pptx', '.docx'];

export function validateSubmission(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: ValidationError[] = [];

  // Validate email (required)
  const email = req.body.email;
  if (!email) {
    errors.push({
      error: 'VALIDATION_ERROR',
      message: 'Email address is required',
    });
  } else if (!isValidEmail(email)) {
    errors.push({
      error: 'VALIDATION_ERROR',
      message: 'Invalid email format',
    });
  }

  // Validate URL if provided
  const url = req.body.url;
  if (url && !isValidURL(url)) {
    errors.push({
      error: 'VALIDATION_ERROR',
      message: 'Invalid URL format. Must be a valid HTTP or HTTPS URL',
    });
  }

  // Validate files if provided
  const files = req.files as MulterFile[] | undefined;
  if (files && files.length > 0) {
    for (const file of files) {
      const fileError = validateFile(file);
      if (fileError) {
        errors.push(fileError);
      }
    }
  }

  // Ensure at least one of URL or files is provided
  if (!url && (!files || files.length === 0)) {
    errors.push({
      error: 'VALIDATION_ERROR',
      message: 'Either a URL or at least one file must be provided',
    });
  }

  // If there are errors, return appropriate status code
  if (errors.length > 0) {
    // Check if any error is FILE_TOO_LARGE (should return 413)
    const hasFileTooLarge = errors.some((e) => e.error === 'FILE_TOO_LARGE');
    const statusCode = hasFileTooLarge ? 413 : 400;

    res.status(statusCode).json({
      error: errors[0].error,
      message: errors.map((e) => e.message).join('; '),
      details: errors,
    });
    return;
  }

  // Validation passed
  next();
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Must be HTTP or HTTPS
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateFile(file: MulterFile): ValidationError | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      error: 'FILE_TOO_LARGE',
      message: `File "${file.originalname}" exceeds the maximum size of 50MB`,
    };
  }

  // Check file type by MIME type
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    return {
      error: 'VALIDATION_ERROR',
      message: `File "${file.originalname}" has unsupported format. Supported formats: PDF, PPTX, DOCX`,
    };
  }

  // Also check by file extension as a fallback
  const extension = getFileExtension(file.originalname).toLowerCase();
  if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    return {
      error: 'VALIDATION_ERROR',
      message: `File "${file.originalname}" has unsupported format. Supported formats: PDF, PPTX, DOCX`,
    };
  }

  // Check for path traversal in filename
  if (containsPathTraversal(file.originalname)) {
    return {
      error: 'VALIDATION_ERROR',
      message: `File "${file.originalname}" has invalid filename`,
    };
  }

  return null;
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.substring(lastDot) : '';
}

function containsPathTraversal(filename: string): boolean {
  return filename.includes('..') || filename.includes('/') || filename.includes('\\');
}

