type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: string
  data?: unknown
}

const isDevelopment = process.env.NODE_ENV !== 'production'

function formatLog(entry: LogEntry): string {
  if (isDevelopment) {
    const prefix = entry.context ? `[${entry.context}]` : ''
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : ''
    return `${entry.timestamp} ${entry.level.toUpperCase()} ${prefix} ${entry.message}${dataStr}`
  }
  return JSON.stringify(entry)
}

function createLogEntry(level: LogLevel, message: string, context?: string, data?: unknown): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data,
  }
}

export const logger = {
  info: (message: string, context?: string, data?: unknown) => {
    const entry = createLogEntry('info', message, context, data)
    console.log(formatLog(entry))
  },
  warn: (message: string, context?: string, data?: unknown) => {
    const entry = createLogEntry('warn', message, context, data)
    console.warn(formatLog(entry))
  },
  error: (message: string, context?: string, error?: unknown) => {
    const entry = createLogEntry('error', message, context, error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error)
    console.error(formatLog(entry))
  },
  debug: (message: string, context?: string, data?: unknown) => {
    if (isDevelopment) {
      const entry = createLogEntry('debug', message, context, data)
      console.debug(formatLog(entry))
    }
  },
}
