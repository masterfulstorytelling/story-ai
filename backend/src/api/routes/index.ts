import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import evaluationRoutes from './evaluationRoutes';
import metricsRoutes from './metricsRoutes';
import dataDeletionRoutes from './dataDeletion';
import { processEvaluationHandler } from '../handlers/processEvaluation';
import { generateOpenAPISpec } from '../openapi';
import { getFirestore } from '../../services/firestoreService';
import { getBucket } from '../../services/storageService';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  const checkDependencies = req.query.check === 'dependencies';
  
  if (!checkDependencies) {
    // Basic health check - just verify service is running
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
    return;
  }

  // Comprehensive health check - verify all dependencies
  const healthStatus: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'backend',
    dependencies: {} as Record<string, string>,
  };

  try {
    // Check Firestore
    try {
      const firestore = getFirestore();
      const testQuery = firestore.collection('evaluation_requests').limit(1);
      await testQuery.get();
      healthStatus.dependencies.firestore = 'healthy';
    } catch (error) {
      healthStatus.dependencies.firestore = 'unavailable';
      healthStatus.status = 'unhealthy';
    }

    // Check Cloud Storage
    try {
      const bucket = getBucket();
      await bucket.exists();
      healthStatus.dependencies.cloudStorage = 'healthy';
    } catch (error) {
      healthStatus.dependencies.cloudStorage = 'unavailable';
      healthStatus.status = 'unhealthy';
    }
  } catch (error) {
    healthStatus.status = 'unhealthy';
    healthStatus.error = 'Health check failed';
  }

  const statusCode = healthStatus.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
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

// GDPR data deletion routes
router.use('/v1', dataDeletionRoutes);

export default router;
