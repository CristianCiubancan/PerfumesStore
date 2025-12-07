import { Request, Response } from 'express'
import * as newsletterService from '../services/newsletter.service'
import { createAuditLog } from '../lib/auditLogger'
import { parseIdParam } from '../lib/parseParams'

export async function listSubscribers(req: Request, res: Response): Promise<void> {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
  const isActive = req.query.isActive !== undefined
    ? req.query.isActive === 'true'
    : undefined

  const result = await newsletterService.listSubscribers({ page, limit, isActive })

  res.json({ data: result })
}

export async function unsubscribe(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)

  // Service returns both old and new values (single fetch, no N+1)
  const { oldValue, newValue } = await newsletterService.unsubscribe(id)

  // Audit log
  createAuditLog(req, {
    action: 'UPDATE',
    entityType: 'NEWSLETTER_SUBSCRIBER',
    entityId: id,
    oldValue,
    newValue,
  })

  res.json({ data: newValue })
}

export async function deleteSubscriber(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)

  // Service returns deleted subscriber for audit (single fetch, no N+1)
  const { deletedSubscriber } = await newsletterService.deleteSubscriber(id)

  // Audit log
  createAuditLog(req, {
    action: 'DELETE',
    entityType: 'NEWSLETTER_SUBSCRIBER',
    entityId: id,
    oldValue: deletedSubscriber,
  })

  res.json({ data: { message: 'Subscriber deleted successfully' } })
}
