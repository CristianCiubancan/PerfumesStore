import { cache, CACHE_KEYS } from '../../lib/cache'

/**
 * Invalidates all caches that depend on product data.
 * Call this after any product mutation (create, update, delete).
 */
export function invalidateProductCaches(): void {
  cache.invalidate(CACHE_KEYS.BRANDS)
  cache.invalidate(CACHE_KEYS.STATS)
  cache.invalidate(CACHE_KEYS.FILTER_OPTIONS)
}
