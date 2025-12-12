import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

/**
 * Prisma connection pool configuration
 *
 * Connection pool settings can be configured via environment variables or URL parameters:
 *
 * Environment variables (recommended for production):
 * - DB_POOL_SIZE: Maximum number of connections in pool (default: 10)
 * - DB_POOL_TIMEOUT: Seconds to wait for a connection before failing (default: 10)
 * - DB_CONNECT_TIMEOUT: Seconds to wait for initial connection (default: 5)
 *
 * Or via DATABASE_URL query parameters:
 * - connection_limit: Same as DB_POOL_SIZE
 * - pool_timeout: Same as DB_POOL_TIMEOUT (in seconds)
 * - connect_timeout: Same as DB_CONNECT_TIMEOUT (in seconds)
 *
 * Example: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
 */
function buildDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || ''

  // If the URL already has pool settings, use it as-is
  if (baseUrl.includes('connection_limit') || baseUrl.includes('pool_timeout')) {
    return baseUrl
  }

  // Build URL with pool settings from environment variables
  const poolSize = process.env.DB_POOL_SIZE || '10'
  const poolTimeout = process.env.DB_POOL_TIMEOUT || '10'
  const connectTimeout = process.env.DB_CONNECT_TIMEOUT || '5'

  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}connection_limit=${poolSize}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`
}

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
  datasources: {
    db: {
      url: buildDatabaseUrl(),
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
