'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Settings, Percent, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { exchangeRatesApi } from '@/lib/api/exchange-rates'
import { ApiError } from '@/lib/api/client'

export default function SettingsPage() {
  const t = useTranslations()
  const [feePercent, setFeePercent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Load once on mount
  }, [])

  async function loadSettings() {
    try {
      const data = await exchangeRatesApi.getSettings()
      setFeePercent(data.feePercent.toString())
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.settings.failedToLoad'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    const value = parseFloat(feePercent)
    if (isNaN(value) || value < 0 || value > 50) {
      toast.error(t('admin.settings.exchangeRate.invalidFee'))
      return
    }

    setIsSaving(true)
    try {
      await exchangeRatesApi.updateSettings({ feePercent: value })
      toast.success(t('admin.settings.exchangeRate.saveSuccess'))
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.settings.exchangeRate.saveError'))
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">{t('admin.settings.title')}</CardTitle>
                <CardDescription>
                  {t('admin.settings.description')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">{t('common.loading')}</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    {t('admin.settings.exchangeRate.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('admin.settings.exchangeRate.description')}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="feePercent">
                    {t('admin.settings.exchangeRate.feeLabel')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="feePercent"
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={feePercent}
                      onChange={(e) => setFeePercent(e.target.value)}
                      className="max-w-[150px]"
                      placeholder="0.00"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.settings.exchangeRate.feeHint')}
                  </p>
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
