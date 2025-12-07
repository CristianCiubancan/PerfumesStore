import { Request, Response } from 'express'
import * as productService from '../services/product.service'
import { createAuditLog } from '../lib/auditLogger'
import { parseIdParam, parseIntParam, parseFloatParam, parseIdArrayParam, parseBooleanParam } from '../lib/parseParams'

export async function createProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.createProduct(req.body)

  // Audit log
  createAuditLog(req, {
    action: 'CREATE',
    entityType: 'PRODUCT',
    entityId: product.id,
    newValue: product,
  })

  res.status(201).json({ data: product })
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)

  // Service returns both old and new values (single fetch, no N+1)
  const { oldValue, newValue } = await productService.updateProduct(id, req.body)

  // Audit log
  createAuditLog(req, {
    action: 'UPDATE',
    entityType: 'PRODUCT',
    entityId: id,
    oldValue,
    newValue,
  })

  res.json({ data: newValue })
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)

  // Service returns deleted product for audit (single fetch, no N+1)
  const result = await productService.deleteProduct(id)

  // Audit log
  createAuditLog(req, {
    action: 'DELETE',
    entityType: 'PRODUCT',
    entityId: id,
    oldValue: result.deletedProduct,
  })

  res.json({ data: { message: result.message } })
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)
  const product = await productService.getProduct(id)
  res.json({ data: product })
}

/**
 * Get a product by its SEO-friendly slug
 * This is the primary endpoint for public product pages
 */
export async function getProductBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = req.params
  const product = await productService.getProductBySlug(slug)
  // Cache product pages for 1 hour - good for SEO
  res.set('Cache-Control', 'public, max-age=3600')
  res.json({ data: product })
}

export async function listProducts(req: Request, res: Response): Promise<void> {
  const {
    page,
    limit,
    brand,
    gender,
    concentration,
    minPrice,
    maxPrice,
    search,
    sortBy,
    sortOrder,
    // Filter by lookup table IDs
    fragranceFamilyId,
    longevityId,
    sillageId,
    seasonIds,
    seasonMatchMode,
    occasionIds,
    occasionMatchMode,
    minRating,
    maxRating,
    stockStatus,
  } = req.query

  const result = await productService.listProducts({
    page: parseIntParam(page),
    limit: parseIntParam(limit),
    brand: brand as string,
    gender: gender as string,
    concentration: concentration as string,
    minPrice: parseFloatParam(minPrice),
    maxPrice: parseFloatParam(maxPrice),
    search: search as string,
    sortBy: sortBy as 'name' | 'price' | 'rating' | 'newest' | 'stock',
    sortOrder: sortOrder as 'asc' | 'desc',
    // Filter by lookup table IDs
    fragranceFamilyId: parseIntParam(fragranceFamilyId),
    longevityId: parseIntParam(longevityId),
    sillageId: parseIntParam(sillageId),
    seasonIds: parseIdArrayParam(seasonIds),
    seasonMatchMode: (seasonMatchMode as 'any' | 'all') || 'any',
    occasionIds: parseIdArrayParam(occasionIds),
    occasionMatchMode: (occasionMatchMode as 'any' | 'all') || 'any',
    minRating: parseFloatParam(minRating),
    maxRating: parseFloatParam(maxRating),
    stockStatus: stockStatus as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock',
  })

  res.json({ data: result })
}

export async function bulkDeleteProducts(req: Request, res: Response): Promise<void> {
  const { ids } = req.body
  const result = await productService.bulkDeleteProducts(ids)

  // Audit log for bulk delete
  createAuditLog(req, {
    action: 'BULK_DELETE',
    entityType: 'PRODUCT',
    oldValue: { deletedIds: ids, deletedCount: result.deletedCount },
  })

  res.json({ data: result })
}

export async function getFilterOptions(_req: Request, res: Response): Promise<void> {
  const options = await productService.getFilterOptions()
  // Cache filter options for 5 minutes - they rarely change
  res.set('Cache-Control', 'public, max-age=300')
  res.json({ data: options })
}

export async function getBrands(req: Request, res: Response): Promise<void> {
  const { page, limit, inStockOnly } = req.query

  const result = await productService.getBrands({
    page: parseIntParam(page),
    limit: parseIntParam(limit),
    inStockOnly: parseBooleanParam(inStockOnly),
  })

  // Cache brands list for 5 minutes
  res.set('Cache-Control', 'public, max-age=300')
  res.json({ data: result })
}

export async function getStats(_req: Request, res: Response): Promise<void> {
  const stats = await productService.getStats()
  // Cache stats for 1 minute - they change more frequently
  res.set('Cache-Control', 'public, max-age=60')
  res.json({ data: stats })
}
