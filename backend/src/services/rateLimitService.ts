/**
 * Rate limiting service
 * 
 * Enforces rate limits:
 * - 3 submissions per email address per 24 hours
 * - 5 submissions per IP address per hour
 * 
 * Uses in-memory storage for MVP (can be upgraded to Redis for production).
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  message?: string;
}

export interface CombinedRateLimitResult {
  allowed: boolean;
  reason?: string;
  emailLimit?: RateLimitResult;
  ipLimit?: RateLimitResult;
}

interface RateLimitEntry {
  count: number;
  resetAt: Date;
}

export class RateLimitService {
  private emailLimits: Map<string, RateLimitEntry> = new Map();
  private ipLimits: Map<string, RateLimitEntry> = new Map();

  // Limits
  private readonly EMAIL_LIMIT = 3;
  private readonly EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly IP_LIMIT = 5;
  private readonly IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Check email-based rate limit
   */
  async checkEmailLimit(email: string): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.emailLimits.get(email);

    // Clean up expired entries
    if (entry && entry.resetAt.getTime() < now) {
      this.emailLimits.delete(email);
    }

    const currentEntry = this.emailLimits.get(email);

    if (!currentEntry) {
      // First request - create entry
      const resetAt = new Date(now + this.EMAIL_WINDOW_MS);
      this.emailLimits.set(email, {
        count: 1,
        resetAt,
      });

      return {
        allowed: true,
        remaining: this.EMAIL_LIMIT - 1,
        resetAt,
      };
    }

    // Check if limit exceeded
    if (currentEntry.count >= this.EMAIL_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: currentEntry.resetAt,
        message: 'Rate limit exceeded. Maximum 3 submissions per email per 24 hours.',
      };
    }

    // Increment count
    currentEntry.count++;
    this.emailLimits.set(email, currentEntry);

    return {
      allowed: true,
      remaining: this.EMAIL_LIMIT - currentEntry.count,
      resetAt: currentEntry.resetAt,
    };
  }

  /**
   * Check IP-based rate limit
   */
  async checkIPLimit(ip: string): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.ipLimits.get(ip);

    // Clean up expired entries
    if (entry && entry.resetAt.getTime() < now) {
      this.ipLimits.delete(ip);
    }

    const currentEntry = this.ipLimits.get(ip);

    if (!currentEntry) {
      // First request - create entry
      const resetAt = new Date(now + this.IP_WINDOW_MS);
      this.ipLimits.set(ip, {
        count: 1,
        resetAt,
      });

      return {
        allowed: true,
        remaining: this.IP_LIMIT - 1,
        resetAt,
      };
    }

    // Check if limit exceeded
    if (currentEntry.count >= this.IP_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: currentEntry.resetAt,
        message: 'Rate limit exceeded. Maximum 5 submissions per IP per hour.',
      };
    }

    // Increment count
    currentEntry.count++;
    this.ipLimits.set(ip, currentEntry);

    return {
      allowed: true,
      remaining: this.IP_LIMIT - currentEntry.count,
      resetAt: currentEntry.resetAt,
    };
  }

  /**
   * Check combined rate limits (both email and IP)
   */
  async checkCombinedLimit(
    email: string,
    ip: string
  ): Promise<CombinedRateLimitResult> {
    const emailResult = await this.checkEmailLimit(email);
    const ipResult = await this.checkIPLimit(ip);

    if (!emailResult.allowed) {
      return {
        allowed: false,
        reason: 'email',
        emailLimit: emailResult,
        ipLimit: ipResult,
      };
    }

    if (!ipResult.allowed) {
      return {
        allowed: false,
        reason: 'IP',
        emailLimit: emailResult,
        ipLimit: ipResult,
      };
    }

    return {
      allowed: true,
      emailLimit: emailResult,
      ipLimit: ipResult,
    };
  }

  /**
   * Clear all rate limit state (for testing)
   */
  clear(): void {
    this.emailLimits.clear();
    this.ipLimits.clear();
  }

  /**
   * Get current rate limit status for an email (for debugging)
   */
  getEmailStatus(email: string): RateLimitResult | null {
    const entry = this.emailLimits.get(email);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (entry.resetAt.getTime() < now) {
      return null;
    }

    return {
      allowed: entry.count < this.EMAIL_LIMIT,
      remaining: Math.max(0, this.EMAIL_LIMIT - entry.count),
      resetAt: entry.resetAt,
    };
  }

  /**
   * Get current rate limit status for an IP (for debugging)
   */
  getIPStatus(ip: string): RateLimitResult | null {
    const entry = this.ipLimits.get(ip);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (entry.resetAt.getTime() < now) {
      return null;
    }

    return {
      allowed: entry.count < this.IP_LIMIT,
      remaining: Math.max(0, this.IP_LIMIT - entry.count),
      resetAt: entry.resetAt,
    };
  }
}

