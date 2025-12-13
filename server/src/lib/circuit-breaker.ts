import { logger } from './logger'

export interface CircuitBreakerOptions {
  /** Name for logging */
  name: string
  /** Number of failures before opening circuit */
  failureThreshold: number
  /** Time in ms to wait before attempting to close circuit */
  resetTimeout: number
  /** Maximum number of half-open requests to allow */
  halfOpenRequests?: number
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

/**
 * Circuit Breaker implementation for protecting against cascading failures
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Requests are rejected immediately (circuit is "tripped")
 * - HALF_OPEN: Limited requests allowed to test if service recovered
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failureCount = 0
  private successCount = 0
  private lastFailureTime = 0
  private halfOpenAttempts = 0

  private readonly name: string
  private readonly failureThreshold: number
  private readonly resetTimeout: number
  private readonly halfOpenRequests: number

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name
    this.failureThreshold = options.failureThreshold
    this.resetTimeout = options.resetTimeout
    this.halfOpenRequests = options.halfOpenRequests ?? 1
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    if (this.state === 'OPEN') {
      // Check if reset timeout has passed
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN'
        this.halfOpenAttempts = 0
        logger.info(`Circuit breaker [${this.name}] transitioned to HALF_OPEN`, 'CircuitBreaker')
      }
    }
    return this.state
  }

  /**
   * Check if circuit allows requests
   */
  isAvailable(): boolean {
    const state = this.getState()

    if (state === 'CLOSED') {
      return true
    }

    if (state === 'HALF_OPEN') {
      // Allow limited requests in half-open state
      return this.halfOpenAttempts < this.halfOpenRequests
    }

    // OPEN state - reject
    return false
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    const state = this.getState()

    if (state === 'HALF_OPEN') {
      this.successCount++
      // If we've had enough successful half-open requests, close the circuit
      if (this.successCount >= this.halfOpenRequests) {
        this.reset()
        logger.info(`Circuit breaker [${this.name}] closed after recovery`, 'CircuitBreaker')
      }
    } else if (state === 'CLOSED') {
      // Reset failure count on success in closed state
      this.failureCount = 0
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    const state = this.getState()

    if (state === 'HALF_OPEN') {
      // Any failure in half-open immediately opens the circuit
      this.trip()
      logger.warn(`Circuit breaker [${this.name}] re-opened after failure in HALF_OPEN`, 'CircuitBreaker')
    } else if (state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this.trip()
      logger.warn(
        `Circuit breaker [${this.name}] opened after ${this.failureCount} failures`,
        'CircuitBreaker'
      )
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.isAvailable()) {
      const error = new Error(`Circuit breaker [${this.name}] is OPEN - request rejected`)
      ;(error as Error & { code: string }).code = 'CIRCUIT_OPEN'
      throw error
    }

    if (this.getState() === 'HALF_OPEN') {
      this.halfOpenAttempts++
    }

    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  /**
   * Trip the circuit (open it)
   */
  private trip(): void {
    this.state = 'OPEN'
    this.successCount = 0
    this.halfOpenAttempts = 0
  }

  /**
   * Reset the circuit to closed state
   */
  private reset(): void {
    this.state = 'CLOSED'
    this.failureCount = 0
    this.successCount = 0
    this.halfOpenAttempts = 0
  }

  /**
   * Force reset the circuit (for testing or manual recovery)
   */
  forceReset(): void {
    this.reset()
    logger.info(`Circuit breaker [${this.name}] force reset`, 'CircuitBreaker')
  }

  /**
   * Get circuit breaker stats
   */
  getStats(): {
    name: string
    state: CircuitState
    failureCount: number
    successCount: number
    lastFailureTime: number
  } {
    return {
      name: this.name,
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    }
  }
}

// Pre-configured circuit breakers for external services
export const stripeCircuitBreaker = new CircuitBreaker({
  name: 'Stripe',
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  halfOpenRequests: 2,
})

export const bnrCircuitBreaker = new CircuitBreaker({
  name: 'BNR',
  failureThreshold: 3,
  resetTimeout: 60000, // 60 seconds
  halfOpenRequests: 1,
})

export const resendCircuitBreaker = new CircuitBreaker({
  name: 'Resend',
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  halfOpenRequests: 2,
})
