import { Request, Response } from 'express'
import * as auditService from '../../services/audit.service'
import * as auditController from '../audit.controller'

// Mock audit service
jest.mock('../../services/audit.service', () => ({
  listAuditLogs: jest.fn(),
  AuditAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
  },
  AuditEntityType: {
    USER: 'USER',
    PRODUCT: 'PRODUCT',
    PROMOTION: 'PROMOTION',
  },
}))

describe('AuditController', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      query: {},
      user: { userId: 1, email: 'admin@example.com', role: 'ADMIN', tokenVersion: 0 },
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  describe('listAuditLogs', () => {
    it('should list audit logs with default parameters', async () => {
      const mockResult = {
        logs: [
          {
            id: 1,
            userId: 1,
            action: 'CREATE',
            entityType: 'PRODUCT',
            entityId: 1,
            createdAt: new Date(),
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }

      req.query = {}

      ;(auditService.listAuditLogs as jest.Mock).mockResolvedValue(mockResult)

      await auditController.listAuditLogs(req as Request, res as Response)

      expect(auditService.listAuditLogs).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        userId: undefined,
        action: undefined,
        entityType: undefined,
        entityId: undefined,
        startDate: undefined,
        endDate: undefined,
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockResult })
    })

    it('should parse pagination parameters', async () => {
      const mockResult = {
        logs: [],
        pagination: { page: 2, limit: 10, total: 15, totalPages: 2 },
      }

      req.query = { page: '2', limit: '10' }

      ;(auditService.listAuditLogs as jest.Mock).mockResolvedValue(mockResult)

      await auditController.listAuditLogs(req as Request, res as Response)

      expect(auditService.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
        })
      )
    })

    it('should filter by userId', async () => {
      const mockResult = {
        logs: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }

      req.query = { userId: '5' }

      ;(auditService.listAuditLogs as jest.Mock).mockResolvedValue(mockResult)

      await auditController.listAuditLogs(req as Request, res as Response)

      expect(auditService.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 5,
        })
      )
    })

    it('should filter by action', async () => {
      const mockResult = {
        logs: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }

      req.query = { action: 'CREATE' }

      ;(auditService.listAuditLogs as jest.Mock).mockResolvedValue(mockResult)

      await auditController.listAuditLogs(req as Request, res as Response)

      expect(auditService.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
        })
      )
    })

    it('should filter by entityType', async () => {
      const mockResult = {
        logs: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }

      req.query = { entityType: 'PRODUCT' }

      ;(auditService.listAuditLogs as jest.Mock).mockResolvedValue(mockResult)

      await auditController.listAuditLogs(req as Request, res as Response)

      expect(auditService.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'PRODUCT',
        })
      )
    })

    it('should filter by entityId', async () => {
      const mockResult = {
        logs: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }

      req.query = { entityId: '42' }

      ;(auditService.listAuditLogs as jest.Mock).mockResolvedValue(mockResult)

      await auditController.listAuditLogs(req as Request, res as Response)

      expect(auditService.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 42,
        })
      )
    })

    it('should filter by date range', async () => {
      const mockResult = {
        logs: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }

      req.query = {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.999Z',
      }

      ;(auditService.listAuditLogs as jest.Mock).mockResolvedValue(mockResult)

      await auditController.listAuditLogs(req as Request, res as Response)

      expect(auditService.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      )
    })

    it('should handle all query parameters together', async () => {
      const mockResult = {
        logs: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      }

      req.query = {
        page: '1',
        limit: '50',
        userId: '3',
        action: 'UPDATE',
        entityType: 'PROMOTION',
        entityId: '7',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-06-30T23:59:59.999Z',
      }

      ;(auditService.listAuditLogs as jest.Mock).mockResolvedValue(mockResult)

      await auditController.listAuditLogs(req as Request, res as Response)

      expect(auditService.listAuditLogs).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        userId: 3,
        action: 'UPDATE',
        entityType: 'PROMOTION',
        entityId: 7,
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      })
    })
  })
})
