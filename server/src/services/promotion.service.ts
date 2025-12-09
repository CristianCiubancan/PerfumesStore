import { prisma } from '../lib/prisma'
import { CreatePromotionInput, UpdatePromotionInput } from '../schemas/promotion'
import { AppError } from '../middleware/errorHandler'
import { PAGINATION } from '../config/constants'

export interface ListPromotionsParams {
  page?: number
  limit?: number
  isActive?: boolean
}

export interface ListPromotionsResult {
  promotions: Awaited<ReturnType<typeof prisma.promotion.findMany>>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function createPromotion(data: CreatePromotionInput): Promise<Awaited<ReturnType<typeof prisma.promotion.create>>> {
  return prisma.promotion.create({
    data: {
      name: data.name,
      discountPercent: data.discountPercent,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive ?? true,
    },
  })
}

export async function updatePromotion(id: number, data: UpdatePromotionInput) {
  // Fetch existing promotion once - used for validation and audit
  const existing = await prisma.promotion.findUnique({ where: { id } })

  if (!existing) {
    throw new AppError('Promotion not found', 404, 'PROMOTION_NOT_FOUND')
  }

  const updated = await prisma.promotion.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.discountPercent !== undefined && { discountPercent: data.discountPercent }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })

  return { oldValue: existing, newValue: updated }
}

export async function deletePromotion(id: number) {
  // Fetch existing promotion once - used for validation and audit
  const existing = await prisma.promotion.findUnique({ where: { id } })

  if (!existing) {
    throw new AppError('Promotion not found', 404, 'PROMOTION_NOT_FOUND')
  }

  await prisma.promotion.delete({
    where: { id },
  })

  return { deletedPromotion: existing }
}

export async function getPromotion(id: number) {
  const promotion = await prisma.promotion.findUnique({
    where: { id },
  })

  if (!promotion) {
    throw new AppError('Promotion not found', 404, 'PROMOTION_NOT_FOUND')
  }

  return promotion
}

export async function listPromotions(params: ListPromotionsParams = {}): Promise<ListPromotionsResult> {
  const { page = 1, limit = PAGINATION.DEFAULT_LIMIT, isActive } = params
  const skip = (page - 1) * limit

  const where = isActive !== undefined ? { isActive } : {}

  const [promotions, total] = await Promise.all([
    prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.promotion.count({ where }),
  ])

  return {
    promotions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// Get the currently active promotion (based on server time)
export async function getActivePromotion(): Promise<Awaited<ReturnType<typeof prisma.promotion.findFirst>>> {
  const now = new Date()

  return prisma.promotion.findFirst({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// Get server time for consistent countdown across all clients
export async function getServerTime(): Promise<Date> {
  return new Date()
}
