import { Router } from 'express';
import evaluationRoutes from './evaluationRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Evaluation routes
router.use(evaluationRoutes);

export default router;
