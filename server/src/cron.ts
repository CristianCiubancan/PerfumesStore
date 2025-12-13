import cron, { ScheduledTask } from 'node-cron'
import { updateExchangeRates } from './services/exchange-rate.service'
import { cleanupExpiredTokens } from './services/auth.service'
import { cleanupOrphanedImages } from './services/image-cleanup.service'
import { cleanupStalePendingOrders } from './services/order.service'
import { processScheduledCampaigns } from './services/campaign.service'
import { EXCHANGE_RATE, AUTH, UPLOADS, ORDER, CAMPAIGN } from './config/constants'
import { logger } from './lib/logger'

// Store references to scheduled tasks for cleanup
const scheduledTasks: ScheduledTask[] = []

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

export async function initOrderCleanup(): Promise<void> {
  try {
    const result = await cleanupStalePendingOrders(ORDER.STALE_PENDING_TIMEOUT_MINUTES)
    logger.info(
      `Initial cleanup completed: ${result.cancelled} stale orders cancelled`,
      'OrderCleanup'
    )
  } catch (err: unknown) {
    logger.error('Initial order cleanup failed', 'OrderCleanup', err)
  }
}

export function registerCronJobs(): void {
  // Update exchange rates
  const exchangeRateTask = cron.schedule(EXCHANGE_RATE.CRON_SCHEDULE, async () => {
    try {
      await updateExchangeRates()
    } catch (err: unknown) {
      logger.error('Scheduled fetch failed', 'ExchangeRate', err)
    }
  })
  scheduledTasks.push(exchangeRateTask)

  // Clean up expired/revoked refresh tokens every 10 minutes
  const tokenCleanupTask = cron.schedule(AUTH.TOKEN_CLEANUP_CRON_SCHEDULE, async () => {
    try {
      await cleanupExpiredTokens()
    } catch (err: unknown) {
      logger.error('Token cleanup failed', 'Auth', err)
    }
  })
  scheduledTasks.push(tokenCleanupTask)

  // Clean up orphaned images daily at 3:00 AM
  const imageCleanupTask = cron.schedule(UPLOADS.IMAGE_CLEANUP_CRON_SCHEDULE, async () => {
    try {
      await cleanupOrphanedImages()
    } catch (err: unknown) {
      logger.error('Image cleanup failed', 'ImageCleanup', err)
    }
  })
  scheduledTasks.push(imageCleanupTask)

  // Clean up stale PENDING orders every 15 minutes
  // This restores stock for orders where payment was never completed
  const orderCleanupTask = cron.schedule(ORDER.STALE_ORDER_CLEANUP_CRON_SCHEDULE, async () => {
    try {
      await cleanupStalePendingOrders(ORDER.STALE_PENDING_TIMEOUT_MINUTES)
    } catch (err: unknown) {
      logger.error('Order cleanup failed', 'OrderCleanup', err)
    }
  })
  scheduledTasks.push(orderCleanupTask)

  // Process scheduled email campaigns every minute
  const campaignTask = cron.schedule(CAMPAIGN.CRON_SCHEDULE, async () => {
    try {
      await processScheduledCampaigns()
    } catch (err: unknown) {
      logger.error('Campaign processing failed', 'CampaignCron', err)
    }
  })
  scheduledTasks.push(campaignTask)

  logger.info('Cron jobs registered', 'Cron')
}

/**
 * Stop all scheduled cron jobs
 * Should be called during graceful shutdown
 */
export function stopCronJobs(): void {
  for (const task of scheduledTasks) {
    task.stop()
  }
  scheduledTasks.length = 0 // Clear the array
  logger.info('All cron jobs stopped', 'Cron')
}
