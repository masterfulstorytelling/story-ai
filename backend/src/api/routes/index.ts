import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import evaluationRoutes from './evaluationRoutes';
import metricsRoutes from './metricsRoutes';
import { processEvaluationHandler } from '../handlers/processEvaluation';
import { generateOpenAPISpec } from './openapi';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Documentation (Swagger UI)
const swaggerSpec = generateOpenAPISpec();
router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerSpec));

// OpenAPI JSON spec endpoint
router.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Cloud Tasks handler for processing evaluations
router.post('/tasks/process', processEvaluationHandler);

// Evaluation routes
router.use(evaluationRoutes);

// Metrics routes
router.use('/v1', metricsRoutes);

export default router;
