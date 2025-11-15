/**
 * Alerting service
 *
 * Monitors error rates, processing times, and other metrics
 * to trigger alerts when thresholds are exceeded.
 *
 * T096: Implement monitoring and alerting (Cloud Logging, error tracking)
 */

export interface AlertConfig {
  threshold: number;
  handler: (alert: Alert) => void;
}

export interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}

export interface AlertingConfig {
  highErrorRate?: AlertConfig;
  longProcessingTime?: AlertConfig;
}

export class AlertingService {
  private config: AlertingConfig;
  private errors: number = 0;
  private successes: number = 0;
  private processingTimes: number[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private readonly cooldownMs = 5 * 60 * 1000; // 5 minutes cooldown between alerts
  private readonly windowSize = 100; // Track last 100 requests

  constructor(config: AlertingConfig) {
    this.config = config;
  }

  recordError(): void {
    this.errors++;
    this.maintainWindow();
  }

  recordSuccess(): void {
    this.successes++;
    this.maintainWindow();
  }

  recordProcessingTime(ms: number): void {
    this.processingTimes.push(ms);
    if (this.processingTimes.length > this.windowSize) {
      this.processingTimes.shift();
    }
  }

  private maintainWindow(): void {
    const total = this.errors + this.successes;
    if (total > this.windowSize) {
      // Reset to maintain rolling window
      // In a real implementation, this would use a time-based window
      this.errors = Math.floor((this.errors / total) * this.windowSize);
      this.successes = Math.floor((this.successes / total) * this.windowSize);
    }
  }

  checkAlerts(): void {
    // Check error rate
    if (this.config.highErrorRate) {
      this.checkErrorRateAlert();
    }

    // Check processing time
    if (this.config.longProcessingTime) {
      this.checkProcessingTimeAlert();
    }
  }

  private checkErrorRateAlert(): void {
    const total = this.errors + this.successes;
    if (total === 0) return;

    const errorRate = this.errors / total;
    const config = this.config.highErrorRate!;

    if (errorRate > config.threshold) {
      const alertType = 'highErrorRate';
      if (this.shouldTriggerAlert(alertType)) {
        const alert: Alert = {
          type: alertType,
          severity: 'warning',
          message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
          context: {
            errorRate,
            totalRequests: total,
            errors: this.errors,
            successes: this.successes,
          },
          timestamp: new Date(),
        };

        config.handler(alert);
        this.lastAlertTime.set(alertType, Date.now());
      }
    }
  }

  private checkProcessingTimeAlert(): void {
    if (this.processingTimes.length === 0) return;

    const maxTime = Math.max(...this.processingTimes);
    const config = this.config.longProcessingTime!;

    if (maxTime > config.threshold) {
      const alertType = 'longProcessingTime';
      if (this.shouldTriggerAlert(alertType)) {
        const alert: Alert = {
          type: alertType,
          severity: 'warning',
          message: `Long processing time detected: ${(maxTime / 1000 / 60).toFixed(2)} minutes`,
          context: {
            processingTimeMs: maxTime,
            thresholdMs: config.threshold,
          },
          timestamp: new Date(),
        };

        config.handler(alert);
        this.lastAlertTime.set(alertType, Date.now());
      }
    }
  }

  private shouldTriggerAlert(alertType: string): boolean {
    const lastAlert = this.lastAlertTime.get(alertType);
    if (!lastAlert) return true;

    const timeSinceLastAlert = Date.now() - lastAlert;
    return timeSinceLastAlert > this.cooldownMs;
  }

  reset(): void {
    this.errors = 0;
    this.successes = 0;
    this.processingTimes = [];
    this.lastAlertTime.clear();
  }
}

export const createAlertingService = (config: AlertingConfig): AlertingService => {
  return new AlertingService(config);
};
