/**
 * File upload middleware using Multer
 *
 * Handles multipart/form-data file uploads with:
 * - 50MB file size limit
 * - Multiple file support
 * - File type validation (handled by validation middleware)
 */

import multer from 'multer';
import type { Request } from 'express';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10; // Maximum number of files per submission

// Configure multer to use memory storage (files in memory as buffers)
const storage = multer.memoryStorage();

// File filter to accept only PDF, PPTX, DOCX
const fileFilter = (_req: Request, file: multer.File, cb: multer.FileFilterCallback): void => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  ];

  const allowedExtensions = ['.pdf', '.pptx', '.docx'];
  const fileExtension = getFileExtension(file.originalname).toLowerCase();

  // Check MIME type
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  // Fallback: check file extension
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
    return;
  }

  // Reject file
  cb(
    new Error(`Unsupported file type. Allowed types: PDF, PPTX, DOCX. Received: ${file.mimetype}`)
  );
};

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.substring(lastDot) : '';
}

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

// Middleware for handling file uploads
// Field name: 'files' (supports multiple files)
export const fileUploadMiddleware = upload.array('files', MAX_FILES);
