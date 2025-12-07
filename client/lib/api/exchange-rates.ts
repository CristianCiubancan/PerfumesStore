import { api } from './client'

export interface ExchangeRateSettings {
  feePercent: number
}

export const exchangeRatesApi = {
  // Admin - get settings
  getSettings: () => api.get<ExchangeRateSettings>('/api/exchange-rates/settings'),

  // Admin - update settings
  updateSettings: (data: ExchangeRateSettings) =>
    api.put<ExchangeRateSettings>('/api/exchange-rates/settings', data),
}
