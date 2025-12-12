/**
 * Product and catalog-related types
 */
import type { Gender, Concentration } from '../shared/shared-types'

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

// Filter counts for dynamic filtering
export interface EnumFilterCount {
  value: string
  count: number
}

export interface IdFilterCount {
  id: number
  count: number
}

export interface FilterCounts {
  genders: EnumFilterCount[]
  concentrations: EnumFilterCount[]
  fragranceFamilies: IdFilterCount[]
  longevities: IdFilterCount[]
  sillages: IdFilterCount[]
  seasons: IdFilterCount[]
  occasions: IdFilterCount[]
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
