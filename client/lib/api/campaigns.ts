import { api } from './client'

// ============================================================================
// Types
// ============================================================================

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED'

export interface Campaign {
  id: number
  name: string
  templateId: string
  status: CampaignStatus
  scheduledFor: string | null
  sentAt: string | null
  totalRecipients: number | null
  sentCount: number | null
  failedCount: number | null
  createdAt: string
  updatedAt: string
}

export interface CampaignTemplate {
  id: string
  name: string
  description: string
  category: 'campaign'
  variables: string[]
}

export interface CampaignsResponse {
  campaigns: Campaign[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateCampaignInput {
  name: string
  templateId: string
}

export interface UpdateCampaignInput {
  name?: string
  templateId?: string
}

export interface CampaignResult {
  total: number
  sent: number
  failed: number
  errors?: Array<{ email: string; error: string }>
}

export interface ListCampaignsParams {
  page?: number
  limit?: number
  status?: CampaignStatus
}

// ============================================================================
// API
// ============================================================================

export const campaignsApi = {
  /**
   * List all campaigns with pagination and optional status filter
   */
  list: (params: ListCampaignsParams = {}) => {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.status) searchParams.set('status', params.status)
    const queryString = searchParams.toString()
    return api.get<CampaignsResponse>(
      `/api/admin/campaigns${queryString ? `?${queryString}` : ''}`
    )
  },

  /**
   * Get a single campaign by ID
   */
  get: (id: number) => api.get<Campaign>(`/api/admin/campaigns/${id}`),

  /**
   * Get available campaign templates
   */
  getTemplates: () => api.get<CampaignTemplate[]>('/api/admin/campaigns/templates'),

  /**
   * Create a new campaign (starts as DRAFT)
   */
  create: (data: CreateCampaignInput) =>
    api.post<Campaign>('/api/admin/campaigns', data),

  /**
   * Update an existing campaign
   */
  update: (id: number, data: UpdateCampaignInput) =>
    api.put<Campaign>(`/api/admin/campaigns/${id}`, data),

  /**
   * Delete a campaign
   */
  delete: (id: number) =>
    api.delete<{ message: string }>(`/api/admin/campaigns/${id}`),

  /**
   * Schedule a campaign for future delivery
   */
  schedule: (id: number, scheduledFor: string) =>
    api.post<Campaign>(`/api/admin/campaigns/${id}/schedule`, { scheduledFor }),

  /**
   * Send a campaign immediately
   */
  send: (id: number) =>
    api.post<{ message: string; result: CampaignResult }>(
      `/api/admin/campaigns/${id}/send`,
      {}
    ),

  /**
   * Cancel a scheduled campaign (moves back to DRAFT)
   */
  cancel: (id: number) =>
    api.post<Campaign>(`/api/admin/campaigns/${id}/cancel`, {}),
}
