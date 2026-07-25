import type { Subscription as ApiSubscription, Recommendation as ApiRecommendation } from './api'
import type { Subscription as DemoSubscription, Recommendation as DemoRecommendation, Status } from './data'

const PALETTE = [
  '#ef4444',
  '#22c55e',
  '#f59e0b',
  '#06b6d4',
  '#2563eb',
  '#8b5cf6',
  '#ec4899',
  '#3b82f6',
]

/** Deterministic pseudo-random color per merchant name, so the same merchant always renders the same accent. */
export function colorForMerchant(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

/** Two-letter initials for a merchant avatar, e.g. "Google One" -> "GO", "Netflix" -> "NE". */
export function shortForMerchant(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '??'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function daysUntil(dateStr: string | null): { renewal: string; renewalIn: string } {
  if (!dateStr) return { renewal: 'Not scheduled', renewalIn: '—' }
  const diffMs = new Date(dateStr).getTime() - Date.now()
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (days <= 0) return { renewal: 'Today', renewalIn: 'today' }
  if (days === 1) return { renewal: 'Tomorrow', renewalIn: '1 day' }
  return { renewal: `In ${days} days`, renewalIn: `${days} days` }
}

function statusForLeakScore(score: number): Status {
  if (score <= 30) return 'healthy'
  if (score <= 70) return 'warning'
  return 'critical'
}

/** Converts a live backend subscription record into the shape SubscriptionTable / RecommendationCard already render. */
export function mapSubscription(s: ApiSubscription): DemoSubscription {
  const { renewal, renewalIn } = daysUntil(s.next_renewal)
  return {
    id: s.id,
    merchant: s.merchant_name,
    short: shortForMerchant(s.merchant_name),
    category: s.category,
    plan: s.plan_name ?? '—',
    amount: s.amount,
    renewal,
    renewalIn,
    trend: s.price_hike_detected ? Math.round(s.price_hike_pct ?? 0) : 0,
    leakScore: Math.round(s.leak_score),
    status: statusForLeakScore(s.leak_score),
    color: colorForMerchant(s.merchant_name),
  }
}

const ACTION_LABEL: Record<ApiRecommendation['action'], DemoRecommendation['action']> = {
  cancel: 'Cancel',
  downgrade: 'Downgrade',
  keep: 'Keep',
  alternative: 'Alternative',
  family_plan: 'Family Plan',
  cashback: 'Cashback',
  switch_plan: 'Switch Plan',
}

const TONE_FOR_PRIORITY: Record<ApiRecommendation['priority'], DemoRecommendation['tone']> = {
  high: 'danger',
  medium: 'warning',
  low: 'success',
}

/** Converts a live backend recommendation into the shape RecommendationCard renders. Needs the matching subscription for merchant name/avatar. */
export function mapRecommendation(
  r: ApiRecommendation,
  subscription: ApiSubscription | undefined
): DemoRecommendation {
  const merchant = subscription?.merchant_name ?? r.title
  return {
    id: r.id,
    merchant,
    short: shortForMerchant(merchant),
    action: ACTION_LABEL[r.action] ?? 'Keep',
    reason: r.reasoning,
    savings: Math.round(r.estimated_monthly_savings),
    tone: TONE_FOR_PRIORITY[r.priority] ?? 'warning',
    color: colorForMerchant(merchant),
  }
}
