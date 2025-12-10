import { prisma } from '../lib/prisma'
import { Prisma } from '@prisma/client'
import { AppError } from '../middleware/errorHandler'
import { getActivePromotion } from './promotion.service'
import {
  getExchangeRates,
  getExchangeRateSettings,
} from './exchange-rate.service'
import { ShippingAddress, CartItemInput } from '../schemas/checkout'
import { logger } from '../lib/logger'
import crypto from 'crypto'

export interface CreateOrderParams {
  userId?: number
  guestEmail?: string
  shippingAddress: ShippingAddress
  items: CartItemInput[]
  stripeSessionId: string
}

export interface OrderCalculation {
  subtotalRON: Prisma.Decimal
  discountRON: Prisma.Decimal
  discountPercent: number | null
  totalRON: Prisma.Decimal
  totalEUR: number
  exchangeRate: number
  feePercent: number
  orderItems: Array<{
    productId: number
    productName: string
    productBrand: string
    productSlug: string
    volumeMl: number
    imageUrl: string | null
    quantity: number
    unitPriceRON: Prisma.Decimal
    totalPriceRON: Prisma.Decimal
  }>
}

/**
 * Generate order number from order ID.
 * Format: ORD-YYYYMMDD-XXXXXX (where XXXXXX is zero-padded order ID)
 * Using the database ID guarantees uniqueness - no race conditions possible.
 */
function formatOrderNumber(orderId: number, createdAt: Date): string {
  const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, '')
  return `ORD-${dateStr}-${String(orderId).padStart(6, '0')}`
}

/**
 * Generate a temporary placeholder order number.
 * Used only during order creation before we have the database ID.
 */
function generateTempOrderNumber(): string {
  return `TEMP-${crypto.randomUUID()}`
}

export async function calculateOrder(
  items: CartItemInput[]
): Promise<OrderCalculation> {
  // Fetch products with current prices
  const productIds = items.map((i) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
    select: {
      id: true,
      name: true,
      brand: true,
      slug: true,
      priceRON: true,
      stock: true,
      volumeMl: true,
      imageUrl: true,
    },
  })

  // Validate all products exist and have stock
  const productMap = new Map(products.map((p) => [p.id, p]))
  for (const item of items) {
    const product = productMap.get(item.productId)
    if (!product) {
      throw new AppError(
        `Product ${item.productId} not found`,
        404,
        'PRODUCT_NOT_FOUND'
      )
    }
    if (product.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        400,
        'INSUFFICIENT_STOCK'
      )
    }
  }

  // Calculate totals
  let subtotalRON = new Prisma.Decimal(0)
  const orderItems = items.map((item) => {
    const product = productMap.get(item.productId)!
    const totalPrice = product.priceRON.mul(item.quantity)
    subtotalRON = subtotalRON.add(totalPrice)

    return {
      productId: product.id,
      productName: product.name,
      productBrand: product.brand,
      productSlug: product.slug,
      volumeMl: product.volumeMl,
      imageUrl: product.imageUrl,
      quantity: item.quantity,
      unitPriceRON: product.priceRON,
      totalPriceRON: totalPrice,
    }
  })

  // Check for active promotion
  const promotion = await getActivePromotion()
  let discountRON = new Prisma.Decimal(0)
  let discountPercent: number | null = null

  if (promotion) {
    discountPercent = promotion.discountPercent
    discountRON = subtotalRON.mul(discountPercent).div(100)
  }

  const totalRON = subtotalRON.sub(discountRON)

  // Get exchange rate and fee for EUR conversion
  const [rates, settings] = await Promise.all([
    getExchangeRates(),
    getExchangeRateSettings(),
  ])

  const eurRate = rates?.EUR || 4.97 // Fallback rate
  const feePercent = settings.feePercent.toNumber()

  // Convert to EUR with fee: priceEUR = priceRON / eurRate * (1 + feePercent/100)
  const totalEUR =
    (totalRON.toNumber() / eurRate) * (1 + feePercent / 100)

  return {
    subtotalRON,
    discountRON,
    discountPercent,
    totalRON,
    totalEUR,
    exchangeRate: eurRate,
    feePercent,
    orderItems,
  }
}

export async function createOrder(params: CreateOrderParams) {
  const { userId, guestEmail, shippingAddress, items, stripeSessionId } = params

  // Validate: either userId or guestEmail must be provided
  if (!userId && !guestEmail) {
    throw new AppError(
      'Guest email required for guest checkout',
      400,
      'GUEST_EMAIL_REQUIRED'
    )
  }

  // Calculate order totals (validates stock availability)
  const calculation = await calculateOrder(items)

  // Create order and reserve stock in a single transaction
  // This ensures atomicity - either both succeed or both fail
  const order = await prisma.$transaction(async (tx) => {
    // 1. Create order with temporary order number
    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateTempOrderNumber(),
        userId,
        guestEmail,
        customerName: shippingAddress.name,
        customerPhone: shippingAddress.phone,
        shippingAddressLine1: shippingAddress.addressLine1,
        shippingAddressLine2: shippingAddress.addressLine2,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state,
        shippingPostalCode: shippingAddress.postalCode,
        shippingCountry: shippingAddress.country,
        subtotalRON: calculation.subtotalRON,
        discountRON: calculation.discountRON,
        discountPercent: calculation.discountPercent,
        totalRON: calculation.totalRON,
        stripeSessionId,
        exchangeRateUsed: new Prisma.Decimal(calculation.exchangeRate),
        exchangeFeePercent: new Prisma.Decimal(calculation.feePercent),
        items: { create: calculation.orderItems },
      },
      include: { items: true },
    })

    // 2. Reserve stock by decrementing for each item
    // If any product has insufficient stock, the transaction will fail
    for (const item of calculation.orderItems) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: { gte: item.quantity }, // Only update if sufficient stock
        },
        data: {
          stock: { decrement: item.quantity },
        },
      })

      // If no rows were updated, stock is insufficient (race condition caught)
      if (updated.count === 0) {
        throw new AppError(
          `Insufficient stock for ${item.productName}. Another order may have reserved it.`,
          409,
          'STOCK_RESERVATION_FAILED'
        )
      }
    }

    // 3. Generate real order number using the database ID (guaranteed unique)
    const orderNumber = formatOrderNumber(newOrder.id, newOrder.createdAt)

    // 4. Update order with real order number
    const finalOrder = await tx.order.update({
      where: { id: newOrder.id },
      data: { orderNumber },
      include: { items: true },
    })

    return finalOrder
  })

  logger.info(
    `Order created: ${order.orderNumber} (Session: ${stripeSessionId}) - Stock reserved`,
    'OrderService'
  )

  return { order, calculation }
}

export async function markOrderPaid(
  stripeSessionId: string,
  paymentIntentId: string,
  amountEURCents: number
) {
  const order = await prisma.order.findUnique({
    where: { stripeSessionId },
    include: { items: true },
  })

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
  }

  if (order.status !== 'PENDING') {
    // Already processed - idempotency
    logger.info(
      `Order ${order.orderNumber} already processed (status: ${order.status})`,
      'OrderService'
    )
    return order
  }

  // Stock was already reserved when order was created (PENDING status)
  // Just update order status to PAID
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntentId,
      paidAmountEUR: new Prisma.Decimal(amountEURCents / 100),
    },
    include: { items: true },
  })

  logger.info(
    `Order ${order.orderNumber} marked as PAID (PaymentIntent: ${paymentIntentId})`,
    'OrderService'
  )

  return updatedOrder
}

export async function markOrderCancelled(stripeSessionId: string) {
  const order = await prisma.order.findUnique({
    where: { stripeSessionId },
    include: { items: true },
  })

  if (!order) {
    // Session may have expired before order was created
    return null
  }

  if (order.status !== 'PENDING') {
    // Only cancel pending orders - stock already released or order completed
    return order
  }

  // Cancel order and restore reserved stock in a single transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Restore stock for all items
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }

    // Update order status
    return tx.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
      include: { items: true },
    })
  })

  logger.info(
    `Order ${order.orderNumber} cancelled - Stock restored`,
    'OrderService'
  )

  return updated
}

export async function getUserOrders(userId: number, page = 1, limit = 10) {
  const skip = (page - 1) * limit

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where: { userId } }),
  ])

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function getOrderById(id: number, userId?: number) {
  const where: Prisma.OrderWhereInput = { id }
  if (userId !== undefined) {
    where.userId = userId // Ensure user can only access their own orders
  }

  const order = await prisma.order.findFirst({
    where,
    include: { items: true },
  })

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
  }

  return order
}

export async function getOrderBySessionId(sessionId: string) {
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    include: { items: true },
  })

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
  }

  return order
}

/**
 * Cleanup stale PENDING orders that have exceeded the timeout.
 * This handles edge cases where Stripe webhook was never received.
 *
 * Stripe Checkout sessions expire after 30 minutes by default.
 * We use 45 minutes as the cutoff to allow extra buffer for webhook delivery.
 *
 * Should be called by a cron job every 15 minutes.
 */
export async function cleanupStalePendingOrders(
  timeoutMinutes = 45
): Promise<{ cancelled: number; errors: number }> {
  const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000)

  // Find all stale PENDING orders
  const staleOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoffTime },
    },
    include: { items: true },
  })

  if (staleOrders.length === 0) {
    return { cancelled: 0, errors: 0 }
  }

  logger.info(
    `Found ${staleOrders.length} stale PENDING orders to cleanup`,
    'OrderCleanup'
  )

  let cancelled = 0
  let errors = 0

  for (const order of staleOrders) {
    try {
      // Cancel order and restore stock in a transaction
      await prisma.$transaction(async (tx) => {
        // Restore stock for all items
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }

        // Update order status
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        })
      })

      logger.info(
        `Stale order ${order.orderNumber} cancelled - Stock restored`,
        'OrderCleanup'
      )
      cancelled++
    } catch (err) {
      logger.error(
        `Failed to cleanup stale order ${order.orderNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'OrderCleanup'
      )
      errors++
    }
  }

  logger.info(
    `Cleanup complete: ${cancelled} orders cancelled, ${errors} errors`,
    'OrderCleanup'
  )

  return { cancelled, errors }
}

// ============================================================================
// Admin Functions
// ============================================================================

export interface AdminListOrdersParams {
  page?: number
  limit?: number
  status?: string
  search?: string
  sortBy?: 'createdAt' | 'totalRON' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export async function adminListOrders(params: AdminListOrdersParams = {}) {
  const {
    page = 1,
    limit = 20,
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params

  const skip = (page - 1) * limit

  const where: Prisma.OrderWhereInput = {}

  // Filter by status
  if (status && status !== 'all') {
    where.status = status as Prisma.EnumOrderStatusFilter['equals']
  }

  // Search by order number, customer name, or email
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { guestEmail: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  // Build orderBy
  const orderBy: Prisma.OrderOrderByWithRelationInput = {}
  orderBy[sortBy] = sortOrder

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function adminGetOrderById(id: number) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: { select: { id: true, email: true, name: true } },
    },
  })

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
  }

  return order
}

// Valid status transitions for admin
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CANCELLED'], // Admin can cancel pending orders (webhook handles PAID)
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [], // Terminal state
  REFUNDED: [], // Terminal state
}

export async function adminUpdateOrderStatus(
  id: number,
  newStatus: string
): Promise<{ order: Awaited<ReturnType<typeof adminGetOrderById>>; stockRestored: boolean }> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
  }

  const currentStatus = order.status
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || []

  if (!validTransitions.includes(newStatus)) {
    throw new AppError(
      `Cannot transition from ${currentStatus} to ${newStatus}`,
      400,
      'INVALID_STATUS_TRANSITION'
    )
  }

  let stockRestored = false

  // Handle stock restoration for cancellations/refunds from non-cancelled states
  const needsStockRestore =
    (newStatus === 'CANCELLED' || newStatus === 'REFUNDED') &&
    currentStatus !== 'CANCELLED' &&
    currentStatus !== 'REFUNDED'

  if (needsStockRestore) {
    // Restore stock in a transaction
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }

      await tx.order.update({
        where: { id },
        data: { status: newStatus as Prisma.EnumOrderStatusFieldUpdateOperationsInput['set'] },
      })
    })

    stockRestored = true
    logger.info(
      `Order ${order.orderNumber} status updated to ${newStatus} - Stock restored`,
      'OrderService'
    )
  } else {
    // Simple status update
    await prisma.order.update({
      where: { id },
      data: { status: newStatus as Prisma.EnumOrderStatusFieldUpdateOperationsInput['set'] },
    })

    logger.info(
      `Order ${order.orderNumber} status updated to ${newStatus}`,
      'OrderService'
    )
  }

  const updatedOrder = await adminGetOrderById(id)
  return { order: updatedOrder, stockRestored }
}

export async function getOrderStats() {
  const [statusCounts, recentOrdersCount, totalRevenue] = await Promise.all([
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.order.aggregate({
      where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      _sum: { totalRON: true },
    }),
  ])

  return {
    byStatus: Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count.id])
    ),
    last24Hours: recentOrdersCount,
    totalRevenue: totalRevenue._sum.totalRON?.toNumber() || 0,
  }
}
