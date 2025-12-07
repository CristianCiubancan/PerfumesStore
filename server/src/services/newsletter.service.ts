import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

export interface NewsletterSubscriber {
  id: number
  email: string
  isActive: boolean
  subscribedAt: Date
  unsubscribedAt: Date | null
}

export interface ListSubscribersParams {
  page?: number
  limit?: number
  isActive?: boolean
}

export interface ListSubscribersResult {
  subscribers: NewsletterSubscriber[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function subscribe(email: string): Promise<NewsletterSubscriber> {
  // Use upsert to handle race conditions atomically
  // - If email doesn't exist: create new subscriber
  // - If email exists but inactive: reactivate
  // - If email exists and active: no-op (returns existing)
  return prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      email,
      isActive: true,
    },
    update: {
      isActive: true,
      unsubscribedAt: null,
    },
  })
}

export async function unsubscribe(id: number): Promise<{ oldValue: NewsletterSubscriber; newValue: NewsletterSubscriber }> {
  // Fetch existing subscriber once - used for validation and audit
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new AppError('Subscriber not found', 404, 'SUBSCRIBER_NOT_FOUND')
  }

  if (!existing.isActive) {
    throw new AppError('Subscriber already unsubscribed', 400, 'ALREADY_UNSUBSCRIBED')
  }

  const updated = await prisma.newsletterSubscriber.update({
    where: { id },
    data: {
      isActive: false,
      unsubscribedAt: new Date(),
    },
  })

  return { oldValue: existing, newValue: updated }
}

export async function getSubscriber(id: number): Promise<NewsletterSubscriber | null> {
  return prisma.newsletterSubscriber.findUnique({
    where: { id },
  })
}

export async function listSubscribers(
  params: ListSubscribersParams = {}
): Promise<ListSubscribersResult> {
  const { page = 1, limit = 20, isActive } = params
  const skip = (page - 1) * limit

  const where = isActive !== undefined ? { isActive } : {}

  const [subscribers, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { subscribedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.newsletterSubscriber.count({ where }),
  ])

  return {
    subscribers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function deleteSubscriber(id: number): Promise<{ deletedSubscriber: NewsletterSubscriber }> {
  // Fetch existing subscriber once - used for validation and audit
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new AppError('Subscriber not found', 404, 'SUBSCRIBER_NOT_FOUND')
  }

  await prisma.newsletterSubscriber.delete({
    where: { id },
  })

  return { deletedSubscriber: existing }
}
