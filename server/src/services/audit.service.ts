import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { PAGINATION } from '../config/constants'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_DELETE'
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'

export type AuditEntityType =
  | 'PRODUCT'
  | 'PROMOTION'
  | 'USER'
  | 'SETTINGS'
  | 'FILE'
  | 'NEWSLETTER_SUBSCRIBER'
  | 'NEWSLETTER_CAMPAIGN'
  | 'ORDER'

export type AuditResult = 'SUCCESS' | 'FAILURE' | 'PARTIAL'

export interface AuditLogInput {
  userId: number
  action: AuditAction
  entityType: AuditEntityType
  entityId?: number
  oldValue?: Prisma.InputJsonValue
  newValue?: Prisma.InputJsonValue
  result?: AuditResult
  ipAddress?: string
  userAgent?: string
}

export async function logAuditAction(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        oldValue: input.oldValue ?? Prisma.JsonNull,
        newValue: input.newValue ?? Prisma.JsonNull,
        result: input.result ?? 'SUCCESS',
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    })

    logger.info(
      `Audit: ${input.action} on ${input.entityType}${input.entityId ? ` #${input.entityId}` : ''} by user #${input.userId}`,
      'AuditService'
    )
  } catch (err: unknown) {
    // Log the error but don't throw - audit logging should not break the main operation
    logger.error('Failed to create audit log', 'AuditService', err instanceof Error ? err : undefined)
  }
}

interface ListAuditLogsParams {
  page?: number
  limit?: number
  userId?: number
  action?: AuditAction
  entityType?: AuditEntityType
  entityId?: number
  startDate?: Date
  endDate?: Date
}

// Maximum safe page number to prevent integer overflow (1 million pages)
const MAX_PAGE = 1000000

export async function listAuditLogs(params: ListAuditLogsParams = {}) {
  const {
    page: rawPage = 1,
    limit: rawLimit = 50,
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
  } = params

  // Clamp page to valid range to prevent integer overflow
  const page = Math.min(Math.max(1, rawPage), MAX_PAGE)

  // Clamp limit to valid range for defense-in-depth
  const limit = Math.min(Math.max(1, rawLimit), PAGINATION.MAX_LIMIT)

  const where: {
    userId?: number
    action?: string
    entityType?: string
    entityId?: number
    createdAt?: { gte?: Date; lte?: Date }
  } = {}

  if (userId !== undefined) {
    where.userId = userId
  }

  if (action) {
    where.action = action
  }

  if (entityType) {
    where.entityType = entityType
  }

  if (entityId !== undefined) {
    where.entityId = entityId
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = startDate
    }
    if (endDate) {
      where.createdAt.lte = endDate
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
