import { Request, Response } from 'express'
import {
  adminListOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
  getOrderStats,
} from '../services/order.service'
import { createAuditLog } from '../lib/auditLogger'

export async function listOrders(req: Request, res: Response) {
  const { page, limit, status, search, sortBy, sortOrder } = req.query

  const result = await adminListOrders({
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    status: status as string | undefined,
    search: search as string | undefined,
    sortBy: sortBy as 'createdAt' | 'totalRON' | 'status' | undefined,
    sortOrder: sortOrder as 'asc' | 'desc' | undefined,
  })

  res.json({ data: result })
}

export async function getOrder(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10)
  const order = await adminGetOrderById(id)
  res.json({ data: order })
}

export async function updateOrderStatus(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10)
  const { status } = req.body

  // Get order before update for audit log
  const oldOrder = await adminGetOrderById(id)
  const oldStatus = oldOrder.status

  const { order, stockRestored } = await adminUpdateOrderStatus(id, status)

  // Create audit log
  createAuditLog(req, {
    action: 'UPDATE',
    entityType: 'ORDER',
    entityId: id,
    oldValue: { status: oldStatus },
    newValue: { status, stockRestored },
  })

  res.json({ data: order })
}

export async function getStats(req: Request, res: Response) {
  const stats = await getOrderStats()
  res.json({ data: stats })
}
