import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

/**
 * Prisma v7 Configuration
 *
 * This file configures Prisma CLI behavior including:
 * - Schema file location
 * - Migration output directory
 * - Database URL for migrations
 *
 * Connection pool settings are configured separately in lib/prisma.ts
 * via environment variables:
 * - DB_POOL_SIZE: Max connections (default: 10)
 * - DB_POOL_TIMEOUT: Wait time for connection (default: 10s)
 * - DB_CONNECT_TIMEOUT: Initial connection timeout (default: 5s)
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
