import fs from 'fs'
import path from 'path'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: string
  data?: unknown
  requestId?: string
}

type LogTransport = (entry: LogEntry) => void | Promise<void>

const isDevelopment = process.env.NODE_ENV !== 'production'
const LOG_DIR = process.env.LOG_DIR || 'logs'
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true'
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as LogLevel

// Log level hierarchy
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Check if a log level should be logged based on configured minimum level
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL]
}

// Registered transports for log aggregation
const transports: LogTransport[] = []

/**
 * Register a custom transport for log aggregation.
 * Example: Send logs to CloudWatch, Datadog, or ELK stack.
 */
export function registerTransport(transport: LogTransport): void {
  transports.push(transport)
}

/**
 * Remove all custom transports.
 */
export function clearTransports(): void {
  transports.length = 0
}

function formatLog(entry: LogEntry): string {
  if (isDevelopment) {
    const prefix = entry.context ? `[${entry.context}]` : ''
    const requestIdStr = entry.requestId ? ` [req:${entry.requestId}]` : ''
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : ''
    return `${entry.timestamp} ${entry.level.toUpperCase()}${requestIdStr} ${prefix} ${entry.message}${dataStr}`
  }
  // Production: JSON format for log aggregation tools
  return JSON.stringify(entry)
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: string,
  data?: unknown,
  requestId?: string
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data,
    requestId,
  }
}

// Ensure log directory exists
function ensureLogDir(): void {
  if (LOG_TO_FILE && !fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

// Write to file (append mode)
function writeToFile(entry: LogEntry): void {
  if (!LOG_TO_FILE) return

  try {
    ensureLogDir()
    const date = new Date().toISOString().split('T')[0]
    const filename = path.join(LOG_DIR, `app-${date}.log`)
    const line = formatLog(entry) + '\n'
    fs.appendFileSync(filename, line)
  } catch {
    // Silently fail file writes to prevent logging from breaking the app
  }
}

// Send to all registered transports
async function sendToTransports(entry: LogEntry): Promise<void> {
  for (const transport of transports) {
    try {
      await transport(entry)
    } catch {
      // Silently fail transport errors
    }
  }
}

// Core logging function
function log(
  level: LogLevel,
  message: string,
  context?: string,
  data?: unknown,
  requestId?: string
): void {
  if (!shouldLog(level)) return

  const entry = createLogEntry(level, message, context, data, requestId)
  const formatted = formatLog(entry)

  // Console output
  switch (level) {
    case 'error':
      console.error(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'debug':
      console.debug(formatted)
      break
    default:
      console.log(formatted)
  }

  // File output (if enabled)
  writeToFile(entry)

  // Send to transports (async, fire-and-forget)
  sendToTransports(entry)
}

export const logger = {
  info: (message: string, context?: string, data?: unknown, requestId?: string) => {
    log('info', message, context, data, requestId)
  },
  warn: (message: string, context?: string, data?: unknown, requestId?: string) => {
    log('warn', message, context, data, requestId)
  },
  error: (message: string, context?: string, error?: unknown, requestId?: string) => {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error
    log('error', message, context, errorData, requestId)
  },
  debug: (message: string, context?: string, data?: unknown, requestId?: string) => {
    log('debug', message, context, data, requestId)
  },
}

/**
 * Create a child logger with preset context and optional request ID.
 * Useful for request-scoped logging.
 */
export function createChildLogger(context: string, requestId?: string) {
  return {
    info: (message: string, data?: unknown) => logger.info(message, context, data, requestId),
    warn: (message: string, data?: unknown) => logger.warn(message, context, data, requestId),
    error: (message: string, error?: unknown) => logger.error(message, context, error, requestId),
    debug: (message: string, data?: unknown) => logger.debug(message, context, data, requestId),
  }
}

/**
 * Example transport for external log aggregation.
 * Use this as a template for CloudWatch, Datadog, ELK, etc.
 */
export function createHttpTransport(endpoint: string, headers?: Record<string, string>): LogTransport {
  return async (entry: LogEntry) => {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(entry),
      })
    } catch {
      // Silently fail - logging should never break the app
    }
  }
}
