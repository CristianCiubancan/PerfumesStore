'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, Send, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  campaignsApi,
  Campaign,
  CampaignStatus,
} from '@/lib/api/campaigns'
import { ApiError } from '@/lib/api/client'
import { CampaignDialog } from '../components/campaign-dialog'
import { formatDateTime } from '@/lib/utils'

function getStatusBadgeVariant(status: CampaignStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'SENT':
      return 'default'
    case 'SCHEDULED':
      return 'secondary'
    case 'DRAFT':
      return 'outline'
    case 'SENDING':
      return 'secondary'
    case 'FAILED':
      return 'destructive'
    default:
      return 'outline'
  }
}

export default function CampaignsPage() {
  const t = useTranslations()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>('ALL')

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)

  // Send dialog
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [campaignToSend, setCampaignToSend] = useState<Campaign | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [campaignToCancel, setCampaignToCancel] = useState<Campaign | null>(null)

  const loadCampaigns = useCallback(async () => {
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {}
      const data = await campaignsApi.list(params)
      setCampaigns(data.campaigns)
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.campaigns.failedToLoad'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, t])

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  function handleAddCampaign() {
    setEditingCampaign(null)
    setDialogOpen(true)
  }

  function handleEditCampaign(campaign: Campaign) {
    setEditingCampaign(campaign)
    setDialogOpen(true)
  }

  function handleDeleteClick(campaign: Campaign) {
    setCampaignToDelete(campaign)
    setDeleteDialogOpen(true)
  }

  function handleSendClick(campaign: Campaign) {
    setCampaignToSend(campaign)
    setSendDialogOpen(true)
  }

  function handleCancelClick(campaign: Campaign) {
    setCampaignToCancel(campaign)
    setCancelDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!campaignToDelete) return

    try {
      await campaignsApi.delete(campaignToDelete.id)
      toast.success(t('admin.campaigns.deleteDialog.success'))
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete.id))
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.campaigns.deleteDialog.error'))
      }
    } finally {
      setDeleteDialogOpen(false)
      setCampaignToDelete(null)
    }
  }

  async function handleSendConfirm() {
    if (!campaignToSend) return

    setIsSending(true)
    try {
      const response = await campaignsApi.send(campaignToSend.id)
      toast.success(
        t('admin.campaigns.sendDialog.success', {
          sent: response.result.sent,
          total: response.result.total,
        })
      )
      loadCampaigns()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.campaigns.sendDialog.error'))
      }
    } finally {
      setIsSending(false)
      setSendDialogOpen(false)
      setCampaignToSend(null)
    }
  }

  async function handleCancelConfirm() {
    if (!campaignToCancel) return

    try {
      await campaignsApi.cancel(campaignToCancel.id)
      toast.success(t('admin.campaigns.cancelDialog.success'))
      loadCampaigns()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.campaigns.cancelDialog.error'))
      }
    } finally {
      setCancelDialogOpen(false)
      setCampaignToCancel(null)
    }
  }

  function handleDialogSuccess() {
    setDialogOpen(false)
    setEditingCampaign(null)
    loadCampaigns()
  }

  const canEdit = (campaign: Campaign) =>
    ['DRAFT', 'FAILED'].includes(campaign.status)

  const canSend = (campaign: Campaign) =>
    ['DRAFT', 'FAILED'].includes(campaign.status)

  const canCancel = (campaign: Campaign) => campaign.status === 'SCHEDULED'

  const canDelete = (campaign: Campaign) => campaign.status !== 'SENDING'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 shrink-0" />
              <div>
                <CardTitle className="text-2xl">{t('admin.campaigns.title')}</CardTitle>
                <CardDescription>{t('admin.campaigns.description')}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as CampaignStatus | 'ALL')}
              >
                <SelectTrigger className="w-[140px] sm:w-[150px]">
                  <SelectValue placeholder={t('admin.campaigns.filterStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('admin.campaigns.status.all')}</SelectItem>
                  <SelectItem value="DRAFT">{t('admin.campaigns.status.DRAFT')}</SelectItem>
                  <SelectItem value="SCHEDULED">{t('admin.campaigns.status.SCHEDULED')}</SelectItem>
                  <SelectItem value="SENDING">{t('admin.campaigns.status.SENDING')}</SelectItem>
                  <SelectItem value="SENT">{t('admin.campaigns.status.SENT')}</SelectItem>
                  <SelectItem value="FAILED">{t('admin.campaigns.status.FAILED')}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddCampaign}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('admin.campaigns.addCampaign')}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Send className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{t('admin.campaigns.noCampaigns')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('admin.campaigns.noCampaignsDescription')}
              </p>
              <Button onClick={handleAddCampaign}>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.campaigns.addCampaign')}
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.campaigns.table.name')}</TableHead>
                    <TableHead>{t('admin.campaigns.table.template')}</TableHead>
                    <TableHead className="text-center">{t('admin.campaigns.table.status')}</TableHead>
                    <TableHead>{t('admin.campaigns.table.scheduledFor')}</TableHead>
                    <TableHead className="text-center">{t('admin.campaigns.table.results')}</TableHead>
                    <TableHead className="text-right">{t('admin.campaigns.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {campaign.templateId}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(campaign.status)}>
                          {t(`admin.campaigns.status.${campaign.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {campaign.scheduledFor
                          ? formatDateTime(campaign.scheduledFor)
                          : campaign.sentAt
                          ? formatDateTime(campaign.sentAt)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {campaign.totalRecipients !== null ? (
                          <span>
                            {campaign.sentCount}/{campaign.totalRecipients}
                            {campaign.failedCount && campaign.failedCount > 0 ? (
                              <span className="text-destructive ml-1">
                                ({campaign.failedCount} {t('admin.campaigns.failed')})
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit(campaign) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCampaign(campaign)}
                              title={t('common.edit')}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canSend(campaign) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSendClick(campaign)}
                              title={t('admin.campaigns.send')}
                            >
                              <Send className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          {canCancel(campaign) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancelClick(campaign)}
                              title={t('admin.campaigns.cancel')}
                            >
                              <XCircle className="h-4 w-4 text-orange-500" />
                            </Button>
                          )}
                          {canDelete(campaign) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(campaign)}
                              title={t('common.delete')}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaign={editingCampaign}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.campaigns.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.campaigns.deleteDialog.description', {
                name: campaignToDelete?.name || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send confirmation dialog */}
      <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.campaigns.sendDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.campaigns.sendDialog.description', {
                name: campaignToSend?.name || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendConfirm} disabled={isSending}>
              {isSending ? t('admin.campaigns.sending') : t('admin.campaigns.send')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.campaigns.cancelDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.campaigns.cancelDialog.description', {
                name: campaignToCancel?.name || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm}>
              {t('admin.campaigns.cancelSchedule')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
