'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Currency,
  useCurrencyStore,
  currencyFlags,
  currencySymbols,
} from '@/store/currency'
import { fetchExchangeRates, shouldRefetchRates } from '@/lib/currency'

const currencies: Currency[] = ['RON', 'EUR', 'GBP']

export function CurrencySwitcher() {
  const t = useTranslations('currency')
  const {
    currency,
    exchangeRates,
    lastFetched,
    setCurrency,
    setExchangeRates,
    setLoading,
    setError,
  } = useCurrencyStore()

  useEffect(() => {
    async function loadRates() {
      if (!shouldRefetchRates(lastFetched) && exchangeRates) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const rates = await fetchExchangeRates()
        setExchangeRates(rates)
        setLoading(false)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch rates')
      }
    }

    loadRates()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount; store setters are stable
  }, [])

  function handleCurrencyChange(newCurrency: Currency) {
    setCurrency(newCurrency)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Coins className="h-5 w-5" />
          <span className="sr-only">{t('changeCurrency')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr}
            onClick={() => handleCurrencyChange(curr)}
            className={currency === curr ? 'bg-accent' : ''}
          >
            <span className="mr-2">{currencyFlags[curr]}</span>
            <span className="mr-2">{currencySymbols[curr]}</span>
            {t(curr)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
