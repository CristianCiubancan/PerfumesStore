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

/**
 * Create an audit log entry from a request context.
 * This is a convenience wrapper around logAuditAction that extracts
 * common fields from the request object and handles JSON serialization.
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
    ipAddress: req.ip,
    userAgent: req.headers?.['user-agent'] ?? req.get?.('user-agent'),
  })
}
