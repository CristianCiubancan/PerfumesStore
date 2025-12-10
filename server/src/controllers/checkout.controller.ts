import { Request, Response } from 'express'
import * as checkoutService from '../services/checkout.service'
import * as orderService from '../services/order.service'
import { handleStripeWebhook } from '../services/stripe-webhook.service'

export async function createCheckoutSession(req: Request, res: Response) {
  const result = await checkoutService.createCheckoutSession({
    input: req.body,
    userId: req.user?.userId,
  })

  res.json({ data: result })
}

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string
  await handleStripeWebhook(req.body, sig)
  res.json({ received: true })
}

export async function getOrderBySession(req: Request, res: Response) {
  const { sessionId } = req.params
  const order = await orderService.getOrderBySessionId(sessionId)
  res.json({ data: order })
}

export async function getUserOrders(req: Request, res: Response) {
  if (!req.user) {
    res
      .status(401)
      .json({ error: { message: 'Authentication required', code: 'UNAUTHORIZED' } })
    return
  }

  const page = parseInt(req.query.page as string, 10) || 1
  const limit = parseInt(req.query.limit as string, 10) || 10

  const result = await orderService.getUserOrders(req.user.userId, page, limit)
  res.json({ data: result })
}

export async function getOrder(req: Request, res: Response) {
  if (!req.user) {
    res
      .status(401)
      .json({ error: { message: 'Authentication required', code: 'UNAUTHORIZED' } })
    return
  }

  const id = parseInt(req.params.id, 10)
  const order = await orderService.getOrderById(id, req.user.userId)
  res.json({ data: order })
}
