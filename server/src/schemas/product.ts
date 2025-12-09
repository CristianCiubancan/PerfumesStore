import { z } from 'zod'
import { Gender, Concentration } from '@prisma/client'
import { PAGINATION, VALIDATION } from '../config/constants'
import { config } from '../config'

/**
 * Validates that an image URL is either:
 * - A local path (starts with /uploads/)
 * - A URL from the backend server
 * - A URL from an allowed external host (e.g., Cloudflare R2)
 */
function isAllowedImageUrl(url: string): boolean {
  if (!url) return true

  // Allow local upload paths
  if (url.startsWith('/uploads/')) return true

  // Validate external URLs against whitelist
  try {
    const parsedUrl = new URL(url)
    const host = parsedUrl.host.toLowerCase()

    // Allow backend URL
    const backendHost = new URL(config.BACKEND_URL).host.toLowerCase()
    if (host === backendHost) return true

    // Check against allowed hosts
    return config.allowedImageHosts.includes(host)
  } catch {
    return false
  }
}

// Derive Zod enums from Prisma-generated enum objects (single source of truth)
const genderValues = Object.values(Gender) as [Gender, ...Gender[]]
const concentrationValues = Object.values(Concentration) as [Concentration, ...Concentration[]]

const GenderEnum = z.enum(genderValues)
const ConcentrationEnum = z.enum(concentrationValues)

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    brand: z.string().min(1, 'Brand is required'),
    concentration: ConcentrationEnum,
    gender: GenderEnum,
    fragranceFamilyId: z.number().int().positive('Fragrance family is required'),
    topNotes: z.array(z.string()).min(1, 'At least one top note is required'),
    heartNotes: z.array(z.string()).min(1, 'At least one heart note is required'),
    baseNotes: z.array(z.string()).min(1, 'At least one base note is required'),
    volumeMl: z.number().int().positive('Volume must be positive'),
    priceRON: z.number().positive('Price must be positive'),
    launchYear: z.number().int().min(VALIDATION.PRODUCT_MIN_LAUNCH_YEAR).max(new Date().getFullYear() + 1),
    perfumer: z.string().optional(),
    longevityId: z.number().int().positive('Longevity is required'),
    sillageId: z.number().int().positive('Sillage is required'),
    seasonIds: z.array(z.number().int().positive()).min(1, 'At least one season is required'),
    occasionIds: z.array(z.number().int().positive()).min(1, 'At least one occasion is required'),
    rating: z.number().min(VALIDATION.RATING_MIN).max(VALIDATION.RATING_MAX),
    stock: z.number().int().min(0).default(0),
    imageUrl: z
      .string()
      .refine(
        isAllowedImageUrl,
        'Image URL must be a local upload path or from an allowed host'
      )
      .optional(),
    description: z.string().optional(),
  }),
})

export const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial(),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid product ID'),
  }),
})

export const getProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid product ID'),
  }),
})

export const getProductBySlugSchema = z.object({
  params: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').max(200),
  }),
})

const MatchModeEnum = z.enum(['any', 'all'])

export const listProductsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a positive integer')
      .refine((val) => !val || parseInt(val, 10) >= 1, 'Page must be at least 1')
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive integer')
      .refine(
        (val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= PAGINATION.MAX_LIMIT),
        `Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`
      )
      .optional(),
    brand: z.string().optional(),
    gender: GenderEnum.optional(),
    concentration: ConcentrationEnum.optional(),
    minPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    maxPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'price', 'rating', 'newest', 'stock']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    // Filter by lookup table IDs
    fragranceFamilyId: z.string().regex(/^\d+$/).optional(),
    longevityId: z.string().regex(/^\d+$/).optional(),
    sillageId: z.string().regex(/^\d+$/).optional(),
    seasonIds: z.string().optional(), // comma-separated: "1,2,3"
    seasonMatchMode: MatchModeEnum.optional(),
    occasionIds: z.string().optional(), // comma-separated: "1,2"
    occasionMatchMode: MatchModeEnum.optional(),
    minRating: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    maxRating: z.string().regex(/^\d+(\.\d+)?$/).optional(),
    stockStatus: z.enum(['all', 'in_stock', 'low_stock', 'out_of_stock']).optional(),
  }).optional(),
})

export const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z.array(z.number().int().positive('Product ID must be a positive integer'))
      .min(1, 'At least one product ID is required')
      .max(100, 'Cannot delete more than 100 products at once'),
  }),
})

export const listBrandsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a positive integer')
      .refine((val) => !val || parseInt(val, 10) >= 1, 'Page must be at least 1')
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive integer')
      .refine(
        (val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= PAGINATION.MAX_LIMIT),
        `Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`
      )
      .optional(),
    inStockOnly: z.enum(['true', 'false', '1', '0']).optional(),
  }).optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>['body']
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body']
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>['body']
