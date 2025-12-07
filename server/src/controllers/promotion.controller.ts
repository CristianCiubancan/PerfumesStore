import { Request, Response } from 'express'
import * as promotionService from '../services/promotion.service'
import { createAuditLog } from '../lib/auditLogger'
import { parseIdParam, parseIntParam, parseBooleanParam } from '../lib/parseParams'

export async function createPromotion(req: Request, res: Response): Promise<void> {
  const promotion = await promotionService.createPromotion(req.body)

  // Audit log
  createAuditLog(req, {
    action: 'CREATE',
    entityType: 'PROMOTION',
    entityId: promotion.id,
    newValue: promotion,
  })

  res.status(201).json({ data: promotion })
}

export async function updatePromotion(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)

  // Service returns both old and new values (single fetch, no N+1)
  const { oldValue, newValue } = await promotionService.updatePromotion(id, req.body)

  // Audit log
  createAuditLog(req, {
    action: 'UPDATE',
    entityType: 'PROMOTION',
    entityId: id,
    oldValue,
    newValue,
  })

  res.json({ data: newValue })
}

export async function deletePromotion(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)

  // Service returns deleted promotion for audit (single fetch, no N+1)
  const { deletedPromotion } = await promotionService.deletePromotion(id)

  // Audit log
  createAuditLog(req, {
    action: 'DELETE',
    entityType: 'PROMOTION',
    entityId: id,
    oldValue: deletedPromotion,
  })

  res.json({ data: { message: 'Promotion deleted successfully' } })
}

export async function getPromotion(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)
  const promotion = await promotionService.getPromotion(id)
  res.json({ data: promotion })
}

export async function listPromotions(req: Request, res: Response): Promise<void> {
  const { page, limit, isActive } = req.query

  const result = await promotionService.listPromotions({
    page: parseIntParam(page),
    limit: parseIntParam(limit),
    isActive: parseBooleanParam(isActive),
  })

  res.json({ data: result })
}

export async function getActivePromotion(_req: Request, res: Response): Promise<void> {
  const promotion = await promotionService.getActivePromotion()
  const serverTime = await promotionService.getServerTime()
  res.json({ data: { promotion, serverTime: serverTime.toISOString() } })
}
