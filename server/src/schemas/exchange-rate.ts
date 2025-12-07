import { z } from 'zod'
import { VALIDATION } from '../config/constants'

export const updateSettingsSchema = z.object({
  body: z.object({
    feePercent: z.number().min(VALIDATION.FEE_MIN_PERCENT, 'Fee cannot be negative').max(VALIDATION.FEE_MAX_PERCENT, `Fee cannot exceed ${VALIDATION.FEE_MAX_PERCENT}%`),
  }),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>['body']
