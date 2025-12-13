import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../middleware/errorHandler'
import { bnrCircuitBreaker } from '../../lib/circuit-breaker'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Import after mock setup
import * as exchangeRateService from '../exchange-rate.service'

describe('ExchangeRateService', () => {
  const mockExchangeRate = {
    id: 1,
    currency: 'EUR',
    rate: new Prisma.Decimal(4.95),
    fetchedAt: new Date(),
    updatedAt: new Date(),
  }

  const mockSettings = {
    id: 1,
    feePercent: new Prisma.Decimal(2),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset circuit breaker to closed state before each test
    bnrCircuitBreaker.forceReset()
  })

  describe('fetchRatesFromBNR', () => {
    it('should fetch and parse rates from BNR XML', async () => {
      const mockXML = `<?xml version="1.0" encoding="utf-8"?>
        <DataSet>
          <Body>
            <Cube>
              <Rate currency="EUR">4.9500</Rate>
              <Rate currency="GBP">5.8000</Rate>
              <Rate currency="USD">4.5000</Rate>
            </Cube>
          </Body>
        </DataSet>`

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockXML),
      })

      const result = await exchangeRateService.fetchRatesFromBNR()

      expect(result.EUR).toBe(4.95)
      expect(result.GBP).toBe(5.8)
    })

    it('should throw error when BNR fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      })

      await expect(exchangeRateService.fetchRatesFromBNR()).rejects.toThrow(
        AppError
      )
    })

    it('should throw error for invalid XML structure', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<InvalidXML/>'),
      })

      await expect(exchangeRateService.fetchRatesFromBNR()).rejects.toThrow(
        AppError
      )
    })

    it('should throw error when required currencies are missing', async () => {
      const mockXML = `<?xml version="1.0" encoding="utf-8"?>
        <DataSet>
          <Body>
            <Cube>
              <Rate currency="USD">4.5000</Rate>
            </Cube>
          </Body>
        </DataSet>`

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockXML),
      })

      await expect(exchangeRateService.fetchRatesFromBNR()).rejects.toThrow(
        AppError
      )
    })
  })

  describe('updateExchangeRates', () => {
    it('should update exchange rates in database', async () => {
      const mockXML = `<?xml version="1.0" encoding="utf-8"?>
        <DataSet>
          <Body>
            <Cube>
              <Rate currency="EUR">4.9500</Rate>
              <Rate currency="GBP">5.8000</Rate>
            </Cube>
          </Body>
        </DataSet>`

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockXML),
      })

      ;(prisma.$transaction as jest.Mock).mockResolvedValue([
        mockExchangeRate,
        { ...mockExchangeRate, currency: 'GBP' },
      ])

      await exchangeRateService.updateExchangeRates()

      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('getExchangeRates', () => {
    it('should return exchange rates', async () => {
      ;(prisma.exchangeRate.findMany as jest.Mock).mockResolvedValue([
        mockExchangeRate,
        { ...mockExchangeRate, currency: 'GBP', rate: new Prisma.Decimal(5.8) },
      ])

      const result = await exchangeRateService.getExchangeRates()

      expect(result).toEqual({
        EUR: 4.95,
        GBP: 5.8,
      })
    })

    it('should return null when not all currencies are available', async () => {
      ;(prisma.exchangeRate.findMany as jest.Mock).mockResolvedValue([
        mockExchangeRate,
      ])

      const result = await exchangeRateService.getExchangeRates()

      expect(result).toBeNull()
    })
  })

  describe('getExchangeRatesWithMeta', () => {
    it('should return rates with fee and timestamp', async () => {
      ;(prisma.exchangeRate.findMany as jest.Mock).mockResolvedValue([
        mockExchangeRate,
        { ...mockExchangeRate, currency: 'GBP', rate: new Prisma.Decimal(5.8) },
      ])
      ;(prisma.exchangeRateSettings.findUnique as jest.Mock).mockResolvedValue(
        mockSettings
      )

      const result = await exchangeRateService.getExchangeRatesWithMeta()

      expect(result).toEqual(
        expect.objectContaining({
          EUR: 4.95,
          GBP: 5.8,
          feePercent: 2,
          fetchedAt: expect.any(String),
        })
      )
    })

    it('should return null when no rates available', async () => {
      ;(prisma.exchangeRate.findMany as jest.Mock).mockResolvedValue([])

      const result = await exchangeRateService.getExchangeRatesWithMeta()

      expect(result).toBeNull()
    })
  })

  describe('getExchangeRateSettings', () => {
    it('should return existing settings', async () => {
      ;(prisma.exchangeRateSettings.findUnique as jest.Mock).mockResolvedValue(
        mockSettings
      )

      const result = await exchangeRateService.getExchangeRateSettings()

      expect(result.feePercent.toNumber()).toBe(2)
    })

    it('should create default settings if not exists', async () => {
      ;(prisma.exchangeRateSettings.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.exchangeRateSettings.create as jest.Mock).mockResolvedValue({
        ...mockSettings,
        feePercent: new Prisma.Decimal(0),
      })

      const result = await exchangeRateService.getExchangeRateSettings()

      expect(prisma.exchangeRateSettings.create).toHaveBeenCalled()
      expect(result.feePercent.toNumber()).toBe(0)
    })
  })

  describe('updateExchangeRateSettings', () => {
    it('should update fee percentage and return old/new values', async () => {
      ;(prisma.exchangeRateSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings)
      ;(prisma.exchangeRateSettings.upsert as jest.Mock).mockResolvedValue({
        ...mockSettings,
        feePercent: new Prisma.Decimal(3.5),
      })

      const result = await exchangeRateService.updateExchangeRateSettings(3.5)

      expect(prisma.exchangeRateSettings.upsert).toHaveBeenCalled()
      expect(result.oldValue.feePercent.toNumber()).toBe(2)
      expect(result.newValue.feePercent.toNumber()).toBe(3.5)
    })
  })
})
