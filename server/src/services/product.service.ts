import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import { CreateProductInput, UpdateProductInput } from '../schemas/product'
import { PAGINATION } from '../config/constants'
import { cache, CACHE_TTL, CACHE_KEYS } from '../lib/cache'
import { sanitizeProductFields, sanitizeProducts } from '../lib/sanitize'
import { generateUniqueSlug } from '../lib/slug'
import {
  buildWhereClause,
  buildSortOrder,
  ProductFilterParams,
} from './product/filter-builder'
import {
  getFilterCounts,
  FilterCounts,
  EnumFilterCount,
  IdFilterCount,
  FILTER_COUNTS_CACHE_SECONDS,
} from './product/filter-count-builder'

// Re-export filter counts types, function, and cache constant
export { getFilterCounts, FILTER_COUNTS_CACHE_SECONDS }
export type { FilterCounts, EnumFilterCount, IdFilterCount }
import { invalidateProductCaches } from './product/cache-helper'
import { productInclude, findProductOrThrow } from './product/common'

// ============================================================================
// CRUD Operations
// ============================================================================

export async function createProduct(input: CreateProductInput) {
  const { seasonIds, occasionIds, ...rest } = input

  const slug = await generateUniqueSlug(
    input.brand,
    input.name,
    input.concentration,
    async (s) => {
      // Only check against active (non-deleted) products
      const existing = await prisma.product.findFirst({
        where: { slug: s, deletedAt: null },
      })
      return existing !== null
    }
  )

  const product = await prisma.$transaction(async (tx) => {
    return tx.product.create({
      data: {
        ...rest,
        slug,
        priceRON: new Prisma.Decimal(input.priceRON),
        rating: new Prisma.Decimal(input.rating),
        imageUrl: input.imageUrl || null,
        seasons: { connect: seasonIds.map((id) => ({ id })) },
        occasions: { connect: occasionIds.map((id) => ({ id })) },
      },
      include: productInclude,
    })
  })

  invalidateProductCaches()
  return sanitizeProductFields(product)
}

export async function updateProduct(id: number, input: UpdateProductInput) {
  // Fetch existing product with relations - used for both validation and audit
  const existing = await findProductOrThrow(id)
  const oldProduct = sanitizeProductFields(existing)
  const { seasonIds, occasionIds, ...rest } = input

  const updateData: Prisma.ProductUpdateInput = { ...rest }

  if (input.priceRON !== undefined) {
    updateData.priceRON = new Prisma.Decimal(input.priceRON)
  }
  if (input.rating !== undefined) {
    updateData.rating = new Prisma.Decimal(input.rating)
  }

  // Regenerate slug if brand, name, or concentration changed
  const slugNeedsUpdate =
    input.brand !== undefined ||
    input.name !== undefined ||
    input.concentration !== undefined

  if (slugNeedsUpdate) {
    updateData.slug = await generateUniqueSlug(
      input.brand ?? existing.brand,
      input.name ?? existing.name,
      input.concentration ?? existing.concentration,
      async (s) => {
        // Only check against active (non-deleted) products, excluding current product
        const existingProduct = await prisma.product.findFirst({
          where: { slug: s, deletedAt: null },
        })
        return existingProduct !== null && existingProduct.id !== id
      }
    )
  }

  if (seasonIds !== undefined) {
    updateData.seasons = { set: seasonIds.map((id) => ({ id })) }
  }
  if (occasionIds !== undefined) {
    updateData.occasions = { set: occasionIds.map((id) => ({ id })) }
  }

  const product = await prisma.$transaction(async (tx) => {
    return tx.product.update({
      where: { id },
      data: updateData,
      include: productInclude,
    })
  })

  invalidateProductCaches()
  const newProduct = sanitizeProductFields(product)
  return { oldValue: oldProduct, newValue: newProduct }
}

export async function deleteProduct(id: number) {
  // Fetch the product with relations before deletion for audit purposes
  const existing = await findProductOrThrow(id)
  const deletedProduct = sanitizeProductFields(existing)

  // Soft delete - set deletedAt instead of removing the record
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  invalidateProductCaches()
  return { message: 'Product deleted successfully', deletedProduct }
}

export async function bulkDeleteProducts(ids: number[]) {
  if (!ids || ids.length === 0) {
    throw new AppError('No product IDs provided', 400, 'INVALID_INPUT')
  }

  // Soft delete - set deletedAt instead of removing records
  const result = await prisma.product.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date() },
  })

  invalidateProductCaches()
  return {
    message: `Successfully deleted ${result.count} products`,
    deletedCount: result.count,
  }
}

// ============================================================================
// Stock Management
// ============================================================================

export async function decrementStock(id: number, quantity: number) {
  if (quantity <= 0) {
    throw new AppError('Quantity must be positive', 400, 'INVALID_QUANTITY')
  }

  const product = await prisma.$transaction(async (tx) => {
    const current = await tx.product.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, stock: true, name: true },
    })

    if (!current) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND')
    }

    if (current.stock < quantity) {
      throw new AppError(
        `Insufficient stock for "${current.name}". Available: ${current.stock}, Requested: ${quantity}`,
        400,
        'INSUFFICIENT_STOCK'
      )
    }

    return tx.product.update({
      where: { id },
      data: { stock: { decrement: quantity } },
      include: productInclude,
    })
  })

  invalidateProductCaches()
  return sanitizeProductFields(product)
}

export async function decrementStockBatch(
  items: Array<{ productId: number; quantity: number }>
) {
  if (items.length === 0) {
    throw new AppError('No items provided', 400, 'INVALID_INPUT')
  }

  // Validate quantities upfront (no DB query needed)
  for (const { productId, quantity } of items) {
    if (quantity <= 0) {
      throw new AppError(
        `Invalid quantity for product ${productId}`,
        400,
        'INVALID_QUANTITY'
      )
    }
  }

  // Extract all product IDs
  const productIds = items.map((item) => item.productId)

  const products = await prisma.$transaction(async (tx) => {
    // Single query to fetch all products at once (eliminates N+1)
    const allProducts = await tx.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true, stock: true, name: true },
    })

    // Build a map for O(1) lookups
    const productMap = new Map(allProducts.map((p) => [p.id, p]))

    // Validate all products exist and have sufficient stock
    for (const { productId, quantity } of items) {
      const current = productMap.get(productId)

      if (!current) {
        throw new AppError(`Product ${productId} not found`, 404, 'PRODUCT_NOT_FOUND')
      }

      if (current.stock < quantity) {
        throw new AppError(
          `Insufficient stock for "${current.name}". Available: ${current.stock}, Requested: ${quantity}`,
          400,
          'INSUFFICIENT_STOCK'
        )
      }
    }

    // All validations passed - perform updates
    // Note: Updates still need to be individual due to different quantities,
    // but we eliminated the N findUnique queries
    const results = await Promise.all(
      items.map(({ productId, quantity }) =>
        tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantity } },
          include: productInclude,
        })
      )
    )

    return results
  })

  invalidateProductCaches()
  return sanitizeProducts(products)
}

// ============================================================================
// Query Operations
// ============================================================================

export async function getProduct(id: number) {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: productInclude,
  })

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND')
  }

  return sanitizeProductFields(product)
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
    include: productInclude,
  })

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND')
  }

  return sanitizeProductFields(product)
}

interface ListProductsParams extends ProductFilterParams {
  page?: number
  limit?: number
  sortBy?: 'name' | 'price' | 'rating' | 'newest' | 'stock'
  sortOrder?: 'asc' | 'desc'
}

export async function listProducts(params: ListProductsParams = {}) {
  const {
    page = 1,
    limit = PAGINATION.DEFAULT_LIMIT,
    sortBy = 'newest',
    sortOrder = 'desc',
    ...filterParams
  } = params

  const where = buildWhereClause(filterParams)
  const orderBy = buildSortOrder(sortBy, sortOrder)

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: productInclude,
    }),
    prisma.product.count({ where }),
  ])

  return {
    products: sanitizeProducts(products),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ============================================================================
// Cached Queries
// ============================================================================

export async function getFilterOptions() {
  return cache.getOrSet(
    CACHE_KEYS.FILTER_OPTIONS,
    async () => {
      const [fragranceFamilies, longevities, sillages, seasons, occasions] =
        await Promise.all([
          prisma.fragranceFamily.findMany({ orderBy: { name: 'asc' } }),
          prisma.longevity.findMany({ orderBy: { sortOrder: 'asc' } }),
          prisma.sillage.findMany({ orderBy: { sortOrder: 'asc' } }),
          prisma.season.findMany({ orderBy: { name: 'asc' } }),
          prisma.occasion.findMany({ orderBy: { name: 'asc' } }),
        ])

      return { fragranceFamilies, longevities, sillages, seasons, occasions }
    },
    CACHE_TTL.FILTER_OPTIONS
  )
}

export interface ListBrandsParams {
  page?: number
  limit?: number
  inStockOnly?: boolean
}

export interface ListBrandsResult {
  brands: string[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function getBrands(params: ListBrandsParams = {}): Promise<ListBrandsResult> {
  const { page = 1, limit = PAGINATION.DEFAULT_LIMIT, inStockOnly = true } = params

  const where = {
    deletedAt: null,
    ...(inStockOnly ? { stock: { gt: 0 } } : {}),
  }
  const skip = (page - 1) * limit

  // Use groupBy for database-level pagination (avoids fetching all brands into memory)
  const [brandsResult, totalResult] = await Promise.all([
    prisma.product.groupBy({
      by: ['brand'],
      where,
      orderBy: { brand: 'asc' },
      skip,
      take: limit,
    }),
    prisma.product.groupBy({
      by: ['brand'],
      where,
    }),
  ])

  const brands = brandsResult.map((b) => b.brand)
  const total = totalResult.length

  return {
    brands,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getStats() {
  return cache.getOrSet(
    CACHE_KEYS.STATS,
    async () => {
      const [productCount, brandsResult] = await Promise.all([
        prisma.product.count({ where: { deletedAt: null } }),
        prisma.product.findMany({
          where: { deletedAt: null },
          select: { brand: true },
          distinct: ['brand'],
        }),
      ])

      return {
        productCount,
        brandCount: brandsResult.length,
      }
    },
    CACHE_TTL.STATS
  )
}
