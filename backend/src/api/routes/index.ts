import { Router } from 'express';
import evaluationRoutes from './evaluationRoutes';
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

export default router;
