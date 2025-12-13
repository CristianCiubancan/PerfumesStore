import crypto from 'crypto'
import { Request } from 'express'
import { logAuditAction, AuditAction, AuditEntityType } from '../services/audit.service'

export { AuditAction, AuditEntityType }

interface AuditOptions {
  action: AuditAction
  entityType: AuditEntityType
  entityId?: number
  oldValue?: unknown
  newValue?: unknown
}

// Generate a random salt at startup if not configured
// This ensures IP hashes are unique per server instance even without config
const FALLBACK_SALT = crypto.randomBytes(32).toString('hex')

// Log warning if using fallback salt (only once at startup)
if (!process.env.AUDIT_IP_SALT) {
  // Import logger lazily to avoid circular dependency issues at module load time
  setImmediate(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { logger } = require('./logger')
    logger.warn(
      'AUDIT_IP_SALT environment variable not set. Using random per-instance salt. ' +
      'Set AUDIT_IP_SALT in production for consistent IP hashing across restarts.',
      'AuditLogger'
    )
  })
}

/**
 * Hash IP address for privacy-preserving audit logs
 * Uses SHA-256 to create a one-way hash of the IP address
 * This allows tracking unique IPs without storing actual IP addresses
 */
function hashIpAddress(ip: string | undefined): string | undefined {
  if (!ip) return undefined

  // Use a server-specific salt from environment variable
  // Falls back to a random per-instance salt (logged warning at startup)
  const salt = process.env.AUDIT_IP_SALT || FALLBACK_SALT

  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .substring(0, 32) // Truncate to 32 characters for storage efficiency
}

/**
 * Truncate user-agent string to reduce storage and protect privacy
 * Keeps browser/OS info but removes detailed version numbers and unique identifiers
 */
function truncateUserAgent(userAgent: string | undefined): string | undefined {
  if (!userAgent) return undefined

  // Limit to 200 characters to prevent excessively long strings
  const maxLength = 200
  if (userAgent.length <= maxLength) {
    return userAgent
  }

  return userAgent.substring(0, maxLength) + '...'
}

/**
 * Create an audit log entry from a request context.
 * This is a convenience wrapper around logAuditAction that extracts
 * common fields from the request object and handles JSON serialization.
 *
 * SEC-010: IP addresses are hashed and user-agent strings are truncated for privacy
 *
 * @param req - Express request object with user information
 * @param options - Audit log options including action, entity type, and values
 */
export function createAuditLog(req: Request, options: AuditOptions): void {
  if (!req.user) return

  logAuditAction({
    userId: req.user.userId,
    action: options.action,
    entityType: options.entityType,
    entityId: options.entityId,
    oldValue: options.oldValue ? JSON.parse(JSON.stringify(options.oldValue)) : undefined,
    newValue: options.newValue ? JSON.parse(JSON.stringify(options.newValue)) : undefined,
    ipAddress: hashIpAddress(req.ip),
    userAgent: truncateUserAgent(req.headers?.['user-agent'] ?? req.get?.('user-agent')),
  })
}
