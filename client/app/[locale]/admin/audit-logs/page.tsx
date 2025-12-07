'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { FileText, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { auditApi, AuditLogsParams } from '@/lib/api/audit'
import { AuditLog, AuditAction, AuditEntityType } from '@/types'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/utils'

function getActionBadgeVariant(action: AuditAction): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (action) {
    case 'CREATE':
      return 'default'
    case 'UPDATE':
      return 'secondary'
    case 'DELETE':
    case 'BULK_DELETE':
      return 'destructive'
    case 'LOGIN':
    case 'LOGOUT':
      return 'outline'
    case 'PASSWORD_CHANGE':
      return 'secondary'
    default:
      return 'outline'
  }
}

function getEntityBadgeVariant(entityType: AuditEntityType): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (entityType) {
    case 'PRODUCT':
      return 'default'
    case 'PROMOTION':
      return 'secondary'
    case 'USER':
      return 'outline'
    case 'SETTINGS':
      return 'secondary'
    default:
      return 'outline'
  }
}

export default function AuditLogsPage() {
  const t = useTranslations()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Filters
  const [actionFilter, setActionFilter] = useState<AuditAction | 'ALL'>('ALL')
  const [entityTypeFilter, setEntityTypeFilter] = useState<AuditEntityType | 'ALL'>('ALL')

  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: AuditLogsParams = {
        page,
        limit: 20,
      }

      if (actionFilter !== 'ALL') {
        params.action = actionFilter
      }
      if (entityTypeFilter !== 'ALL') {
        params.entityType = entityTypeFilter
      }

      const data = await auditApi.list(params)
      setLogs(data.logs)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.auditLogs.failedToLoad'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [page, actionFilter, entityTypeFilter, t])

  useEffect(() => {
    loadAuditLogs()
  }, [loadAuditLogs])

  function handleViewDetails(log: AuditLog) {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  function clearFilters() {
    setActionFilter('ALL')
    setEntityTypeFilter('ALL')
    setPage(1)
  }

  const hasFilters = actionFilter !== 'ALL' || entityTypeFilter !== 'ALL'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">{t('admin.auditLogs.title')}</CardTitle>
                <CardDescription>
                  {t('admin.auditLogs.description')}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('admin.auditLogs.filters.title')}:</span>
            </div>
            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setActionFilter(value as AuditAction | 'ALL')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('admin.auditLogs.filters.action')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('admin.auditLogs.filters.allActions')}</SelectItem>
                <SelectItem value="CREATE">{t('admin.auditLogs.actions.CREATE')}</SelectItem>
                <SelectItem value="UPDATE">{t('admin.auditLogs.actions.UPDATE')}</SelectItem>
                <SelectItem value="DELETE">{t('admin.auditLogs.actions.DELETE')}</SelectItem>
                <SelectItem value="BULK_DELETE">{t('admin.auditLogs.actions.BULK_DELETE')}</SelectItem>
                <SelectItem value="LOGIN">{t('admin.auditLogs.actions.LOGIN')}</SelectItem>
                <SelectItem value="LOGOUT">{t('admin.auditLogs.actions.LOGOUT')}</SelectItem>
                <SelectItem value="PASSWORD_CHANGE">{t('admin.auditLogs.actions.PASSWORD_CHANGE')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={entityTypeFilter}
              onValueChange={(value) => {
                setEntityTypeFilter(value as AuditEntityType | 'ALL')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('admin.auditLogs.filters.entityType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('admin.auditLogs.filters.allEntities')}</SelectItem>
                <SelectItem value="PRODUCT">{t('admin.auditLogs.entities.PRODUCT')}</SelectItem>
                <SelectItem value="PROMOTION">{t('admin.auditLogs.entities.PROMOTION')}</SelectItem>
                <SelectItem value="USER">{t('admin.auditLogs.entities.USER')}</SelectItem>
                <SelectItem value="SETTINGS">{t('admin.auditLogs.entities.SETTINGS')}</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                {t('admin.auditLogs.filters.clear')}
              </Button>
            )}
            <span className="text-sm text-muted-foreground ml-auto">
              {t('admin.auditLogs.totalLogs', { count: total })}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{t('admin.auditLogs.loading')}</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{t('admin.auditLogs.noLogs')}</h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? t('admin.auditLogs.noMatchingLogs')
                  : t('admin.auditLogs.noLogsDescription')}
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  {t('admin.auditLogs.filters.clear')}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.auditLogs.table.timestamp')}</TableHead>
                      <TableHead>{t('admin.auditLogs.table.user')}</TableHead>
                      <TableHead className="text-center">{t('admin.auditLogs.table.action')}</TableHead>
                      <TableHead className="text-center">{t('admin.auditLogs.table.entityType')}</TableHead>
                      <TableHead className="text-center">{t('admin.auditLogs.table.entityId')}</TableHead>
                      <TableHead className="text-right">{t('admin.auditLogs.table.details')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDateTime(log.createdAt, { includeSeconds: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.user?.name ?? t('admin.auditLogs.deletedUser')}</span>
                            <span className="text-xs text-muted-foreground">{log.user?.email ?? '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {t(`admin.auditLogs.actions.${log.action}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getEntityBadgeVariant(log.entityType)}>
                            {t(`admin.auditLogs.entities.${log.entityType}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {log.entityId ?? '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                          >
                            {t('admin.auditLogs.viewDetails')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  {t('admin.auditLogs.pageInfo', { current: page, total: totalPages })}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('common.previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    {t('common.next')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.auditLogs.detailsDialog.title')}</DialogTitle>
            <DialogDescription>
              {selectedLog && formatDateTime(selectedLog.createdAt, { includeSeconds: true })}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('admin.auditLogs.detailsDialog.user')}
                  </label>
                  <p className="font-medium">{selectedLog.user?.name ?? t('admin.auditLogs.deletedUser')}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.user?.email ?? '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('admin.auditLogs.detailsDialog.action')}
                  </label>
                  <div className="mt-1">
                    <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                      {t(`admin.auditLogs.actions.${selectedLog.action}`)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('admin.auditLogs.detailsDialog.entityType')}
                  </label>
                  <div className="mt-1">
                    <Badge variant={getEntityBadgeVariant(selectedLog.entityType)}>
                      {t(`admin.auditLogs.entities.${selectedLog.entityType}`)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('admin.auditLogs.detailsDialog.entityId')}
                  </label>
                  <p className="font-mono">{selectedLog.entityId ?? '-'}</p>
                </div>
              </div>

              {selectedLog.ipAddress && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('admin.auditLogs.detailsDialog.ipAddress')}
                  </label>
                  <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('admin.auditLogs.detailsDialog.userAgent')}
                  </label>
                  <p className="text-xs text-muted-foreground break-all">{selectedLog.userAgent}</p>
                </div>
              )}

              {selectedLog.oldValue && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('admin.auditLogs.detailsDialog.oldValue')}
                  </label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('admin.auditLogs.detailsDialog.newValue')}
                  </label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
