import { logger } from './logger'

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts: number
  /** Base delay in milliseconds */
  baseDelayMs: number
  /** Maximum delay in milliseconds */
  maxDelayMs: number
  /** Context for logging */
  context?: string
  /** Optional function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  // Exponential backoff: 1s, 2s, 4s... with some jitter
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt)
  const jitter = Math.random() * 0.3 * exponentialDelay // 0-30% jitter
  return Math.min(exponentialDelay + jitter, maxDelayMs)
}

/**
 * Execute an async function with exponential backoff retry
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const context = opts.context || 'Retry'
  let lastError: Error | null = null

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if error is retryable (if custom function provided)
      if (opts.isRetryable && !opts.isRetryable(error)) {
        throw lastError
      }

      const isLastAttempt = attempt === opts.maxAttempts - 1
      if (isLastAttempt) {
        logger.error(
          `${context}: All ${opts.maxAttempts} attempts failed: ${lastError.message}`,
          context
        )
        throw lastError
      }

      const delay = getBackoffDelay(attempt, opts.baseDelayMs, opts.maxDelayMs)
      logger.warn(
        `${context}: Attempt ${attempt + 1}/${opts.maxAttempts} failed, retrying in ${Math.round(delay)}ms: ${lastError.message}`,
        context
      )
      await sleep(delay)
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed')
}

/**
 * Execute an async function with retry, returning a result object instead of throwing
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns Object with success status and either result or error
 */
export async function withRetryResult<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<{ success: true; result: T } | { success: false; error: string; attempts: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const context = opts.context || 'Retry'
  let lastError: Error | null = null

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      const result = await fn()
      return { success: true, result }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if error is retryable (if custom function provided)
      if (opts.isRetryable && !opts.isRetryable(error)) {
        return {
          success: false,
          error: lastError.message,
          attempts: attempt + 1,
        }
      }

      const isLastAttempt = attempt === opts.maxAttempts - 1
      if (!isLastAttempt) {
        const delay = getBackoffDelay(attempt, opts.baseDelayMs, opts.maxDelayMs)
        logger.warn(
          `${context}: Attempt ${attempt + 1}/${opts.maxAttempts} failed, retrying in ${Math.round(delay)}ms: ${lastError.message}`,
          context
        )
        await sleep(delay)
      }
    }
  }

  logger.error(
    `${context}: All ${opts.maxAttempts} attempts failed: ${lastError?.message}`,
    context
  )

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    attempts: opts.maxAttempts,
  }
}
