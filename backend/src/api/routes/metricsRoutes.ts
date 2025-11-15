/**
 * Metrics API routes
 *
 * Provides endpoints for querying performance metrics
 *
 * T097: Add performance metrics collection (processing time, success rates)
 */

import { Router, Request, Response } from 'express';
import { metricsService } from '../../services/metricsService';

const router = Router();

/**
 * GET /metrics
 * Get performance metrics summary
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    // Optional time window query parameter (in milliseconds)
    const timeWindowMs = req.query.window
      ? parseInt(req.query.window as string, 10)
      : undefined;

    if (timeWindowMs && (isNaN(timeWindowMs) || timeWindowMs < 0)) {
      res.status(400).json({
        error: 'INVALID_PARAMETER',
        message: 'Window parameter must be a positive number (milliseconds)',
      });
      return;
    }

    const summary = metricsService.getSummary();
    const metrics = metricsService.getMetrics(timeWindowMs);

    res.status(200).json({
      summary,
      metrics: {
        processingTimes: metrics.processingTimes.length,
        submissions: metrics.submissions.length,
        totalSubmissions: metrics.totalSubmissions,
        successfulSubmissions: metrics.successfulSubmissions,
        failedSubmissions: metrics.failedSubmissions,
        successRate: metrics.successRate,
        averageProcessingTimeMs: metrics.averageProcessingTimeMs,
        medianProcessingTimeMs: metrics.medianProcessingTimeMs,
        minProcessingTimeMs: metrics.minProcessingTimeMs,
        maxProcessingTimeMs: metrics.maxProcessingTimeMs,
      },
      timeWindowMs: timeWindowMs || null,
    });
  } catch (error) {
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve metrics',
    });
  }
});

export default router;

