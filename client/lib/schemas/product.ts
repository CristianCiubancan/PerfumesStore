import { z } from 'zod'
import { env } from '@/lib/env'
import {
  genderValues,
  concentrationValues,
  concentrationLabels,
} from '@/types'

// Re-export for backwards compatibility
export { concentrationLabels }
export const genderOptions = genderValues
export const concentrationOptions = concentrationValues

/**
 * Validates that an image URL is either:
 * - A local path (starts with /uploads/)
 * - A URL from the API server
 * - A URL from an allowed external host (e.g., Cloudflare R2)
 */
export function isAllowedImageUrl(url: string): boolean {
  if (!url) return true

  // Allow local upload paths
  if (url.startsWith('/uploads/')) return true

  // Validate external URLs against whitelist
  try {
    const parsedUrl = new URL(url)
    const host = parsedUrl.host.toLowerCase()

    // Allow API URL
    const apiHost = new URL(env.apiUrl).host.toLowerCase()
    if (host === apiHost) return true

    // Check against allowed hosts
    return env.allowedImageHosts.includes(host)
  } catch {
    return false
  }
}

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brand: z.string().min(1, 'Brand is required'),
  concentration: z.enum(concentrationOptions),
  gender: z.enum(genderOptions),
  fragranceFamilyId: z.coerce.number().int().positive('Fragrance family is required'),
  topNotes: z.string().min(1, 'Top notes are required'),
  heartNotes: z.string().min(1, 'Heart notes are required'),
  baseNotes: z.string().min(1, 'Base notes are required'),
  volumeMl: z.coerce.number().int().positive('Volume must be positive'),
  priceRON: z.coerce.number().positive('Price must be positive'),
  launchYear: z.coerce
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 1),
  perfumer: z.string().optional(),
  longevityId: z.coerce.number().int().positive('Longevity is required'),
  sillageId: z.coerce.number().int().positive('Sillage is required'),
  seasonIds: z.array(z.number().int().positive()).min(1, 'At least one season is required'),
  occasionIds: z.array(z.number().int().positive()).min(1, 'At least one occasion is required'),
  rating: z.coerce.number().min(0).max(5),
  stock: z.coerce.number().int().min(0).default(0),
  imageUrl: z
    .string()
    .refine(
      isAllowedImageUrl,
      'Image URL must be a local upload path or from an allowed host'
    )
    .optional(),
  description: z.string().optional(),
})

export type ProductFormData = z.infer<typeof productSchema>
