import { prisma } from '../lib/prisma'
import { Prisma } from '@prisma/client'
import { XMLParser } from 'fast-xml-parser'
import { EXCHANGE_RATE } from '../config/constants'
import { logger } from '../lib/logger'
import { AppError } from '../middleware/errorHandler'

// Currencies we track
const TRACKED_CURRENCIES = ['EUR', 'GBP'] as const

interface ParsedRates {
  EUR: number
  GBP: number
}

interface BNRRate {
  '@_currency': string
  '#text': string
}

interface BNRXMLStructure {
  DataSet: {
    Body: {
      Cube: {
        Rate: BNRRate[]
      }
    }
  }
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  processEntities: false, // Prevents XXE attacks
})

export async function fetchRatesFromBNR(): Promise<ParsedRates> {
  const response = await fetch(EXCHANGE_RATE.BNR_XML_URL)

  if (!response.ok) {
    throw new AppError('Failed to fetch exchange rates from BNR', 503, 'BNR_FETCH_ERROR')
  }

  const xmlText = await response.text()
  const parsed = xmlParser.parse(xmlText) as BNRXMLStructure

  const rates = parsed.DataSet?.Body?.Cube?.Rate
  if (!rates || !Array.isArray(rates)) {
    throw new AppError('Invalid BNR XML structure', 503, 'BNR_PARSE_ERROR')
  }

  const rateMap = new Map<string, number>()
  for (const rate of rates) {
    const parsedRate = parseFloat(rate['#text'])
    // Validate rate is within reasonable bounds (0.01 to 100 RON per unit)
    if (isNaN(parsedRate) || parsedRate <= 0 || parsedRate > 100) {
      logger.warn(`Invalid exchange rate for ${rate['@_currency']}: ${rate['#text']}`)
      continue
    }
    rateMap.set(rate['@_currency'], parsedRate)
  }

  const eurRate = rateMap.get('EUR')
  const gbpRate = rateMap.get('GBP')

  if (eurRate === undefined || gbpRate === undefined) {
    throw new AppError('Failed to parse exchange rates from BNR XML', 503, 'BNR_PARSE_ERROR')
  }

  return {
    EUR: eurRate,
    GBP: gbpRate,
  }
}

export async function updateExchangeRates(): Promise<void> {
  const rates = await fetchRatesFromBNR()
  const now = new Date()

  // Upsert all currency rates in a single transaction for consistency
  await prisma.$transaction(
    TRACKED_CURRENCIES.map((currency) =>
      prisma.exchangeRate.upsert({
        where: { currency },
        update: {
          rate: new Prisma.Decimal(rates[currency]),
          fetchedAt: now,
        },
        create: {
          currency,
          rate: new Prisma.Decimal(rates[currency]),
          fetchedAt: now,
        },
      })
    )
  )

  logger.info(`Updated rates: EUR=${rates.EUR}, GBP=${rates.GBP}`, 'ExchangeRate')
}

export async function getExchangeRates(): Promise<{ EUR: number; GBP: number } | null> {
  const rates = await prisma.exchangeRate.findMany({
    where: { currency: { in: [...TRACKED_CURRENCIES] } },
  })

  if (rates.length !== TRACKED_CURRENCIES.length) {
    return null
  }

  const rateMap: Record<string, number> = {}
  for (const rate of rates) {
    rateMap[rate.currency] = rate.rate.toNumber()
  }

  return {
    EUR: rateMap.EUR,
    GBP: rateMap.GBP,
  }
}

export async function getExchangeRatesWithMeta() {
  const [rates, settings] = await Promise.all([
    prisma.exchangeRate.findMany({
      where: { currency: { in: [...TRACKED_CURRENCIES] } },
    }),
    getExchangeRateSettings(),
  ])

  if (rates.length === 0) {
    return null
  }

  const rateMap: Record<string, number> = {}
  let lastFetched: Date | null = null

  for (const rate of rates) {
    rateMap[rate.currency] = rate.rate.toNumber()
    if (!lastFetched || rate.fetchedAt > lastFetched) {
      lastFetched = rate.fetchedAt
    }
  }

  return {
    EUR: rateMap.EUR,
    GBP: rateMap.GBP,
    feePercent: settings.feePercent.toNumber(),
    // Ensure fetchedAt is always a string (fallback to current time if somehow null)
    fetchedAt: lastFetched?.toISOString() ?? new Date().toISOString(),
  }
}

// Exchange rate settings (singleton)
export async function getExchangeRateSettings() {
  let settings = await prisma.exchangeRateSettings.findUnique({
    where: { id: EXCHANGE_RATE.SETTINGS_SINGLETON_ID },
  })

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.exchangeRateSettings.create({
      data: { id: EXCHANGE_RATE.SETTINGS_SINGLETON_ID, feePercent: 0 },
    })
  }

  return settings
}

export async function updateExchangeRateSettings(feePercent: number) {
  // Fetch old settings for audit before updating
  const oldSettings = await getExchangeRateSettings()

  const newSettings = await prisma.exchangeRateSettings.upsert({
    where: { id: EXCHANGE_RATE.SETTINGS_SINGLETON_ID },
    update: { feePercent: new Prisma.Decimal(feePercent) },
    create: { id: EXCHANGE_RATE.SETTINGS_SINGLETON_ID, feePercent: new Prisma.Decimal(feePercent) },
  })

  return { oldValue: oldSettings, newValue: newSettings }
}
