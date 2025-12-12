import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { asyncHandler } from '../lib/asyncHandler'
import { authenticate, authorize } from '../middleware/auth'
import { config } from '../config'
import { AppError } from '../middleware/errorHandler'
import {
  listTemplatesForPreview,
  getTemplatePreview,
  getSupportedLocales,
  getTemplateSampleDataForPreview,
} from '../services/email/preview.service'
import { isEmailEnabled } from '../services/email'
import { SUPPORTED_LOCALES, type Locale } from '../services/email/templates'

const router = Router()

// All routes require admin authentication
router.use(authenticate)
router.use(authorize('ADMIN'))

// ============================================================================
// Schemas
// ============================================================================

const previewSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({
    locale: z.enum(SUPPORTED_LOCALES as [string, ...string[]]).optional(),
  }).optional(),
})

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/admin/email/status
 * Check email service configuration status
 */
router.get(
  '/status',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      data: {
        enabled: isEmailEnabled(),
        provider: 'resend',
        fromEmail: config.RESEND_FROM_EMAIL || null,
      },
    })
  })
)

/**
 * GET /api/admin/email/locales
 * Get all supported locales
 */
router.get(
  '/locales',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      data: getSupportedLocales(),
    })
  })
)

/**
 * GET /api/admin/email/templates
 * List all available email templates
 */
router.get(
  '/templates',
  asyncHandler(async (_req: Request, res: Response) => {
    const baseUrl = config.BACKEND_URL
    const templates = listTemplatesForPreview(baseUrl)

    res.json({
      data: {
        templates,
        locales: getSupportedLocales(),
      },
    })
  })
)

/**
 * GET /api/admin/email/templates/:id
 * Get template metadata and sample data
 */
router.get(
  '/templates/:id',
  validate(previewSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const sampleData = getTemplateSampleDataForPreview(id)

    if (sampleData === null) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND')
    }

    const preview = getTemplatePreview(id, 'en')
    if (!preview) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND')
    }

    res.json({
      data: {
        template: preview.template,
        sampleData,
        availableLocales: preview.availableLocales,
      },
    })
  })
)

/**
 * GET /api/admin/email/templates/:id/preview
 * Render template preview with sample data
 * Query params: ?locale=en (default: en)
 */
router.get(
  '/templates/:id/preview',
  validate(previewSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const locale = (req.query?.locale as Locale) || 'en'

    const preview = getTemplatePreview(id, locale)

    if (!preview) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND')
    }

    // Check Accept header to determine response format
    const acceptsHtml = req.accepts('html')
    const acceptsJson = req.accepts('json')

    // If explicitly requesting HTML or viewing in browser, return raw HTML
    if (acceptsHtml && !acceptsJson) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.send(preview.html)
      return
    }

    // Otherwise return JSON with all data
    res.json({
      data: preview,
    })
  })
)

/**
 * GET /api/admin/email/templates/:id/preview/html
 * Render template preview as raw HTML (for iframe embedding)
 */
router.get(
  '/templates/:id/preview/html',
  validate(previewSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const locale = (req.query?.locale as Locale) || 'en'

    const preview = getTemplatePreview(id, locale)

    if (!preview) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND')
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(preview.html)
  })
)

/**
 * GET /api/admin/email/templates/:id/preview/text
 * Render template preview as plain text
 */
router.get(
  '/templates/:id/preview/text',
  validate(previewSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const locale = (req.query?.locale as Locale) || 'en'

    const preview = getTemplatePreview(id, locale)

    if (!preview) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND')
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.send(preview.text)
  })
)

export default router
