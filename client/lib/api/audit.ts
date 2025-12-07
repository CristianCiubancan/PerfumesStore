import { api } from './client'
import { AuditLogsResponse, AuditAction, AuditEntityType } from '@/types'

export interface AuditLogsParams {
  page?: number
  limit?: number
  userId?: number
  action?: AuditAction
  entityType?: AuditEntityType
  entityId?: number
  startDate?: string
  endDate?: string
}

export const auditApi = {
  // Admin - list audit logs with filtering
  list: (params: AuditLogsParams = {}) => {
    const searchParams = new URLSearchParams()

    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.userId) searchParams.set('userId', params.userId.toString())
    if (params.action) searchParams.set('action', params.action)
    if (params.entityType) searchParams.set('entityType', params.entityType)
    if (params.entityId) searchParams.set('entityId', params.entityId.toString())
    if (params.startDate) searchParams.set('startDate', params.startDate)
    if (params.endDate) searchParams.set('endDate', params.endDate)

    const queryString = searchParams.toString()
    const url = queryString
      ? `/api/admin/audit-logs?${queryString}`
      : '/api/admin/audit-logs'

    return api.get<AuditLogsResponse>(url)
  },
}
