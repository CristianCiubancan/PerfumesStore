'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Mail, UserX, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react'
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
import { newsletterApi } from '@/lib/api/newsletter'
import { NewsletterSubscriber } from '@/types'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils'

export default function NewsletterPage() {
  const t = useTranslations()
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Unsubscribe dialog
  const [unsubscribeDialogOpen, setUnsubscribeDialogOpen] = useState(false)
  const [subscriberToUnsubscribe, setSubscriberToUnsubscribe] = useState<NewsletterSubscriber | null>(null)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [subscriberToDelete, setSubscriberToDelete] = useState<NewsletterSubscriber | null>(null)

  const loadSubscribers = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: { page: number; limit: number; isActive?: boolean } = {
        page,
        limit: 20,
      }
      if (statusFilter === 'active') params.isActive = true
      if (statusFilter === 'unsubscribed') params.isActive = false

      const data = await newsletterApi.list(params)
      setSubscribers(data.subscribers)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.newsletter.failedToLoad'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter, t])

  useEffect(() => {
    loadSubscribers()
  }, [loadSubscribers])

  function handleUnsubscribeClick(subscriber: NewsletterSubscriber) {
    setSubscriberToUnsubscribe(subscriber)
    setUnsubscribeDialogOpen(true)
  }

  async function handleUnsubscribeConfirm() {
    if (!subscriberToUnsubscribe) return

    try {
      await newsletterApi.unsubscribe(subscriberToUnsubscribe.id)
      toast.success(t('admin.newsletter.unsubscribeDialog.success'))
      loadSubscribers()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.newsletter.unsubscribeDialog.error'))
      }
    } finally {
      setUnsubscribeDialogOpen(false)
      setSubscriberToUnsubscribe(null)
    }
  }

  function handleDeleteClick(subscriber: NewsletterSubscriber) {
    setSubscriberToDelete(subscriber)
    setDeleteDialogOpen(true)
  }

  function clearFilters() {
    setStatusFilter('all')
    setPage(1)
  }

  const hasFilters = statusFilter !== 'all'

  async function handleDeleteConfirm() {
    if (!subscriberToDelete) return

    try {
      await newsletterApi.delete(subscriberToDelete.id)
      toast.success(t('admin.newsletter.deleteDialog.success'))
      loadSubscribers()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.newsletter.deleteDialog.error'))
      }
    } finally {
      setDeleteDialogOpen(false)
      setSubscriberToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 shrink-0" />
              <div>
                <CardTitle className="text-xl sm:text-2xl">{t('admin.newsletter.title')}</CardTitle>
                <CardDescription>
                  {t('admin.newsletter.description')}
                </CardDescription>
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('admin.newsletter.filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.newsletter.filters.allStatus')}</SelectItem>
                <SelectItem value="active">{t('admin.newsletter.filters.active')}</SelectItem>
                <SelectItem value="unsubscribed">{t('admin.newsletter.filters.unsubscribed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{t('admin.newsletter.loading')}</div>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{t('admin.newsletter.noSubscribers')}</h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? t('admin.newsletter.noMatchingSubscribers')
                  : t('admin.newsletter.noSubscribersDescription')}
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  {t('admin.newsletter.filters.clear')}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">{t('admin.newsletter.table.email')}</TableHead>
                      <TableHead className="min-w-[140px]">{t('admin.newsletter.table.subscribedAt')}</TableHead>
                      <TableHead className="text-center min-w-[100px]">{t('admin.newsletter.table.status')}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{t('admin.newsletter.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">
                          {subscriber.email}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(subscriber.subscribedAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={subscriber.isActive ? 'default' : 'secondary'}
                          >
                            {subscriber.isActive
                              ? t('admin.newsletter.status.active')
                              : t('admin.newsletter.status.unsubscribed')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {subscriber.isActive && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUnsubscribeClick(subscriber)}
                                title={t('admin.newsletter.unsubscribe')}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(subscriber)}
                              title={t('common.delete')}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {t('admin.newsletter.totalSubscribers', { count: total })}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('common.previous')}</span>
                  </Button>
                  <span className="text-sm whitespace-nowrap">
                    {t('admin.newsletter.pageInfo', { current: page, total: totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <span className="hidden sm:inline">{t('common.next')}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Unsubscribe Dialog */}
      <AlertDialog open={unsubscribeDialogOpen} onOpenChange={setUnsubscribeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.newsletter.unsubscribeDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.newsletter.unsubscribeDialog.description', { email: subscriberToUnsubscribe?.email || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnsubscribeConfirm}>
              {t('admin.newsletter.unsubscribe')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.newsletter.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.newsletter.deleteDialog.description', { email: subscriberToDelete?.email || '' })}
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
    </div>
  )
}
