/**
 * Newsletter-related types
 */

export interface NewsletterSubscriber {
  id: number
  email: string
  isActive: boolean
  subscribedAt: string
  unsubscribedAt: string | null
}

export interface NewsletterSubscribersResponse {
  subscribers: NewsletterSubscriber[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
