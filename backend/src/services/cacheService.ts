/**
 * Cache Service
 *
 * Provides caching for scraped content and parsed content to improve performance.
 * Uses in-memory cache (can be upgraded to Redis for distributed caching).
 *
 * T103: Performance optimization (caching, parallel processing improvements)
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class CacheService {
  private scrapedContentCache: Map<string, CacheEntry<{ text: string; html: string }>>;
  private parsedContentCache: Map<string, CacheEntry<{ text: string; pages: unknown[] }>>;
  private readonly defaultTTL: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    this.scrapedContentCache = new Map();
    this.parsedContentCache = new Map();
  }

  /**
   * Cache scraped content by URL
   *
   * @param url - The URL that was scraped
   * @param content - The scraped content
   * @param ttlMs - Time to live in milliseconds (default: 24 hours)
   */
  async setScrapedContent(
    url: string,
    content: { text: string; html: string },
    ttlMs?: number
  ): Promise<void> {
    const ttl = ttlMs || this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.scrapedContentCache.set(url, {
      data: content,
      expiresAt,
    });
  }

  /**
   * Get cached scraped content by URL
   *
   * @param url - The URL to look up
   * @returns Cached content or null if not found or expired
   */
  async getScrapedContent(url: string): Promise<{ text: string; html: string } | null> {
    const entry = this.scrapedContentCache.get(url);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.scrapedContentCache.delete(url);
      return null;
    }

    return entry.data;
  }

  /**
   * Invalidate cached scraped content for a URL
   *
   * @param url - The URL to invalidate
   */
  async invalidateScrapedContent(url: string): Promise<void> {
    this.scrapedContentCache.delete(url);
  }

  /**
   * Cache parsed content by file hash
   *
   * @param fileHash - Hash of the file (e.g., SHA-256)
   * @param content - The parsed content
   * @param ttlMs - Time to live in milliseconds (default: 24 hours)
   */
  async setParsedContent(
    fileHash: string,
    content: { text: string; pages: unknown[] },
    ttlMs?: number
  ): Promise<void> {
    const ttl = ttlMs || this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.parsedContentCache.set(fileHash, {
      data: content,
      expiresAt,
    });
  }

  /**
   * Get cached parsed content by file hash
   *
   * @param fileHash - The file hash to look up
   * @returns Cached content or null if not found or expired
   */
  async getParsedContent(fileHash: string): Promise<{ text: string; pages: unknown[] } | null> {
    const entry = this.parsedContentCache.get(fileHash);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.parsedContentCache.delete(fileHash);
      return null;
    }

    return entry.data;
  }

  /**
   * Invalidate cached parsed content for a file hash
   *
   * @param fileHash - The file hash to invalidate
   */
  async invalidateParsedContent(fileHash: string): Promise<void> {
    this.parsedContentCache.delete(fileHash);
  }

  /**
   * Clear all caches (useful for testing or manual cache clearing)
   */
  clearAll(): void {
    this.scrapedContentCache.clear();
    this.parsedContentCache.clear();
  }
}

// Export singleton instance
export const cacheService = new CacheService();
