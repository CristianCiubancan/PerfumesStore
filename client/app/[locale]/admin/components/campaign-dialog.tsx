'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Clock, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Campaign, campaignsApi, CreateCampaignInput, CampaignTemplate } from '@/lib/api/campaigns'
import { ApiError } from '@/lib/api/client'
import { formatDateTimeLocal } from '@/lib/utils'

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  templateId: z.string().min(1, 'Template is required'),
  scheduleMode: z.enum(['now', 'schedule']),
  scheduledFor: z.string().optional(),
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface CampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: Campaign | null
  onSuccess: () => void
}

function getDefaultScheduleTime(): string {
  const date = new Date()
  date.setHours(date.getHours() + 1)
  date.setMinutes(0)
  return formatDateTimeLocal(date.toISOString())
}

export function CampaignDialog({
  open,
  onOpenChange,
  campaign,
  onSuccess,
}: CampaignDialogProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const isEditing = !!campaign

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      templateId: '',
      scheduleMode: 'now',
      scheduledFor: getDefaultScheduleTime(),
    },
  })

  // Load templates on mount
  useEffect(() => {
    async function loadTemplates() {
      setLoadingTemplates(true)
      try {
        const data = await campaignsApi.getTemplates()
        setTemplates(data)
      } catch (error) {
        console.error('Failed to load templates:', error)
        toast.error(t('admin.campaigns.dialog.failedToLoadTemplates'))
      } finally {
        setLoadingTemplates(false)
      }
    }
    if (open) {
      loadTemplates()
    }
  }, [open, t])

  // Reset form when campaign changes
  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name,
        templateId: campaign.templateId,
        scheduleMode: campaign.scheduledFor ? 'schedule' : 'now',
        scheduledFor: campaign.scheduledFor
          ? formatDateTimeLocal(campaign.scheduledFor)
          : getDefaultScheduleTime(),
      })
    } else {
      form.reset({
        name: '',
        templateId: '',
        scheduleMode: 'now',
        scheduledFor: getDefaultScheduleTime(),
      })
    }
  }, [campaign, form])

  async function onSubmit(data: CampaignFormData) {
    setIsLoading(true)

    const payload: CreateCampaignInput = {
      name: data.name,
      templateId: data.templateId,
    }

    try {
      if (isEditing && campaign) {
        // Update the campaign
        await campaignsApi.update(campaign.id, payload)
        toast.success(t('admin.campaigns.dialog.updateSuccess'))

        // If schedule mode, schedule it
        if (data.scheduleMode === 'schedule' && data.scheduledFor) {
          await campaignsApi.schedule(campaign.id, new Date(data.scheduledFor).toISOString())
          toast.success(t('admin.campaigns.dialog.scheduled'))
        }
      } else {
        // Create the campaign
        const created = await campaignsApi.create(payload)
        toast.success(t('admin.campaigns.dialog.createSuccess'))

        // If schedule mode, schedule it
        if (data.scheduleMode === 'schedule' && data.scheduledFor) {
          await campaignsApi.schedule(created.id, new Date(data.scheduledFor).toISOString())
          toast.success(t('admin.campaigns.dialog.scheduled'))
        }
      }
      onSuccess()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.campaigns.dialog.error'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleMode = form.watch('scheduleMode')
  const selectedTemplateId = form.watch('templateId')
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('admin.campaigns.dialog.editTitle')
              : t('admin.campaigns.dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('admin.campaigns.dialog.editDescription')
              : t('admin.campaigns.dialog.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Campaign name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.campaigns.dialog.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('admin.campaigns.dialog.namePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template selection */}
            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.campaigns.dialog.template')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingTemplates}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingTemplates
                              ? t('common.loading')
                              : t('admin.campaigns.dialog.selectTemplate')
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && (
                    <FormDescription>{selectedTemplate.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Schedule mode */}
            <div className="space-y-4 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="scheduleMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.campaigns.dialog.sendMode')}</FormLabel>
                    <div className="flex flex-col gap-2 mt-2">
                      <Button
                        type="button"
                        variant={field.value === 'now' ? 'default' : 'outline'}
                        onClick={() => field.onChange('now')}
                        className="w-full justify-center"
                      >
                        <Send className="h-4 w-4 mr-2 shrink-0" />
                        {t('admin.campaigns.dialog.saveAsDraft')}
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'schedule' ? 'default' : 'outline'}
                        onClick={() => field.onChange('schedule')}
                        className="w-full justify-center"
                      >
                        <Clock className="h-4 w-4 mr-2 shrink-0" />
                        {t('admin.campaigns.dialog.scheduleForLater')}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {scheduleMode === 'schedule' && (
                <FormField
                  control={form.control}
                  name="scheduledFor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin.campaigns.dialog.scheduledFor')}</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? isEditing
                    ? t('admin.campaigns.dialog.updating')
                    : t('admin.campaigns.dialog.creating')
                  : isEditing
                  ? t('admin.campaigns.dialog.updateButton')
                  : t('admin.campaigns.dialog.createButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
