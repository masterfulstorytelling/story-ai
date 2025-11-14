import express from 'express';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler';
import routes from './api/routes';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/v1', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.port;

app.listen(PORT, () => {
  logger.info(`Backend server started`, { port: PORT, nodeEnv: env.nodeEnv });
});

