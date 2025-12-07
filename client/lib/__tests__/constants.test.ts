import { describe, it, expect } from 'vitest'
import {
  OG_IMAGE,
  TIMING,
  TIME_MS,
  CACHE,
  QUERY,
  SITEMAP,
  RATING,
  SEO,
  PAGINATION,
  STOCK,
  UPLOAD,
} from '../constants'

describe('constants', () => {
  describe('OG_IMAGE', () => {
    it('has correct dimensions', () => {
      expect(OG_IMAGE.WIDTH).toBe(1200)
      expect(OG_IMAGE.HEIGHT).toBe(630)
    })
  })

  describe('TIMING', () => {
    it('has valid debounce values', () => {
      expect(TIMING.DEBOUNCE_MS).toBeGreaterThan(0)
      expect(TIMING.DEBOUNCE_SHORT_MS).toBeGreaterThan(0)
      expect(TIMING.DEBOUNCE_MS).toBeGreaterThan(TIMING.DEBOUNCE_SHORT_MS)
    })

    it('has valid animation timings', () => {
      expect(TIMING.ADD_TO_CART_DELAY_MS).toBeGreaterThan(0)
      expect(TIMING.ADD_TO_CART_FEEDBACK_MS).toBeGreaterThan(0)
      expect(TIMING.BADGE_ANIMATION_MS).toBeGreaterThan(0)
    })
  })

  describe('TIME_MS', () => {
    it('has correct time unit calculations', () => {
      expect(TIME_MS.SECOND).toBe(1000)
      expect(TIME_MS.MINUTE).toBe(60 * 1000)
      expect(TIME_MS.HOUR).toBe(60 * 60 * 1000)
      expect(TIME_MS.DAY).toBe(24 * 60 * 60 * 1000)
    })
  })

  describe('CACHE', () => {
    it('has valid exchange rate duration', () => {
      expect(CACHE.EXCHANGE_RATE_DURATION_MS).toBe(60 * 60 * 1000) // 1 hour
    })
  })

  describe('QUERY', () => {
    it('has valid stale time', () => {
      expect(QUERY.STALE_TIME_MS).toBe(60 * 1000) // 1 minute
    })

    it('has valid retry count', () => {
      expect(QUERY.RETRY_COUNT).toBeGreaterThanOrEqual(0)
    })
  })

  describe('SITEMAP', () => {
    it('has valid revalidate seconds', () => {
      expect(SITEMAP.REVALIDATE_SECONDS).toBe(3600) // 1 hour
    })

    it('has valid priorities', () => {
      expect(SITEMAP.PRIORITY.HOME).toBe(1.0)
      expect(SITEMAP.PRIORITY.STORE).toBeLessThanOrEqual(1.0)
      expect(SITEMAP.PRIORITY.PRODUCT).toBeLessThanOrEqual(1.0)
    })
  })

  describe('RATING', () => {
    it('has valid rating range', () => {
      expect(RATING.MIN).toBe(0)
      expect(RATING.MAX).toBe(5)
      expect(RATING.STEP).toBe(0.5)
    })
  })

  describe('SEO', () => {
    it('has valid description max length', () => {
      expect(SEO.DESCRIPTION_MAX_LENGTH).toBeGreaterThan(0)
    })
  })

  describe('PAGINATION', () => {
    it('has valid default limits', () => {
      expect(PAGINATION.DEFAULT_LIMIT).toBeGreaterThan(0)
      expect(PAGINATION.PRODUCTS_PER_PAGE).toBeGreaterThan(0)
      expect(PAGINATION.ADMIN_DEFAULT_LIMIT).toBeGreaterThan(0)
    })

    it('has valid page size options', () => {
      expect(PAGINATION.PAGE_SIZE_OPTIONS.length).toBeGreaterThan(0)
      expect(PAGINATION.PAGE_SIZE_OPTIONS).toContain(10)
    })
  })

  describe('STOCK', () => {
    it('has valid low stock threshold', () => {
      expect(STOCK.LOW_STOCK_THRESHOLD).toBe(10)
    })
  })

  describe('UPLOAD', () => {
    it('has valid max file size', () => {
      expect(UPLOAD.MAX_FILE_SIZE).toBe(5 * 1024 * 1024) // 5MB
      expect(UPLOAD.MAX_FILE_SIZE_MB).toBe(5)
    })

    it('has valid allowed types', () => {
      expect(UPLOAD.ALLOWED_TYPES).toContain('image/jpeg')
      expect(UPLOAD.ALLOWED_TYPES).toContain('image/png')
      expect(UPLOAD.ALLOWED_TYPES).toContain('image/webp')
    })
  })
})
