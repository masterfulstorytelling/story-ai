/**
 * Unit tests for rate limiting service
 *
 * Requirements:
 * - 3 submissions per email address per 24 hours
 * - 5 submissions per IP address per hour
 *
 * TDD: These tests are written FIRST and should FAIL until the service is implemented.
 */

import { RateLimitService } from '../../../src/services/rateLimitService';

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;

  beforeEach(() => {
    rateLimitService = new RateLimitService();
    // Clear rate limit state before each test
    rateLimitService.clear();
  });

  describe('Email-based rate limiting (3 per 24 hours)', () => {
    it('should allow first submission for an email', async () => {
      const result = await rateLimitService.checkEmailLimit('user@example.com');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should allow second submission for an email', async () => {
      await rateLimitService.checkEmailLimit('user@example.com');
      const result = await rateLimitService.checkEmailLimit('user@example.com');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('should allow third submission for an email', async () => {
      await rateLimitService.checkEmailLimit('user@example.com');
      await rateLimitService.checkEmailLimit('user@example.com');
      const result = await rateLimitService.checkEmailLimit('user@example.com');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should reject fourth submission for an email within 24 hours', async () => {
      await rateLimitService.checkEmailLimit('user@example.com');
      await rateLimitService.checkEmailLimit('user@example.com');
      await rateLimitService.checkEmailLimit('user@example.com');
      const result = await rateLimitService.checkEmailLimit('user@example.com');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.message?.toLowerCase()).toContain('rate limit');
    });

    it('should allow submission after 24 hours have passed', async () => {
      // Make 3 submissions
      await rateLimitService.checkEmailLimit('user@example.com');
      await rateLimitService.checkEmailLimit('user@example.com');
      await rateLimitService.checkEmailLimit('user@example.com');

      // Simulate 24 hours passing
      const originalDate = Date.now;
      Date.now = jest.fn(() => originalDate() + 24 * 60 * 60 * 1000 + 1);

      const result = await rateLimitService.checkEmailLimit('user@example.com');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);

      // Restore Date.now
      Date.now = originalDate;
    });

    it('should track different emails independently', async () => {
      // User 1 makes 3 submissions
      await rateLimitService.checkEmailLimit('user1@example.com');
      await rateLimitService.checkEmailLimit('user1@example.com');
      await rateLimitService.checkEmailLimit('user1@example.com');

      // User 2 should still be able to submit
      const result = await rateLimitService.checkEmailLimit('user2@example.com');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });
  });

  describe('IP-based rate limiting (5 per hour)', () => {
    it('should allow first submission from an IP', async () => {
      const result = await rateLimitService.checkIPLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should allow up to 5 submissions from an IP per hour', async () => {
      const ip = '192.168.1.1';

      for (let i = 0; i < 5; i++) {
        const result = await rateLimitService.checkIPLimit(ip);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should reject sixth submission from an IP within an hour', async () => {
      const ip = '192.168.1.1';

      // Make 5 submissions
      for (let i = 0; i < 5; i++) {
        await rateLimitService.checkIPLimit(ip);
      }

      const result = await rateLimitService.checkIPLimit(ip);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.message?.toLowerCase()).toContain('rate limit');
    });

    it('should allow submission after 1 hour has passed', async () => {
      const ip = '192.168.1.1';

      // Make 5 submissions
      for (let i = 0; i < 5; i++) {
        await rateLimitService.checkIPLimit(ip);
      }

      // Simulate 1 hour passing
      const originalDate = Date.now;
      Date.now = jest.fn(() => originalDate() + 60 * 60 * 1000 + 1);

      const result = await rateLimitService.checkIPLimit(ip);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);

      // Restore Date.now
      Date.now = originalDate;
    });

    it('should track different IPs independently', async () => {
      // IP 1 makes 5 submissions
      for (let i = 0; i < 5; i++) {
        await rateLimitService.checkIPLimit('192.168.1.1');
      }

      // IP 2 should still be able to submit
      const result = await rateLimitService.checkIPLimit('192.168.1.2');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('Combined rate limiting', () => {
    it('should reject if either email or IP limit is exceeded', async () => {
      const email = 'user@example.com';
      const ip = '192.168.1.1';

      // Exceed email limit
      await rateLimitService.checkEmailLimit(email);
      await rateLimitService.checkEmailLimit(email);
      await rateLimitService.checkEmailLimit(email);

      // Check combined limit
      const result = await rateLimitService.checkCombinedLimit(email, ip);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('email');
    });

    it('should reject if IP limit is exceeded even if email limit is not', async () => {
      const email = 'user@example.com';
      const ip = '192.168.1.1';

      // Exceed IP limit
      for (let i = 0; i < 5; i++) {
        await rateLimitService.checkIPLimit(ip);
      }

      // Check combined limit
      const result = await rateLimitService.checkCombinedLimit(email, ip);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('IP');
    });

    it('should allow if both limits are not exceeded', async () => {
      const email = 'user@example.com';
      const ip = '192.168.1.1';

      // Make 2 email submissions and 3 IP submissions (both under limits)
      await rateLimitService.checkEmailLimit(email);
      await rateLimitService.checkEmailLimit(email);
      await rateLimitService.checkIPLimit(ip);
      await rateLimitService.checkIPLimit(ip);
      await rateLimitService.checkIPLimit(ip);

      const result = await rateLimitService.checkCombinedLimit(email, ip);

      expect(result.allowed).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid email format gracefully', async () => {
      const result = await rateLimitService.checkEmailLimit('invalid-email');

      // Should either validate email format or handle gracefully
      expect(result).toBeDefined();
    });

    it('should handle invalid IP format gracefully', async () => {
      const result = await rateLimitService.checkIPLimit('invalid-ip');

      // Should either validate IP format or handle gracefully
      expect(result).toBeDefined();
    });
  });
});
