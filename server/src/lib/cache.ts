/**
 * Simple in-memory cache with TTL (Time-To-Live)
 *
 * Suitable for single-server deployments where data rarely changes.
 * For multi-server deployments, consider Redis.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()

  /**
   * Get cached value or fetch fresh data if expired/missing
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number
  ): Promise<T> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    const now = Date.now()

    // Return cached data if valid
    if (entry && entry.expiresAt > now) {
      return entry.data
    }

    // Fetch fresh data
    const data = await fetcher()

    // Store in cache
    this.cache.set(key, {
      data,
      expiresAt: now + ttlMs,
    })

    return data
  }

  /**
   * Invalidate a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all cache entries matching a prefix
   * Uses string matching instead of regex to prevent ReDoS
   */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
  }
}

// Singleton instance
export const cache = new MemoryCache()

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  FILTER_OPTIONS: 5 * 60 * 1000, // 5 minutes - lookup tables rarely change
  BRANDS: 60 * 1000, // 1 minute - brands can change when products are added
  STATS: 30 * 1000, // 30 seconds - stats change more frequently
} as const

// Cache keys
export const CACHE_KEYS = {
  FILTER_OPTIONS: 'filter_options',
  BRANDS: 'brands',
  STATS: 'stats',
} as const
