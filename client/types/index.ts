export interface User {
  id: number
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export interface AuthResponse {
  user: User
}

export interface ApiError {
  message: string
  code?: string
}

// Single source of truth for enum values - must match Prisma schema
export const genderValues = ['Men', 'Women', 'Unisex'] as const
export const concentrationValues = [
  'Eau_de_Cologne',
  'Eau_de_Toilette',
  'Eau_de_Parfum',
  'Parfum',
  'Extrait_de_Parfum',
] as const

// Derived types from constant arrays
export type Gender = (typeof genderValues)[number]
export type Concentration = (typeof concentrationValues)[number]

// Display labels for concentrations
export const concentrationLabels: Record<Concentration, string> = {
  Eau_de_Cologne: 'Eau de Cologne',
  Eau_de_Toilette: 'Eau de Toilette',
  Eau_de_Parfum: 'Eau de Parfum',
  Parfum: 'Parfum',
  Extrait_de_Parfum: 'Extrait de Parfum',
}

// Lookup table types
export interface FragranceFamily {
  id: number
  name: string
}

export interface Longevity {
  id: number
  name: string
  sortOrder: number
}

export interface Sillage {
  id: number
  name: string
  sortOrder: number
}

export interface Season {
  id: number
  name: string
}

export interface Occasion {
  id: number
  name: string
}

export interface FilterOptions {
  fragranceFamilies: FragranceFamily[]
  longevities: Longevity[]
  sillages: Sillage[]
  seasons: Season[]
  occasions: Occasion[]
}

export interface Product {
  id: number
  slug: string
  name: string
  brand: string
  concentration: Concentration
  gender: Gender
  fragranceFamilyId: number
  fragranceFamily: FragranceFamily
  topNotes: string[]
  heartNotes: string[]
  baseNotes: string[]
  volumeMl: number
  priceRON: string
  launchYear: number
  perfumer: string | null
  longevityId: number
  longevity: Longevity
  sillageId: number
  sillage: Sillage
  seasons: Season[]
  occasions: Occasion[]
  rating: string
  stock: number
  imageUrl: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductsResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateProductInput {
  name: string
  brand: string
  concentration: Concentration
  gender: Gender
  fragranceFamilyId: number
  topNotes: string[]
  heartNotes: string[]
  baseNotes: string[]
  volumeMl: number
  priceRON: number
  launchYear: number
  perfumer?: string
  longevityId: number
  sillageId: number
  seasonIds: number[]
  occasionIds: number[]
  rating: number
  stock: number
  imageUrl?: string
  description?: string
}

export type UpdateProductInput = Partial<CreateProductInput>

// Cart types
export interface CartItem {
  productId: number
  slug: string
  quantity: number
  name: string
  brand: string
  priceRON: string
  imageUrl: string | null
  volumeMl: number
  stock: number
}

// Promotion types
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

// Audit log types
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'BULK_DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'

export type AuditEntityType = 'PRODUCT' | 'PROMOTION' | 'USER' | 'SETTINGS' | 'FILE' | 'NEWSLETTER_SUBSCRIBER'

export type AuditResult = 'SUCCESS' | 'FAILURE' | 'PARTIAL'

export interface AuditLog {
  id: number
  userId: number | null
  user: {
    id: number
    email: string
    name: string
  } | null
  action: AuditAction
  entityType: AuditEntityType
  entityId: number | null
  oldValue: Record<string, unknown> | null
  newValue: Record<string, unknown> | null
  result: AuditResult | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface AuditLogsResponse {
  logs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Newsletter types
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
