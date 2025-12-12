/**
 * Jest Test Setup
 *
 * This file is loaded before each test file and sets up common mocks.
 */

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-32-chars'
process.env.CLIENT_URL = 'http://localhost:3000'
process.env.BACKEND_URL = 'http://localhost:4000'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret'

// Mock Prisma Client
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    promotion: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    exchangeRate: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    exchangeRateSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    auditLog: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    newsletterSubscriber: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    newsletterCampaign: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
    },
    fragranceFamily: {
      findMany: jest.fn(),
    },
    longevity: {
      findMany: jest.fn(),
    },
    sillage: {
      findMany: jest.fn(),
    },
    season: {
      findMany: jest.fn(),
    },
    occasion: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((fn) => {
      if (typeof fn === 'function') {
        return fn({
          user: {
            findUnique: jest.fn(),
            update: jest.fn(),
          },
          refreshToken: {
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
          },
          product: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
          },
          order: {
            create: jest.fn(),
            update: jest.fn(),
            findUnique: jest.fn(),
          },
          orderItem: {
            createMany: jest.fn(),
          },
        })
      }
      return Promise.resolve(fn)
    }),
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

// Mock logger to prevent console output during tests
jest.mock('../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock audit logger
jest.mock('../lib/auditLogger', () => ({
  createAuditLog: jest.fn(),
  AuditAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  },
  AuditEntityType: {
    USER: 'USER',
    PRODUCT: 'PRODUCT',
    PROMOTION: 'PROMOTION',
  },
}))

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})
