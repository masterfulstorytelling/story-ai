/**
 * Rate limiter middleware
 *
 * Wraps RateLimitService to provide Express middleware for rate limiting.
 * Extracts email and IP from request and checks combined limits.
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimitService } from '../../services/rateLimitService';

const rateLimitService = new RateLimitService();

/**
 * Get client IP address from request
 * Checks X-Forwarded-For header (for proxies) and falls back to req.ip
 */
function getClientIP(req: Request): string {
  // Check X-Forwarded-For header (first IP in chain)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
    return ips;
  }

  // Fall back to req.ip (set by Express trust proxy)
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Rate limiter middleware
 * Checks both email and IP rate limits
 */
export async function rateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  const email = req.body.email;
  const ip = getClientIP(req);

  if (!email) {
    // Email validation should have caught this, but handle gracefully
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Email is required for rate limiting',
    });
    return;
  }

  try {
    const result = await rateLimitService.checkCombinedLimit(email, ip);

    if (!result.allowed) {
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit-Email', '3');
      res.setHeader('X-RateLimit-Limit-IP', '5');
      res.setHeader('X-RateLimit-Remaining-Email', result.emailLimit?.remaining || 0);
      res.setHeader('X-RateLimit-Remaining-IP', result.ipLimit?.remaining || 0);

      if (result.emailLimit?.resetAt) {
        res.setHeader('X-RateLimit-Reset-Email', result.emailLimit.resetAt.getTime().toString());
      }
      if (result.ipLimit?.resetAt) {
        res.setHeader('X-RateLimit-Reset-IP', result.ipLimit.resetAt.getTime().toString());
      }

      // Return 429 with appropriate message
      const errorMessage =
        result.reason === 'email'
          ? result.emailLimit?.message ||
            'Rate limit exceeded. Maximum 3 submissions per email per 24 hours.'
          : result.ipLimit?.message ||
            'Rate limit exceeded. Maximum 5 submissions per IP per hour.';

      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: errorMessage,
        details: {
          reason: result.reason,
          emailLimit: result.emailLimit,
          ipLimit: result.ipLimit,
        },
      });
      return;
    }

    // Set rate limit headers for successful requests
    if (result.emailLimit) {
      res.setHeader('X-RateLimit-Limit-Email', '3');
      res.setHeader('X-RateLimit-Remaining-Email', result.emailLimit.remaining);
      if (result.emailLimit.resetAt) {
        res.setHeader('X-RateLimit-Reset-Email', result.emailLimit.resetAt.getTime().toString());
      }
    }
    if (result.ipLimit) {
      res.setHeader('X-RateLimit-Limit-IP', '5');
      res.setHeader('X-RateLimit-Remaining-IP', result.ipLimit.remaining);
      if (result.ipLimit.resetAt) {
        res.setHeader('X-RateLimit-Reset-IP', result.ipLimit.resetAt.getTime().toString());
      }
    }

    // Rate limit check passed
    next();
  } catch (error) {
    // Log error but don't block request (fail open for rate limiting)
    console.error('Rate limiting error:', error);
    next();
  }
}
