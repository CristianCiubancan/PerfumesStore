import { prisma } from '../../lib/prisma'
import * as auditService from '../audit.service'

describe('AuditService', () => {
  const mockAuditLog = {
    id: 1,
    userId: 1,
    action: 'CREATE',
    entityType: 'PRODUCT',
    entityId: 1,
    oldValue: null,
    newValue: { name: 'Test Product' },
    result: 'SUCCESS',
    ipAddress: '127.0.0.1',
    userAgent: 'Test Agent',
    createdAt: new Date(),
    user: {
      id: 1,
      email: 'admin@example.com',
      name: 'Admin',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('logAuditAction', () => {
    it('should create an audit log successfully', async () => {
      const input = {
        userId: 1,
        action: 'CREATE' as const,
        entityType: 'PRODUCT' as const,
        entityId: 1,
        newValue: { name: 'Test' },
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      }

      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog)

      await auditService.logAuditAction(input)

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          action: 'CREATE',
          entityType: 'PRODUCT',
          entityId: 1,
          result: 'SUCCESS',
        }),
      })
    })

    it('should not throw when database error occurs', async () => {
      const input = {
        userId: 1,
        action: 'CREATE' as const,
        entityType: 'PRODUCT' as const,
      }

      ;(prisma.auditLog.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      // Should not throw
      await expect(auditService.logAuditAction(input)).resolves.not.toThrow()
    })

    it('should handle optional fields', async () => {
      const input = {
        userId: 1,
        action: 'LOGIN' as const,
        entityType: 'USER' as const,
      }

      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog)

      await auditService.logAuditAction(input)

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityId: null,
          oldValue: expect.anything(),
          newValue: expect.anything(),
          ipAddress: null,
          userAgent: null,
        }),
      })
    })

    it('should include result when provided', async () => {
      const input = {
        userId: 1,
        action: 'DELETE' as const,
        entityType: 'PRODUCT' as const,
        result: 'FAILURE' as const,
      }

      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog)

      await auditService.logAuditAction(input)

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          result: 'FAILURE',
        }),
      })
    })
  })

  describe('listAuditLogs', () => {
    it('should list audit logs with default pagination', async () => {
      ;(prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog])
      ;(prisma.auditLog.count as jest.Mock).mockResolvedValue(1)

      const result = await auditService.listAuditLogs()

      expect(result.logs).toHaveLength(1)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(50)
      expect(result.pagination.total).toBe(1)
    })

    it('should filter by userId', async () => {
      ;(prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog])
      ;(prisma.auditLog.count as jest.Mock).mockResolvedValue(1)

      await auditService.listAuditLogs({ userId: 1 })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
          }),
        })
      )
    })

    it('should filter by action', async () => {
      ;(prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog])
      ;(prisma.auditLog.count as jest.Mock).mockResolvedValue(1)

      await auditService.listAuditLogs({ action: 'CREATE' })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'CREATE',
          }),
        })
      )
    })

    it('should filter by entityType', async () => {
      ;(prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog])
      ;(prisma.auditLog.count as jest.Mock).mockResolvedValue(1)

      await auditService.listAuditLogs({ entityType: 'PRODUCT' })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: 'PRODUCT',
          }),
        })
      )
    })

    it('should filter by entityId', async () => {
      ;(prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog])
      ;(prisma.auditLog.count as jest.Mock).mockResolvedValue(1)

      await auditService.listAuditLogs({ entityId: 123 })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityId: 123,
          }),
        })
      )
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')

      ;(prisma.auditLog.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.auditLog.count as jest.Mock).mockResolvedValue(0)

      await auditService.listAuditLogs({ startDate, endDate })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      )
    })

    it('should handle pagination', async () => {
      ;(prisma.auditLog.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.auditLog.count as jest.Mock).mockResolvedValue(100)

      const result = await auditService.listAuditLogs({ page: 3, limit: 25 })

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50,
          take: 25,
        })
      )
      expect(result.pagination.totalPages).toBe(4)
    })

    it('should include user information', async () => {
      ;(prisma.auditLog.findMany as jest.Mock).mockResolvedValue([mockAuditLog])
      ;(prisma.auditLog.count as jest.Mock).mockResolvedValue(1)

      await auditService.listAuditLogs()

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        })
      )
    })
  })
})
