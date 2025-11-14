/**
 * Express app setup and configuration
 */

import express from 'express';
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler';
import routes from './api/routes';

/**
 * Create and configure Express app
 */
export function getApp(): express.Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/v1', routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// Export app instance for use in index.ts
export const app = getApp();
