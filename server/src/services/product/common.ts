import { prisma } from '../../lib/prisma'
import { AppError } from '../../middleware/errorHandler'

// Standard includes for product responses
export const productInclude = {
  fragranceFamily: true,
  longevity: true,
  sillage: true,
  seasons: true,
  occasions: true,
}

/**
 * Find a product by ID or throw a 404 error.
 * Includes all relations for a complete product response.
 * Only returns non-deleted products.
 */
export async function findProductOrThrow(id: number) {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: productInclude,
  })

  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND')
  }

  return product
}

/**
 * Find a product by ID including soft-deleted ones.
 * Used for audit log lookups where we need to display deleted product info.
 */
export async function findProductIncludingDeleted(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  })

  return product
}
