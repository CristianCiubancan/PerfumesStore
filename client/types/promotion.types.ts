/**
 * Promotion-related types
 */

export interface Promotion {
  id: number
  name: string
  discountPercent: number
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ActivePromotionResponse {
  promotion: Promotion | null
  serverTime: string
}

export interface CreatePromotionInput {
  name: string
  discountPercent: number
  startDate: string
  endDate: string
  isActive?: boolean
}

export type UpdatePromotionInput = Partial<CreatePromotionInput>
