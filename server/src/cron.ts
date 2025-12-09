import cron from 'node-cron'
import { updateExchangeRates } from './services/exchange-rate.service'
import { cleanupExpiredTokens } from './services/auth.service'
import { cleanupOrphanedImages } from './services/image-cleanup.service'
import { EXCHANGE_RATE, AUTH, UPLOADS } from './config/constants'
import { logger } from './lib/logger'

export async function initExchangeRates(): Promise<void> {
  try {
    await updateExchangeRates()
    logger.info('Initial fetch completed', 'ExchangeRate')
  } catch (err: unknown) {
    logger.error('Initial fetch failed', 'ExchangeRate', err)
  }
}

export async function initTokenCleanup(): Promise<void> {
  try {
    const count = await cleanupExpiredTokens()
    logger.info(`Initial cleanup completed, removed ${count} tokens`, 'Auth')
  } catch (err: unknown) {
    logger.error('Initial token cleanup failed', 'Auth', err)
  }
}

export async function initImageCleanup(): Promise<void> {
  try {
    const count = await cleanupOrphanedImages()
    logger.info(`Initial cleanup completed, removed ${count} orphaned images`, 'ImageCleanup')
  } catch (err: unknown) {
    logger.error('Initial image cleanup failed', 'ImageCleanup', err)
  }
}

export function registerCronJobs(): void {
  // Update exchange rates
  cron.schedule(EXCHANGE_RATE.CRON_SCHEDULE, async () => {
    try {
      await updateExchangeRates()
    } catch (err: unknown) {
      logger.error('Scheduled fetch failed', 'ExchangeRate', err)
    }
  })

  // Clean up expired/revoked refresh tokens every 10 minutes
  cron.schedule(AUTH.TOKEN_CLEANUP_CRON_SCHEDULE, async () => {
    try {
      await cleanupExpiredTokens()
    } catch (err: unknown) {
      logger.error('Token cleanup failed', 'Auth', err)
    }
  })

  // Clean up orphaned images daily at 3:00 AM
  cron.schedule(UPLOADS.IMAGE_CLEANUP_CRON_SCHEDULE, async () => {
    try {
      await cleanupOrphanedImages()
    } catch (err: unknown) {
      logger.error('Image cleanup failed', 'ImageCleanup', err)
    }
  })

  logger.info('Cron jobs registered', 'Cron')
}
