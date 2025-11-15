/**
 * Unit tests for Cache service
 *
 * TDD: These tests verify caching functionality for performance optimization.
 *
 * T103: Performance optimization (caching, parallel processing improvements)
 */

import { CacheService } from '../../../src/services/cacheService';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  describe('Scraped Content Caching', () => {
    it('should cache scraped content by URL', async () => {
      const url = 'https://example.com';
      const content = { text: 'Example content', html: '<html>...</html>' };

      await cacheService.setScrapedContent(url, content);

      const cached = await cacheService.getScrapedContent(url);
      expect(cached).toEqual(content);
    });

    it('should return null for non-existent cache entry', async () => {
      const cached = await cacheService.getScrapedContent('https://nonexistent.com');
      expect(cached).toBeNull();
    });

    it('should expire cached content after TTL', async () => {
      const url = 'https://example.com';
      const content = { text: 'Example content', html: '<html>...</html>' };

      // Set cache with 1ms TTL
      await cacheService.setScrapedContent(url, content, 1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cached = await cacheService.getScrapedContent(url);
      expect(cached).toBeNull();
    });
  });

  describe('Parsed Content Caching', () => {
    it('should cache parsed content by file hash', async () => {
      const fileHash = 'abc123';
      const content = { text: 'Parsed content', pages: [] };

      await cacheService.setParsedContent(fileHash, content);

      const cached = await cacheService.getParsedContent(fileHash);
      expect(cached).toEqual(content);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache entry', async () => {
      const url = 'https://example.com';
      const content = { text: 'Example content', html: '<html>...</html>' };

      await cacheService.setScrapedContent(url, content);
      await cacheService.invalidateScrapedContent(url);

      const cached = await cacheService.getScrapedContent(url);
      expect(cached).toBeNull();
    });
  });
});
