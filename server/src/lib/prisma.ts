import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
  pool: Pool
}

/**
 * Prisma v7 connection configuration using pg adapter
 *
 * Connection pool settings can be configured via environment variables:
 * - DB_POOL_SIZE: Maximum number of connections in pool (default: 10)
 * - DB_POOL_TIMEOUT: Seconds to wait for a connection (default: 10)
 * - DB_CONNECT_TIMEOUT: Seconds for initial connection (default: 5)
 */
function createPrismaClient(): PrismaClient {
  const poolSize = parseInt(process.env.DB_POOL_SIZE || '10', 10)
  const connectionTimeoutMillis = parseInt(process.env.DB_CONNECT_TIMEOUT || '5', 10) * 1000
  const idleTimeoutMillis = parseInt(process.env.DB_POOL_TIMEOUT || '10', 10) * 1000

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: poolSize,
    connectionTimeoutMillis,
    idleTimeoutMillis,
  })

  // Store pool reference for cleanup
  globalForPrisma.pool = pool

  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
