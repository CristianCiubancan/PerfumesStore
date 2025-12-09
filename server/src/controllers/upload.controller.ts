import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import sharp from 'sharp'
import { uploadSingle, uploadConfig } from '../config/upload'
import { config } from '../config'
import { IMAGE } from '../config/constants'
import { AppError } from '../middleware/errorHandler'
import { createAuditLog } from '../lib/auditLogger'

// Promisify multer upload
function parseUpload(req: Request, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          reject(new AppError(
            `File too large. Maximum size is ${uploadConfig.MAX_FILE_SIZE / (1024 * 1024)}MB`,
            400,
            'FILE_TOO_LARGE'
          ))
        } else {
          reject(new AppError(err.message, 400, 'UPLOAD_ERROR'))
        }
      } else {
        resolve()
      }
    })
  })
}

export async function uploadImage(req: Request, res: Response): Promise<void> {
  await parseUpload(req, res)

  if (!req.file) {
    throw new AppError('No file uploaded', 400, 'NO_FILE')
  }

  const uniqueSuffix = crypto.randomBytes(16).toString('hex')
  const optimizedFilename = `${uniqueSuffix}-optimized.webp`
  const optimizedPath = path.join(uploadConfig.PRODUCTS_DIR, optimizedFilename)

  await sharp(req.file.buffer)
    .resize(IMAGE.MAX_DIMENSION, IMAGE.MAX_DIMENSION, {
      fit: IMAGE.RESIZE_FIT,
      withoutEnlargement: true
    })
    .webp({ quality: IMAGE.WEBP_QUALITY })
    .toFile(optimizedPath)

  const imageUrl = `${config.BACKEND_URL}/uploads/products/${optimizedFilename}`

  createAuditLog(req, {
    action: 'CREATE',
    entityType: 'FILE',
    newValue: {
      filename: optimizedFilename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  })

  res.json({
    data: {
      imageUrl,
      filename: optimizedFilename
    }
  })
}

export async function deleteImage(req: Request, res: Response): Promise<void> {
  const { filename } = req.params

  if (!filename) {
    throw new AppError('Filename is required', 400, 'FILENAME_REQUIRED')
  }

  // SECURITY: Validate filename to prevent path traversal attacks
  // Only allow alphanumeric characters, dots, underscores, and hyphens
  const SAFE_FILENAME_PATTERN = /^[a-zA-Z0-9._-]+$/
  if (!SAFE_FILENAME_PATTERN.test(filename)) {
    throw new AppError(
      'Invalid filename. Only alphanumeric characters, dots, underscores, and hyphens are allowed.',
      400,
      'INVALID_FILENAME'
    )
  }

  const sanitizedFilename = path.basename(filename)
  const filePath = path.join(uploadConfig.PRODUCTS_DIR, sanitizedFilename)

  // Use try/catch to handle race condition atomically
  // Avoids TOCTOU (time-of-check-time-of-use) vulnerability
  try {
    await fs.promises.unlink(filePath)
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    if (nodeError.code === 'ENOENT') {
      throw new AppError('File not found', 404, 'FILE_NOT_FOUND')
    }
    throw error
  }

  // Audit log for file deletion
  createAuditLog(req, {
    action: 'DELETE',
    entityType: 'FILE',
    oldValue: { filename: sanitizedFilename },
  })

  res.json({ data: { message: 'File deleted successfully' } })
}
