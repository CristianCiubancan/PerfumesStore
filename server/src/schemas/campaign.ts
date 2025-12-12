import { z } from 'zod'
import { PAGINATION } from '../config/constants'

export const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Campaign name is required').max(100),
    templateId: z.string().min(1, 'Template is required'),
  }),
})

export const updateCampaignSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid campaign ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    templateId: z.string().min(1).optional(),
  }),
})

export const campaignIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid campaign ID'),
  }),
})

export const scheduleCampaignSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid campaign ID'),
  }),
  body: z.object({
    scheduledFor: z.string().datetime({ message: 'Invalid datetime format. Use ISO 8601.' }),
  }),
})

export const listCampaignsSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z
        .string()
        .regex(/^\d+$/)
        .refine(
          (val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= PAGINATION.MAX_LIMIT),
          `Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`
        )
        .optional(),
      status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED']).optional(),
    })
    .optional(),
})

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>['body']
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>['body']
export type ListCampaignsQuery = z.infer<typeof listCampaignsSchema>['query']
