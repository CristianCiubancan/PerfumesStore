'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, Eye, FileText, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  emailTemplatesApi,
  type TemplateMetadata,
  type SupportedLocale,
  type EmailServiceStatus,
} from '@/lib/api/email-templates'

export default function EmailTemplatesPage() {
  const t = useTranslations('admin.emailTemplates')
  const tc = useTranslations('common')

  // State
  const [templates, setTemplates] = useState<TemplateMetadata[]>([])
  const [locales, setLocales] = useState<SupportedLocale[]>([])
  const [status, setStatus] = useState<EmailServiceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<TemplateMetadata | null>(null)
  const [previewLocale, setPreviewLocale] = useState('en')
  const [previewTab, setPreviewTab] = useState<'html' | 'text'>('html')
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  // Load templates and status
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [statusRes, templatesRes] = await Promise.all([
        emailTemplatesApi.getStatus(),
        emailTemplatesApi.list(),
      ])

      setStatus(statusRes)
      setTemplates(templatesRes.templates)
      setLocales(templatesRes.locales)
    } catch (err) {
      setError(t('failedToLoad'))
      console.error('Failed to load email templates:', err)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Load preview for template
  const loadPreview = useCallback(async (templateId: string, locale: string) => {
    try {
      setPreviewLoading(true)
      const preview = await emailTemplatesApi.getPreview(templateId, locale)
      setPreviewSubject(preview.subject)
      setPreviewHtml(preview.html)
      setPreviewText(preview.text)
    } catch (err) {
      console.error('Failed to load preview:', err)
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  // Open preview dialog
  const openPreview = useCallback(
    (template: TemplateMetadata) => {
      setPreviewTemplate(template)
      setPreviewLocale('en')
      setPreviewTab('html')
      setPreviewOpen(true)
      loadPreview(template.id, 'en')
    },
    [loadPreview]
  )

  // Handle locale change in preview
  const handleLocaleChange = useCallback(
    (locale: string) => {
      setPreviewLocale(locale)
      if (previewTemplate) {
        loadPreview(previewTemplate.id, locale)
      }
    },
    [previewTemplate, loadPreview]
  )

  // Get category badge variant
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'transactional':
        return <Badge variant="default">{t('categories.transactional')}</Badge>
      case 'marketing':
        return <Badge variant="secondary">{t('categories.marketing')}</Badge>
      default:
        return <Badge variant="outline">{category}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle>{t('title')}</CardTitle>
        </div>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Service Status */}
        {status && (
          <Alert variant={status.enabled ? 'default' : 'destructive'}>
            {status.enabled ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{t('status.title')}</AlertTitle>
            <AlertDescription>
              {status.enabled ? (
                <>
                  {t('status.enabled', { provider: status.provider })}
                  {status.fromEmail && (
                    <span className="ml-2 text-muted-foreground">
                      ({t('status.from')}: {status.fromEmail})
                    </span>
                  )}
                </>
              ) : (
                t('status.disabled')
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{tc('error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Templates table */}
        {!loading && !error && templates.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.description')}</TableHead>
                  <TableHead>{t('table.category')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {template.description}
                    </TableCell>
                    <TableCell>{getCategoryBadge(template.category)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPreview(template)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t('preview')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && templates.length === 0 && (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t('noTemplates')}</h3>
            <p className="mt-2 text-muted-foreground">{t('noTemplatesDescription')}</p>
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {previewTemplate?.name}
              </DialogTitle>
              <DialogDescription>{previewTemplate?.description}</DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-4 py-2">
              <label className="text-sm font-medium">{t('selectLocale')}</label>
              <Select value={previewLocale} onValueChange={handleLocaleChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locales.map((locale) => (
                    <SelectItem key={locale.code} value={locale.code}>
                      {locale.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject line */}
            {previewSubject && (
              <div className="px-4 py-2 bg-muted rounded-md">
                <span className="text-sm font-medium">{t('subject')}: </span>
                <span className="text-sm">{previewSubject}</span>
              </div>
            )}

            <Tabs
              value={previewTab}
              onValueChange={(v: string) => setPreviewTab(v as 'html' | 'text')}
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList>
                <TabsTrigger value="html" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {t('htmlPreview')}
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('textPreview')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="html" className="flex-1 min-h-0 mt-4">
                {previewLoading ? (
                  <div className="h-[500px] flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <div className="h-[500px] border rounded-md overflow-hidden bg-white">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="text" className="flex-1 min-h-0 mt-4">
                {previewLoading ? (
                  <Skeleton className="h-[500px] w-full" />
                ) : (
                  <pre className="h-[500px] p-4 bg-muted rounded-md overflow-auto text-sm whitespace-pre-wrap font-mono">
                    {previewText}
                  </pre>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
