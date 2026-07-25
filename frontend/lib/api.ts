import { getAccessToken } from './supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()
  const headers: HeadersInit = {
    ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.detail || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ---------------------------------------------------------------- Types
export type Subscription = {
  id: string
  merchant_name: string
  category: string
  plan_name: string | null
  amount: number
  previous_amount: number | null
  currency: string
  billing_cycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly'
  first_seen: string
  last_charged: string
  next_renewal: string | null
  status: 'active' | 'cancelled' | 'paused' | 'unused'
  is_duplicate: boolean
  duplicate_of: string | null
  price_hike_detected: boolean
  price_hike_pct: number | null
  leak_score: number
  confidence: number
}

export type Recommendation = {
  id: string
  subscription_id: string
  action: 'cancel' | 'downgrade' | 'keep' | 'alternative' | 'family_plan' | 'cashback' | 'switch_plan'
  title: string
  reasoning: string
  estimated_monthly_savings: number
  estimated_yearly_savings: number
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'accepted' | 'dismissed'
}

export type DashboardSummary = {
  monthly_spend: number
  yearly_spend: number
  potential_savings: number
  leak_score: number
  active_subscriptions: number
  duplicate_count: number
  price_hike_count: number
  unused_count: number
}

export type CategoryBreakdown = {
  category: string
  subscription_count: number
  total_amount: number
}

export type Statement = {
  id: string
  file_name: string
  file_type: 'csv' | 'pdf' | 'xlsx'
  status: 'processing' | 'completed' | 'failed'
  transactions_found: number
  subscriptions_found: number
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export type UploadResult = {
  statement_id: string
  file_name: string
  transactions_found: number
  subscriptions_found: number
  status: 'processing' | 'completed' | 'failed'
}

// ---------------------------------------------------------------- API
export const api = {
  upload: {
    statement: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return request<UploadResult>('/api/upload', { method: 'POST', body: form })
    },
  },
  dashboard: {
    summary: () => request<DashboardSummary>('/api/dashboard/summary'),
    categories: () => request<CategoryBreakdown[]>('/api/dashboard/categories'),
    renewals: () => request<Subscription[]>('/api/dashboard/renewals'),
    leakScoreHistory: () =>
      request<{ score: number; monthly_spend: number; potential_savings: number; recorded_at: string }[]>(
        '/api/dashboard/leak-score-history'
      ),
    quickInsights: () => request<string[]>('/api/dashboard/quick-insights'),
  },
  subscriptions: {
    list: (params?: { status?: string; category?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString()
      return request<Subscription[]>(`/api/subscriptions${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => request<Subscription>(`/api/subscriptions/${id}`),
    updateStatus: (id: string, status: Subscription['status']) =>
      request<Subscription>(`/api/subscriptions/${id}/status?new_status=${status}`, { method: 'PATCH' }),
  },
  recommendations: {
    list: (status?: string) =>
      request<Recommendation[]>(`/api/recommendations${status ? `?status_filter=${status}` : ''}`),
    updateStatus: (id: string, status: 'accepted' | 'dismissed') =>
      request<Recommendation>(`/api/recommendations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
  history: {
    statements: () => request<any[]>('/api/history/statements'),
    forecast: (months = 6) =>
      request<{ forecast_month: string; predicted_spend: number; predicted_savings_if_actioned: number }[]>(
        `/api/history/forecast?months=${months}`
      ),
  },
  settings: {
    getProfile: () => request<any>('/api/settings/profile'),
    updateProfile: (payload: Record<string, unknown>) =>
      request<any>('/api/settings/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
    deleteAccountData: () => request<void>('/api/settings/account', { method: 'DELETE' }),
  },
  reports: {
    downloadUrl: () => `${API_BASE_URL}/api/reports/generate`,
  },
}
