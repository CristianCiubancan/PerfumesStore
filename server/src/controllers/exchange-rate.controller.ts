import { Request, Response } from 'express'
import * as exchangeRateService from '../services/exchange-rate.service'
import { createAuditLog } from '../lib/auditLogger'
import { AppError } from '../middleware/errorHandler'
import { CACHE } from '../config/constants'

export async function getExchangeRates(_req: Request, res: Response): Promise<void> {
  const rates = await exchangeRateService.getExchangeRatesWithMeta()

  if (!rates) {
    throw new AppError(
      'Exchange rates not available. Please try again later.',
      503,
      'RATES_UNAVAILABLE'
    )
  }

  // Cache exchange rates for 1 hour - BNR updates daily
  res.set('Cache-Control', `public, max-age=${CACHE.EXCHANGE_RATE_REVALIDATE_SECONDS}`)
  res.json({ data: rates })
}

export async function getSettings(_req: Request, res: Response): Promise<void> {
  const settings = await exchangeRateService.getExchangeRateSettings()
  // Cache settings for 5 minutes - rarely change
  res.set('Cache-Control', 'public, max-age=300')
  res.json({ data: { feePercent: settings.feePercent.toNumber() } })
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  const { feePercent } = req.body

  // Service returns both old and new values (single fetch, no N+1)
  const { oldValue, newValue } = await exchangeRateService.updateExchangeRateSettings(feePercent)

  // Audit log for settings update
  createAuditLog(req, {
    action: 'UPDATE',
    entityType: 'SETTINGS',
    oldValue: { feePercent: oldValue.feePercent.toNumber() },
    newValue: { feePercent: newValue.feePercent.toNumber() },
  })

  res.json({ data: { feePercent: newValue.feePercent.toNumber() } })
}
