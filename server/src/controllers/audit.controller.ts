import { Request, Response } from 'express'
import * as auditService from '../services/audit.service'
import { AuditAction, AuditEntityType } from '../services/audit.service'
import { parseIntParam, parseDateParam } from '../lib/parseParams'

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const {
    page,
    limit,
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
  } = req.query

  const result = await auditService.listAuditLogs({
    page: parseIntParam(page),
    limit: parseIntParam(limit),
    userId: parseIntParam(userId),
    action: action as AuditAction | undefined,
    entityType: entityType as AuditEntityType | undefined,
    entityId: parseIntParam(entityId),
    startDate: parseDateParam(startDate),
    endDate: parseDateParam(endDate),
  })

  res.json({ data: result })
}
