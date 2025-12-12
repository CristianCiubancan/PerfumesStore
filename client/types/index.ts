/**
 * Central type exports - re-exports from domain-specific type files
 *
 * Types are organized by domain:
 * - auth.types.ts: User, authentication
 * - product.types.ts: Products, filters, catalog
 * - cart.types.ts: Shopping cart
 * - promotion.types.ts: Promotions, discounts
 * - order.types.ts: Orders, checkout
 * - audit.types.ts: Audit logs
 * - newsletter.types.ts: Newsletter subscribers
 *
 * For new code, prefer importing directly from domain files:
 * import type { Product } from '@/types/product.types'
 *
 * This index file maintains backward compatibility with existing imports:
 * import type { Product } from '@/types'
 */

// Shared types and enums - synchronized with server
import {
  GENDER_VALUES,
  CONCENTRATION_VALUES,
  CONCENTRATION_LABELS,
  type Gender,
  type Concentration,
} from '../shared/shared-types'

// Re-export shared types for backward compatibility
export const genderValues = GENDER_VALUES
export const concentrationValues = CONCENTRATION_VALUES
export const concentrationLabels = CONCENTRATION_LABELS
export type { Gender, Concentration }

// Auth types
export type { User, AuthResponse, ApiError } from './auth.types'

// Product types
export type {
  FragranceFamily,
  Longevity,
  Sillage,
  Season,
  Occasion,
  FilterOptions,
  EnumFilterCount,
  IdFilterCount,
  FilterCounts,
  Product,
  ProductsResponse,
  CreateProductInput,
  UpdateProductInput,
} from './product.types'

// Cart types
export type { CartItem } from './cart.types'

// Promotion types
export type {
  Promotion,
  ActivePromotionResponse,
  CreatePromotionInput,
  UpdatePromotionInput,
} from './promotion.types'

// Audit types
export type {
  AuditAction,
  AuditEntityType,
  AuditResult,
  AuditLog,
  AuditLogsResponse,
} from './audit.types'

// Newsletter types
export type {
  NewsletterSubscriber,
  NewsletterSubscribersResponse,
} from './newsletter.types'

// Order types
export type {
  OrderStatus,
  OrderItem,
  Order,
  OrdersResponse,
  ShippingAddress,
  CheckoutSessionResponse,
} from './order.types'
