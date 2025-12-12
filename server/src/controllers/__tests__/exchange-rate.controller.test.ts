import { Request, Response } from 'express'
import * as exchangeRateService from '../../services/exchange-rate.service'
import * as exchangeRateController from '../exchange-rate.controller'
import { AppError } from '../../middleware/errorHandler'
import { Prisma } from '@prisma/client'

const Decimal = Prisma.Decimal

// Mock exchange rate service
jest.mock('../../services/exchange-rate.service', () => ({
  getExchangeRatesWithMeta: jest.fn(),
  getExchangeRateSettings: jest.fn(),
  updateExchangeRateSettings: jest.fn(),
}))

// Mock audit logger
jest.mock('../../lib/auditLogger', () => ({
  createAuditLog: jest.fn(),
}))

describe('ExchangeRateController', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      body: {},
      user: { userId: 1, email: 'admin@example.com', role: 'ADMIN', tokenVersion: 0 },
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    }
  })

  describe('getExchangeRates', () => {
    it('should return exchange rates', async () => {
      const mockRates = {
        rates: { EUR: 4.95, USD: 4.57 },
        lastUpdated: new Date().toISOString(),
        feePercent: 2.5,
      }

      ;(exchangeRateService.getExchangeRatesWithMeta as jest.Mock).mockResolvedValue(mockRates)

      await exchangeRateController.getExchangeRates(req as Request, res as Response)

      expect(res.json).toHaveBeenCalledWith({ data: mockRates })
    })

    it('should throw error when rates not available', async () => {
      ;(exchangeRateService.getExchangeRatesWithMeta as jest.Mock).mockResolvedValue(null)

      await expect(
        exchangeRateController.getExchangeRates(req as Request, res as Response)
      ).rejects.toThrow(AppError)

      await expect(
        exchangeRateController.getExchangeRates(req as Request, res as Response)
      ).rejects.toMatchObject({
        statusCode: 503,
        code: 'RATES_UNAVAILABLE',
      })
    })
  })

  describe('getSettings', () => {
    it('should return exchange rate settings', async () => {
      const mockSettings = {
        feePercent: new Decimal(2.5),
      }

      ;(exchangeRateService.getExchangeRateSettings as jest.Mock).mockResolvedValue(mockSettings)

      await exchangeRateController.getSettings(req as Request, res as Response)

      expect(res.json).toHaveBeenCalledWith({ data: { feePercent: 2.5 } })
    })
  })

  describe('updateSettings', () => {
    it('should update exchange rate settings', async () => {
      const oldSettings = { feePercent: new Decimal(2.0) }
      const newSettings = { feePercent: new Decimal(3.0) }

      req.body = { feePercent: 3.0 }

      ;(exchangeRateService.updateExchangeRateSettings as jest.Mock).mockResolvedValue({
        oldValue: oldSettings,
        newValue: newSettings,
      })

      await exchangeRateController.updateSettings(req as Request, res as Response)

      expect(exchangeRateService.updateExchangeRateSettings).toHaveBeenCalledWith(3.0)
      expect(res.json).toHaveBeenCalledWith({ data: { feePercent: 3.0 } })
    })
  })
})
