import { listSubscribersSchema } from '../newsletter'
import { listAuditLogsSchema } from '../audit'
import {
  createPromotionSchema,
  updatePromotionSchema,
  getPromotionSchema,
  listPromotionsSchema,
} from '../promotion'

/**
 * Schema Validation Tests
 *
 * Tests Zod schemas for newsletter, audit, and promotion endpoints
 * to ensure proper validation of query params and request bodies.
 */

describe('Newsletter Schemas', () => {
  describe('listSubscribersSchema', () => {
    it('should validate empty query', () => {
      const result = listSubscribersSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate valid pagination params', () => {
      const result = listSubscribersSchema.safeParse({
        query: { page: '1', limit: '20' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-numeric page', () => {
      const result = listSubscribersSchema.safeParse({
        query: { page: 'abc' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-numeric limit', () => {
      const result = listSubscribersSchema.safeParse({
        query: { limit: 'abc' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject page less than 1', () => {
      const result = listSubscribersSchema.safeParse({
        query: { page: '0' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject limit exceeding max', () => {
      const result = listSubscribersSchema.safeParse({
        query: { limit: '1000' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate isActive filter as true', () => {
      const result = listSubscribersSchema.safeParse({
        query: { isActive: 'true' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate isActive filter as false', () => {
      const result = listSubscribersSchema.safeParse({
        query: { isActive: 'false' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid isActive value', () => {
      const result = listSubscribersSchema.safeParse({
        query: { isActive: 'invalid' },
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Audit Schemas', () => {
  describe('listAuditLogsSchema', () => {
    it('should validate empty query', () => {
      const result = listAuditLogsSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate valid pagination params', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { page: '1', limit: '20' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-numeric page', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { page: 'abc' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject page less than 1', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { page: '0' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject limit exceeding max', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { limit: '1000' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate userId filter', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { userId: '123' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-numeric userId', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { userId: 'abc' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate action filter', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { action: 'CREATE' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid action', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { action: 'INVALID_ACTION' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate entityType filter', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { entityType: 'PRODUCT' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid entityType', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { entityType: 'INVALID_TYPE' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate entityId filter', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { entityId: '456' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-numeric entityId', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { entityId: 'abc' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate date range filters', () => {
      const result = listAuditLogsSchema.safeParse({
        query: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.999Z',
        },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid startDate format', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { startDate: 'invalid-date' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid endDate format', () => {
      const result = listAuditLogsSchema.safeParse({
        query: { endDate: 'invalid-date' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate all action types', () => {
      const actions = [
        'CREATE',
        'UPDATE',
        'DELETE',
        'BULK_DELETE',
        'LOGIN',
        'LOGOUT',
        'PASSWORD_CHANGE',
      ]
      actions.forEach((action) => {
        const result = listAuditLogsSchema.safeParse({
          query: { action },
        })
        expect(result.success).toBe(true)
      })
    })

    it('should validate all entity types', () => {
      const entityTypes = [
        'PRODUCT',
        'PROMOTION',
        'USER',
        'SETTINGS',
        'FILE',
        'NEWSLETTER_SUBSCRIBER',
      ]
      entityTypes.forEach((entityType) => {
        const result = listAuditLogsSchema.safeParse({
          query: { entityType },
        })
        expect(result.success).toBe(true)
      })
    })
  })
})

describe('Promotion Schemas', () => {
  describe('createPromotionSchema', () => {
    const validPromotion = {
      name: 'Summer Sale',
      discountPercent: 20,
      startDate: '2024-06-01T00:00:00.000Z',
      endDate: '2024-08-31T23:59:59.999Z',
      isActive: true,
    }

    it('should validate a valid promotion', () => {
      const result = createPromotionSchema.safeParse({ body: validPromotion })
      expect(result.success).toBe(true)
    })

    it('should default isActive to true', () => {
      const { isActive: _isActive, ...withoutIsActive } = validPromotion
      const result = createPromotionSchema.safeParse({ body: withoutIsActive })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.body.isActive).toBe(true)
      }
    })

    it('should reject missing name', () => {
      const { name: _name, ...withoutName } = validPromotion
      const result = createPromotionSchema.safeParse({ body: withoutName })
      expect(result.success).toBe(false)
    })

    it('should reject empty name', () => {
      const result = createPromotionSchema.safeParse({
        body: { ...validPromotion, name: '' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject discount below minimum', () => {
      const result = createPromotionSchema.safeParse({
        body: { ...validPromotion, discountPercent: 0 },
      })
      expect(result.success).toBe(false)
    })

    it('should reject discount above maximum', () => {
      const result = createPromotionSchema.safeParse({
        body: { ...validPromotion, discountPercent: 101 },
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-integer discount', () => {
      const result = createPromotionSchema.safeParse({
        body: { ...validPromotion, discountPercent: 20.5 },
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid startDate format', () => {
      const result = createPromotionSchema.safeParse({
        body: { ...validPromotion, startDate: 'invalid-date' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid endDate format', () => {
      const result = createPromotionSchema.safeParse({
        body: { ...validPromotion, endDate: 'invalid-date' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject endDate before startDate', () => {
      const result = createPromotionSchema.safeParse({
        body: {
          ...validPromotion,
          startDate: '2024-08-31T23:59:59.999Z',
          endDate: '2024-06-01T00:00:00.000Z',
        },
      })
      expect(result.success).toBe(false)
    })

    it('should reject endDate equal to startDate', () => {
      const sameDate = '2024-06-01T00:00:00.000Z'
      const result = createPromotionSchema.safeParse({
        body: {
          ...validPromotion,
          startDate: sameDate,
          endDate: sameDate,
        },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updatePromotionSchema', () => {
    it('should validate partial update with name only', () => {
      const result = updatePromotionSchema.safeParse({
        body: { name: 'Updated Sale' },
        params: { id: '1' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate partial update with discountPercent only', () => {
      const result = updatePromotionSchema.safeParse({
        body: { discountPercent: 30 },
        params: { id: '1' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate partial update with dates', () => {
      const result = updatePromotionSchema.safeParse({
        body: {
          startDate: '2024-07-01T00:00:00.000Z',
          endDate: '2024-09-30T23:59:59.999Z',
        },
        params: { id: '1' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate partial update with isActive', () => {
      const result = updatePromotionSchema.safeParse({
        body: { isActive: false },
        params: { id: '1' },
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty body', () => {
      const result = updatePromotionSchema.safeParse({
        body: {},
        params: { id: '1' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid id', () => {
      const result = updatePromotionSchema.safeParse({
        body: { name: 'Updated' },
        params: { id: 'invalid' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject discount below minimum in update', () => {
      const result = updatePromotionSchema.safeParse({
        body: { discountPercent: 0 },
        params: { id: '1' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject discount above maximum in update', () => {
      const result = updatePromotionSchema.safeParse({
        body: { discountPercent: 101 },
        params: { id: '1' },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('getPromotionSchema', () => {
    it('should validate valid promotion id', () => {
      const result = getPromotionSchema.safeParse({
        params: { id: '123' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-numeric id', () => {
      const result = getPromotionSchema.safeParse({
        params: { id: 'abc' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing id', () => {
      const result = getPromotionSchema.safeParse({
        params: {},
      })
      expect(result.success).toBe(false)
    })
  })

  describe('listPromotionsSchema', () => {
    it('should validate empty query', () => {
      const result = listPromotionsSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate valid pagination params', () => {
      const result = listPromotionsSchema.safeParse({
        query: { page: '1', limit: '20' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-numeric page', () => {
      const result = listPromotionsSchema.safeParse({
        query: { page: 'abc' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject page less than 1', () => {
      const result = listPromotionsSchema.safeParse({
        query: { page: '0' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject limit exceeding max', () => {
      const result = listPromotionsSchema.safeParse({
        query: { limit: '1000' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate isActive filter as true', () => {
      const result = listPromotionsSchema.safeParse({
        query: { isActive: 'true' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate isActive filter as false', () => {
      const result = listPromotionsSchema.safeParse({
        query: { isActive: 'false' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate isActive filter as 1', () => {
      const result = listPromotionsSchema.safeParse({
        query: { isActive: '1' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate isActive filter as 0', () => {
      const result = listPromotionsSchema.safeParse({
        query: { isActive: '0' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid isActive value', () => {
      const result = listPromotionsSchema.safeParse({
        query: { isActive: 'invalid' },
      })
      expect(result.success).toBe(false)
    })
  })
})
