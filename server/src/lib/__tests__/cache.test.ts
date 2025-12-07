// We need to re-import since we can't easily mock the singleton
// Create a fresh instance for testing

describe('MemoryCache', () => {
  // Test the cache module indirectly through its exports
  let cache: {
    getOrSet: <T>(key: string, fetcher: () => Promise<T>, ttlMs: number) => Promise<T>
    invalidate: (key: string) => void
    invalidateByPrefix: (prefix: string) => void
    clear: () => void
  }

  beforeEach(() => {
    // Re-import to get a fresh instance
    jest.resetModules()
    const cacheModule = require('../cache')
    cache = cacheModule.cache
    cache.clear()
  })

  describe('getOrSet', () => {
    it('should call fetcher when cache is empty', async () => {
      const fetcher = jest.fn().mockResolvedValue('data')

      const result = await cache.getOrSet('key1', fetcher, 1000)

      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(result).toBe('data')
    })

    it('should return cached value without calling fetcher', async () => {
      const fetcher1 = jest.fn().mockResolvedValue('data1')
      const fetcher2 = jest.fn().mockResolvedValue('data2')

      await cache.getOrSet('key2', fetcher1, 10000)
      const result = await cache.getOrSet('key2', fetcher2, 10000)

      expect(fetcher1).toHaveBeenCalledTimes(1)
      expect(fetcher2).not.toHaveBeenCalled()
      expect(result).toBe('data1')
    })

    it('should refresh cache after TTL expires', async () => {
      const fetcher1 = jest.fn().mockResolvedValue('data1')
      const fetcher2 = jest.fn().mockResolvedValue('data2')

      await cache.getOrSet('key3', fetcher1, 1) // 1ms TTL

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 10))

      const result = await cache.getOrSet('key3', fetcher2, 1000)

      expect(fetcher2).toHaveBeenCalledTimes(1)
      expect(result).toBe('data2')
    })

    it('should handle async fetcher errors', async () => {
      const error = new Error('Fetch failed')
      const fetcher = jest.fn().mockRejectedValue(error)

      await expect(cache.getOrSet('key4', fetcher, 1000)).rejects.toThrow(
        'Fetch failed'
      )
    })

    it('should cache different values for different keys', async () => {
      const fetcher1 = jest.fn().mockResolvedValue('value1')
      const fetcher2 = jest.fn().mockResolvedValue('value2')

      const result1 = await cache.getOrSet('keyA', fetcher1, 10000)
      const result2 = await cache.getOrSet('keyB', fetcher2, 10000)

      expect(result1).toBe('value1')
      expect(result2).toBe('value2')
    })
  })

  describe('invalidate', () => {
    it('should remove specific key from cache', async () => {
      const fetcher1 = jest.fn().mockResolvedValue('original')
      const fetcher2 = jest.fn().mockResolvedValue('refreshed')

      await cache.getOrSet('myKey', fetcher1, 10000)
      cache.invalidate('myKey')
      const result = await cache.getOrSet('myKey', fetcher2, 10000)

      expect(fetcher2).toHaveBeenCalledTimes(1)
      expect(result).toBe('refreshed')
    })

    it('should not throw when invalidating non-existent key', () => {
      expect(() => cache.invalidate('nonexistent')).not.toThrow()
    })
  })

  describe('invalidateByPrefix', () => {
    it('should remove all keys with matching prefix', async () => {
      const fetcher = jest.fn().mockResolvedValue('data')

      await cache.getOrSet('user:1', fetcher, 10000)
      await cache.getOrSet('user:2', fetcher, 10000)
      await cache.getOrSet('product:1', fetcher, 10000)

      cache.invalidateByPrefix('user:')

      const userFetcher = jest.fn().mockResolvedValue('new')
      const productFetcher = jest.fn().mockResolvedValue('new')

      await cache.getOrSet('user:1', userFetcher, 10000)
      await cache.getOrSet('product:1', productFetcher, 10000)

      expect(userFetcher).toHaveBeenCalledTimes(1) // Was invalidated
      expect(productFetcher).not.toHaveBeenCalled() // Still cached
    })
  })

  describe('clear', () => {
    it('should remove all entries from cache', async () => {
      const fetcher1 = jest.fn().mockResolvedValue('data1')
      const fetcher2 = jest.fn().mockResolvedValue('data2')

      await cache.getOrSet('k1', fetcher1, 10000)
      await cache.getOrSet('k2', fetcher1, 10000)

      cache.clear()

      await cache.getOrSet('k1', fetcher2, 10000)
      await cache.getOrSet('k2', fetcher2, 10000)

      expect(fetcher2).toHaveBeenCalledTimes(2)
    })
  })
})

describe('Cache constants', () => {
  it('should export CACHE_TTL constants', () => {
    const { CACHE_TTL } = require('../cache')
    expect(CACHE_TTL.FILTER_OPTIONS).toBe(5 * 60 * 1000)
    expect(CACHE_TTL.BRANDS).toBe(60 * 1000)
    expect(CACHE_TTL.STATS).toBe(30 * 1000)
  })

  it('should export CACHE_KEYS constants', () => {
    const { CACHE_KEYS } = require('../cache')
    expect(CACHE_KEYS.FILTER_OPTIONS).toBe('filter_options')
    expect(CACHE_KEYS.BRANDS).toBe('brands')
    expect(CACHE_KEYS.STATS).toBe('stats')
  })
})
