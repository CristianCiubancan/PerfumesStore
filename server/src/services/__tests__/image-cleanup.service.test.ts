import path from 'path'
import { uploadConfig } from '../../config/upload'

const mockReaddir = jest.fn()
const mockUnlink = jest.fn()

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    readdir: (...args: unknown[]) => mockReaddir(...args),
    unlink: (...args: unknown[]) => mockUnlink(...args),
  },
}))

const mockProductFindMany = jest.fn()

jest.mock('../../lib/prisma', () => ({
  prisma: {
    product: {
      findMany: (...args: unknown[]) => mockProductFindMany(...args),
    },
  },
}))

jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

// Must import after mocks are set up
import { cleanupOrphanedImages } from '../image-cleanup.service'

describe('cleanupOrphanedImages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 0 when directory does not exist', async () => {
    const error = new Error('ENOENT') as NodeJS.ErrnoException
    error.code = 'ENOENT'
    mockReaddir.mockRejectedValue(error)

    const result = await cleanupOrphanedImages()

    expect(result).toBe(0)
    expect(mockUnlink).not.toHaveBeenCalled()
  })

  it('should return 0 when no image files exist', async () => {
    mockReaddir.mockResolvedValue(['.gitkeep'])

    const result = await cleanupOrphanedImages()

    expect(result).toBe(0)
    expect(mockProductFindMany).not.toHaveBeenCalled()
  })

  it('should not delete images that are referenced by products', async () => {
    mockReaddir.mockResolvedValue(['image1.webp', 'image2.webp'])
    mockProductFindMany.mockResolvedValue([
      { imageUrl: 'http://localhost:5000/uploads/products/image1.webp' },
      { imageUrl: 'http://localhost:5000/uploads/products/image2.webp' },
    ])

    const result = await cleanupOrphanedImages()

    expect(result).toBe(0)
    expect(mockUnlink).not.toHaveBeenCalled()
  })

  it('should delete orphaned images not referenced by any product', async () => {
    mockReaddir.mockResolvedValue(['image1.webp', 'orphan.webp'])
    mockProductFindMany.mockResolvedValue([
      { imageUrl: 'http://localhost:5000/uploads/products/image1.webp' },
    ])
    mockUnlink.mockResolvedValue(undefined)

    const result = await cleanupOrphanedImages()

    expect(result).toBe(1)
    expect(mockUnlink).toHaveBeenCalledWith(
      path.join(uploadConfig.PRODUCTS_DIR, 'orphan.webp')
    )
  })

  it('should handle multiple orphaned images', async () => {
    mockReaddir.mockResolvedValue([
      'used.webp',
      'orphan1.webp',
      'orphan2.png',
      'orphan3.jpg',
    ])
    mockProductFindMany.mockResolvedValue([
      { imageUrl: 'http://localhost:5000/uploads/products/used.webp' },
    ])
    mockUnlink.mockResolvedValue(undefined)

    const result = await cleanupOrphanedImages()

    expect(result).toBe(3)
    expect(mockUnlink).toHaveBeenCalledTimes(3)
  })

  it('should continue cleanup if one file deletion fails', async () => {
    mockReaddir.mockResolvedValue(['used.webp', 'orphan1.webp', 'orphan2.webp'])
    mockProductFindMany.mockResolvedValue([
      { imageUrl: 'http://localhost:5000/uploads/products/used.webp' },
    ])
    mockUnlink
      .mockRejectedValueOnce(new Error('Permission denied'))
      .mockResolvedValueOnce(undefined)

    const result = await cleanupOrphanedImages()

    expect(result).toBe(1)
    expect(mockUnlink).toHaveBeenCalledTimes(2)
  })

  it('should ignore ENOENT errors during deletion (race condition)', async () => {
    const error = new Error('ENOENT') as NodeJS.ErrnoException
    error.code = 'ENOENT'

    mockReaddir.mockResolvedValue(['used.webp', 'orphan.webp'])
    mockProductFindMany.mockResolvedValue([
      { imageUrl: 'http://localhost:5000/uploads/products/used.webp' },
    ])
    mockUnlink.mockRejectedValue(error)

    const result = await cleanupOrphanedImages()

    expect(result).toBe(0)
  })

  it('should filter out non-image files when deleting orphans', async () => {
    // .gitkeep and readme.txt should NOT be deleted even though they're not referenced
    mockReaddir.mockResolvedValue(['.gitkeep', 'readme.txt', 'orphan.webp', 'used.webp'])
    mockProductFindMany.mockResolvedValue([
      { imageUrl: 'http://localhost:5000/uploads/products/used.webp' },
    ])
    mockUnlink.mockResolvedValue(undefined)

    const result = await cleanupOrphanedImages()

    // Only orphan.webp should be deleted (not .gitkeep or readme.txt)
    expect(result).toBe(1)
    expect(mockUnlink).toHaveBeenCalledTimes(1)
    expect(mockUnlink).toHaveBeenCalledWith(
      path.join(uploadConfig.PRODUCTS_DIR, 'orphan.webp')
    )
  })

  it('should NOT delete any images when no products reference images (safety check)', async () => {
    // This prevents catastrophic data loss when database is empty,
    // not seeded yet, or has connection issues
    mockReaddir.mockResolvedValue(['image1.webp', 'image2.webp', 'image3.png'])
    mockProductFindMany.mockResolvedValue([])

    const result = await cleanupOrphanedImages()

    expect(result).toBe(0)
    expect(mockUnlink).not.toHaveBeenCalled()
  })

  it('should NOT delete images when all products have null imageUrls (safety check)', async () => {
    mockReaddir.mockResolvedValue(['image1.webp', 'image2.webp'])
    mockProductFindMany.mockResolvedValue([
      { imageUrl: null },
      { imageUrl: null },
    ])

    const result = await cleanupOrphanedImages()

    expect(result).toBe(0)
    expect(mockUnlink).not.toHaveBeenCalled()
  })
})
