/**
 * Audit log types
 */

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_DELETE'
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'

export type AuditEntityType = 'PRODUCT' | 'PROMOTION' | 'USER' | 'SETTINGS' | 'FILE' | 'NEWSLETTER_SUBSCRIBER' | 'ORDER'

export type AuditResult = 'SUCCESS' | 'FAILURE' | 'PARTIAL'

export interface AuditLog {
  id: number
  userId: number | null
  user: {
    id: number
    email: string
    name: string
  } | null
  action: AuditAction
  entityType: AuditEntityType
  entityId: number | null
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  result: AuditResult | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface AuditLogsResponse {
  logs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
