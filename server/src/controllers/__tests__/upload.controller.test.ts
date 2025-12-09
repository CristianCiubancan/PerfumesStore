import { Request, Response } from 'express'
import * as uploadController from '../upload.controller'
import { AppError } from '../../middleware/errorHandler'

// Mock dependencies
jest.mock('sharp', () => {
  return jest.fn().mockReturnValue({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(undefined),
  })
})

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('abc123def456'),
  }),
}))

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    unlink: jest.fn(),
  },
}))

jest.mock('../../lib/auditLogger', () => ({
  createAuditLog: jest.fn(),
}))

jest.mock('../../config/upload', () => ({
  uploadSingle: jest.fn((req: Request, res: Response, cb: (err?: Error & { code?: string }) => void) => {
    // This will be overridden in individual tests
    cb()
  }),
  uploadConfig: {
    PRODUCTS_DIR: '/tmp/uploads/products',
    MAX_FILE_SIZE: 5 * 1024 * 1024,
  },
}))

jest.mock('../../config', () => ({
  config: {
    BACKEND_URL: 'http://localhost:4000',
  },
}))

describe('UploadController', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    jest.clearAllMocks()
    req = {
      file: undefined,
      params: {},
      user: { userId: 1, email: 'admin@example.com', role: 'ADMIN', tokenVersion: 0 },
      get: jest.fn().mockReturnValue('test-user-agent'),
      ip: '127.0.0.1',
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  describe('uploadImage', () => {
    it('should upload and process an image successfully', async () => {
      const { uploadSingle } = require('../../config/upload')
      uploadSingle.mockImplementation(
        (_req: Request, _res: Response, cb: (err?: Error) => void) => {
          cb()
        }
      )

      req.file = {
        buffer: Buffer.from('fake image data'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        fieldname: 'image',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      }

      await uploadController.uploadImage(req as Request, res as Response)

      expect(res.json).toHaveBeenCalledWith({
        data: {
          imageUrl: expect.stringContaining('http://localhost:4000/uploads/products/'),
          filename: expect.stringContaining('-optimized.webp'),
        },
      })
    })

    it('should throw error when no file is uploaded', async () => {
      const { uploadSingle } = require('../../config/upload')
      uploadSingle.mockImplementation(
        (_req: Request, _res: Response, cb: (err?: Error) => void) => {
          cb()
        }
      )

      req.file = undefined

      await expect(
        uploadController.uploadImage(req as Request, res as Response)
      ).rejects.toThrow(AppError)

      await expect(
        uploadController.uploadImage(req as Request, res as Response)
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'NO_FILE',
      })
    })

    it('should handle file size limit error', async () => {
      const { uploadSingle } = require('../../config/upload')
      const error = new Error('File too large') as Error & { code?: string }
      error.code = 'LIMIT_FILE_SIZE'

      uploadSingle.mockImplementation(
        (_req: Request, _res: Response, cb: (err?: Error & { code?: string }) => void) => {
          cb(error)
        }
      )

      await expect(
        uploadController.uploadImage(req as Request, res as Response)
      ).rejects.toThrow(AppError)

      await expect(
        uploadController.uploadImage(req as Request, res as Response)
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'FILE_TOO_LARGE',
      })
    })

    it('should handle other upload errors', async () => {
      const { uploadSingle } = require('../../config/upload')
      const error = new Error('Invalid file type')

      uploadSingle.mockImplementation(
        (_req: Request, _res: Response, cb: (err?: Error) => void) => {
          cb(error)
        }
      )

      await expect(
        uploadController.uploadImage(req as Request, res as Response)
      ).rejects.toThrow(AppError)

      await expect(
        uploadController.uploadImage(req as Request, res as Response)
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'UPLOAD_ERROR',
      })
    })
  })

  describe('deleteImage', () => {
    it('should delete an image successfully', async () => {
      const fs = require('fs')
      fs.promises.unlink.mockResolvedValue(undefined)

      req.params = { filename: 'test-image.webp' }

      await uploadController.deleteImage(req as Request, res as Response)

      expect(fs.promises.unlink).toHaveBeenCalledWith('/tmp/uploads/products/test-image.webp')
      expect(res.json).toHaveBeenCalledWith({
        data: { message: 'File deleted successfully' },
      })
    })

    it('should throw error when filename is missing', async () => {
      req.params = {}

      await expect(
        uploadController.deleteImage(req as Request, res as Response)
      ).rejects.toThrow(AppError)

      await expect(
        uploadController.deleteImage(req as Request, res as Response)
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'FILENAME_REQUIRED',
      })
    })

    it('should throw error when file is not found', async () => {
      const fs = require('fs')
      const error: NodeJS.ErrnoException = new Error('File not found')
      error.code = 'ENOENT'
      fs.promises.unlink.mockRejectedValue(error)

      req.params = { filename: 'nonexistent.webp' }

      await expect(
        uploadController.deleteImage(req as Request, res as Response)
      ).rejects.toThrow(AppError)

      await expect(
        uploadController.deleteImage(req as Request, res as Response)
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'FILE_NOT_FOUND',
      })
    })

    it('should rethrow other errors', async () => {
      const fs = require('fs')
      const error = new Error('Permission denied')
      fs.promises.unlink.mockRejectedValue(error)

      req.params = { filename: 'test.webp' }

      await expect(
        uploadController.deleteImage(req as Request, res as Response)
      ).rejects.toThrow('Permission denied')
    })

    it('should reject filename with path traversal characters', async () => {
      req.params = { filename: '../../../etc/passwd' }

      await expect(
        uploadController.deleteImage(req as Request, res as Response)
      ).rejects.toThrow('Invalid filename')
    })
  })
})
