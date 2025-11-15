import { Router } from 'express';
import evaluationRoutes from './evaluationRoutes';
import metricsRoutes from './metricsRoutes';
import { processEvaluationHandler } from '../handlers/processEvaluation';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cloud Tasks handler for processing evaluations
router.post('/tasks/process', processEvaluationHandler);

// Evaluation routes
router.use(evaluationRoutes);

// Metrics routes
router.use('/v1', metricsRoutes);

export default router;
