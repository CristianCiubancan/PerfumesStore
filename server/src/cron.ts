import cron from 'node-cron'
import { updateExchangeRates } from './services/exchange-rate.service'
import { cleanupExpiredTokens } from './services/auth.service'
import { cleanupOrphanedImages } from './services/image-cleanup.service'
import { EXCHANGE_RATE, AUTH, UPLOADS } from './config/constants'
import { logger } from './lib/logger'

export async function initExchangeRates() {
  try {
    await updateExchangeRates()
    logger.info('Initial fetch completed', 'ExchangeRate')
  } catch (error) {
    logger.error('Initial fetch failed', 'ExchangeRate', error)
  }
}

export async function initTokenCleanup() {
  try {
    const count = await cleanupExpiredTokens()
    logger.info(`Initial cleanup completed, removed ${count} tokens`, 'Auth')
  } catch (error) {
    logger.error('Initial token cleanup failed', 'Auth', error)
  }
}

export async function initImageCleanup() {
  try {
    const count = await cleanupOrphanedImages()
    logger.info(`Initial cleanup completed, removed ${count} orphaned images`, 'ImageCleanup')
  } catch (error) {
    logger.error('Initial image cleanup failed', 'ImageCleanup', error)
  }
}

export function registerCronJobs() {
  // Update exchange rates
  cron.schedule(EXCHANGE_RATE.CRON_SCHEDULE, async () => {
    try {
      await updateExchangeRates()
    } catch (error) {
      logger.error('Scheduled fetch failed', 'ExchangeRate', error)
    }
  })

  // Clean up expired/revoked refresh tokens every 10 minutes
  cron.schedule(AUTH.TOKEN_CLEANUP_CRON_SCHEDULE, async () => {
    try {
      await cleanupExpiredTokens()
    } catch (error) {
      logger.error('Token cleanup failed', 'Auth', error)
    }
  })

  // Clean up orphaned images daily at 3:00 AM
  cron.schedule(UPLOADS.IMAGE_CLEANUP_CRON_SCHEDULE, async () => {
    try {
      await cleanupOrphanedImages()
    } catch (error) {
      logger.error('Image cleanup failed', 'ImageCleanup', error)
    }
  })

  logger.info('Cron jobs registered', 'Cron')
}
