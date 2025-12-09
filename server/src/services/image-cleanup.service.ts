import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/prisma'
import { uploadConfig } from '../config/upload'
import { logger } from '../lib/logger'

/**
 * Clean up orphaned images that are not tied to any product.
 * Should be called periodically to prevent disk space growth.
 */
export async function cleanupOrphanedImages(): Promise<number> {
  // Get all files in the products upload directory
  let files: string[]
  try {
    files = await fs.promises.readdir(uploadConfig.PRODUCTS_DIR)
  } catch (err: unknown) {
    const nodeError = err as NodeJS.ErrnoException
    if (nodeError.code === 'ENOENT') {
      // Directory doesn't exist, nothing to clean
      return 0
    }
    throw err
  }

  // Filter out non-image files (like .gitkeep)
  const imageFiles = files.filter(f =>
    f.endsWith('.webp') || f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.gif')
  )

  if (imageFiles.length === 0) {
    return 0
  }

  // Get all product imageUrls from the database
  const products = await prisma.product.findMany({
    where: { imageUrl: { not: null } },
    select: { imageUrl: true },
  })

  // Extract filenames from imageUrls (format: http://host/uploads/products/filename.webp)
  const referencedFilenames = new Set(
    products
      .map(p => p.imageUrl)
      .filter((url): url is string => url !== null)
      .map(url => path.basename(url))
  )

  // Safety check: if we have images on disk but no products reference any images,
  // something might be wrong (empty DB, startup race condition, etc.)
  // Don't delete in this case to prevent catastrophic data loss
  if (referencedFilenames.size === 0) {
    logger.warn(
      `Found ${imageFiles.length} images on disk but no products reference any images. ` +
      `Skipping cleanup to prevent accidental data loss.`,
      'ImageCleanup'
    )
    return 0
  }

  // Find orphaned files (exist on disk but not referenced by any product)
  const orphanedFiles = imageFiles.filter(f => !referencedFilenames.has(f))

  if (orphanedFiles.length === 0) {
    return 0
  }

  // Delete orphaned files
  let deletedCount = 0
  for (const filename of orphanedFiles) {
    const filePath = path.join(uploadConfig.PRODUCTS_DIR, filename)
    try {
      await fs.promises.unlink(filePath)
      deletedCount++
      logger.debug(`Deleted orphaned image: ${filename}`, 'ImageCleanup')
    } catch (err: unknown) {
      const nodeError = err as NodeJS.ErrnoException
      if (nodeError.code !== 'ENOENT') {
        logger.error(`Failed to delete orphaned image: ${filename}`, 'ImageCleanup', err)
      }
    }
  }

  if (deletedCount > 0) {
    logger.info(`Cleaned up ${deletedCount} orphaned images`, 'ImageCleanup')
  }

  return deletedCount
}
