export type Status = 'healthy' | 'warning' | 'critical'

export type Subscription = {
  id: string
  merchant: string
  short: string
  category: string
  plan: string
  amount: number
  renewal: string
  renewalIn: string
  trend: number // percentage change month over month
  leakScore: number
  status: Status
  color: string // brand-ish accent for the avatar
}

export const subscriptions: Subscription[] = [
  {
    id: 'netflix',
    merchant: 'Netflix',
    short: 'NF',
    category: 'Streaming',
    plan: 'Premium 4K',
    amount: 649,
    renewal: 'Tomorrow',
    renewalIn: '1 day',
    trend: 25,
    leakScore: 88,
    status: 'critical',
    color: '#ef4444',
  },
  {
    id: 'spotify',
    merchant: 'Spotify',
    short: 'SP',
    category: 'Music',
    plan: 'Individual',
    amount: 149,
    renewal: 'In 5 days',
    renewalIn: '5 days',
    trend: 25,
    leakScore: 76,
    status: 'critical',
    color: '#22c55e',
  },
  {
    id: 'adobe',
    merchant: 'Adobe CC',
    short: 'AD',
    category: 'Creative',
    plan: 'All Apps',
    amount: 1699,
    renewal: 'In 3 days',
    renewalIn: '3 days',
    trend: 13,
    leakScore: 64,
    status: 'warning',
    color: '#f59e0b',
  },
  {
    id: 'prime',
    merchant: 'Prime Video',
    short: 'PV',
    category: 'Streaming',
    plan: 'Annual',
    amount: 125,
    renewal: 'In 12 days',
    renewalIn: '12 days',
    trend: 0,
    leakScore: 42,
    status: 'warning',
    color: '#06b6d4',
  },
  {
    id: 'disney',
    merchant: 'Disney+ Hotstar',
    short: 'D+',
    category: 'Streaming',
    plan: 'Super',
    amount: 299,
    renewal: 'In 18 days',
    renewalIn: '18 days',
    trend: 0,
    leakScore: 38,
    status: 'warning',
    color: '#2563eb',
  },
  {
    id: 'googleone',
    merchant: 'Google One',
    short: 'G1',
    category: 'Cloud Storage',
    plan: '200 GB',
    amount: 219,
    renewal: 'In 21 days',
    renewalIn: '21 days',
    trend: 0,
    leakScore: 12,
    status: 'healthy',
    color: '#3b82f6',
  },
  {
    id: 'youtube',
    merchant: 'YouTube Premium',
    short: 'YT',
    category: 'Streaming',
    plan: 'Individual',
    amount: 129,
    renewal: 'In 9 days',
    renewalIn: '9 days',
    trend: 0,
    leakScore: 28,
    status: 'healthy',
    color: '#ef4444',
  },
  {
    id: 'cultfit',
    merchant: 'Cult.fit',
    short: 'CF',
    category: 'Fitness',
    plan: 'Elite',
    amount: 416,
    renewal: 'In 15 days',
    renewalIn: '15 days',
    trend: 8,
    leakScore: 58,
    status: 'warning',
    color: '#22c55e',
  },
]

export const metrics = {
  monthlySpend: 2840,
  potentialSavings: 14560,
  leakScore: 82,
  recurringCount: 12,
}

export const spendTrend = [
  { month: 'Jan', spend: 1980 },
  { month: 'Feb', spend: 2120 },
  { month: 'Mar', spend: 2240 },
  { month: 'Apr', spend: 2310 },
  { month: 'May', spend: 2560 },
  { month: 'Jun', spend: 2620 },
  { month: 'Jul', spend: 2840 },
]

export const categoryBreakdown = [
  { name: 'Streaming', value: 1401, color: '#2563eb' },
  { name: 'Music', value: 149, color: '#06b6d4' },
  { name: 'Creative', value: 1699, color: '#22c55e' },
  { name: 'Fitness', value: 416, color: '#f59e0b' },
  { name: 'Cloud Storage', value: 219, color: '#ef4444' },
  { name: 'Education', value: 299, color: '#8b5cf6' },
]

export const priceHikes = [
  { merchant: 'Spotify', from: 119, to: 149, pct: 25, date: 'Jun 2026' },
  { merchant: 'Netflix', from: 199, to: 249, pct: 25, date: 'May 2026' },
  { merchant: 'Adobe CC', from: 1499, to: 1699, pct: 13, date: 'Apr 2026' },
]

export type Recommendation = {
  id: string
  merchant: string
  short: string
  action: 'Downgrade' | 'Cancel' | 'Switch Plan' | 'Keep' | 'Alternative' | 'Family Plan' | 'Cashback'
  reason: string
  savings: number
  tone: 'danger' | 'warning' | 'success'
  color: string
}

export const recommendations: Recommendation[] = [
  {
    id: 'r-netflix',
    merchant: 'Netflix',
    short: 'NF',
    action: 'Downgrade',
    reason: 'You stream mostly on one device. The HD plan covers your usage.',
    savings: 450,
    tone: 'warning',
    color: '#ef4444',
  },
  {
    id: 'r-spotify',
    merchant: 'Spotify',
    short: 'SP',
    action: 'Cancel',
    reason: 'Duplicate detected — you also pay for YouTube Premium (Music).',
    savings: 149,
    tone: 'danger',
    color: '#22c55e',
  },
  {
    id: 'r-adobe',
    merchant: 'Adobe CC',
    short: 'AD',
    action: 'Switch Plan',
    reason: 'You only use Photoshop & Lightroom. The Photography plan fits.',
    savings: 500,
    tone: 'warning',
    color: '#f59e0b',
  },
  {
    id: 'r-google',
    merchant: 'Google One',
    short: 'G1',
    action: 'Keep',
    reason: 'Healthy subscription — usage is high and pricing is stable.',
    savings: 0,
    tone: 'success',
    color: '#3b82f6',
  },
]

export const processingSteps = [
  'Reading transactions…',
  'Cleaning merchant names…',
  'Finding recurring subscriptions…',
  'Detecting price hikes…',
  'Calculating leak score…',
  'Generating recommendations…',
]

export const quickInsights = [
  { label: 'Highest Subscription', value: 'Adobe CC', sub: '₹1,699 / mo' },
  { label: 'Largest Price Increase', value: 'Spotify +25%', sub: '₹119 → ₹149' },
  { label: 'Most Expensive Category', value: 'Streaming', sub: '₹1,401 / mo' },
  { label: 'Upcoming Renewals', value: '3 this week', sub: 'Netflix, Adobe, Spotify' },
]

export const upcomingRenewals = [
  { when: 'Tomorrow', merchant: 'Netflix', amount: 649, tone: 'danger' as const },
  { when: 'In 3 days', merchant: 'Adobe CC', amount: 1699, tone: 'warning' as const },
  { when: 'In 5 days', merchant: 'Spotify', amount: 149, tone: 'warning' as const },
]

export type Statement = {
  id: string
  file_name: string
  file_type: 'csv' | 'pdf' | 'xlsx'
  status: 'processing' | 'completed' | 'failed'
  transactions_found: number
  subscriptions_found: number
  created_at: string
}

export const statements: Statement[] = [
  {
    id: 's-1',
    file_name: 'hdfc-statement-july.csv',
    file_type: 'csv',
    status: 'completed',
    transactions_found: 142,
    subscriptions_found: 12,
    created_at: '2026-07-02T09:14:00Z',
  },
  {
    id: 's-2',
    file_name: 'icici-statement-june.pdf',
    file_type: 'pdf',
    status: 'completed',
    transactions_found: 138,
    subscriptions_found: 11,
    created_at: '2026-06-03T11:02:00Z',
  },
  {
    id: 's-3',
    file_name: 'hdfc-statement-may.csv',
    file_type: 'csv',
    status: 'completed',
    transactions_found: 129,
    subscriptions_found: 10,
    created_at: '2026-05-04T08:41:00Z',
  },
]

export type SpendingForecast = {
  forecast_month: string
  predicted_spend: number
  predicted_savings_if_actioned: number
}

export const forecast: SpendingForecast[] = [
  { forecast_month: 'Aug 2026', predicted_spend: 2840, predicted_savings_if_actioned: 1099 },
  { forecast_month: 'Sep 2026', predicted_spend: 2900, predicted_savings_if_actioned: 1099 },
  { forecast_month: 'Oct 2026', predicted_spend: 2960, predicted_savings_if_actioned: 1099 },
  { forecast_month: 'Nov 2026', predicted_spend: 3020, predicted_savings_if_actioned: 1099 },
  { forecast_month: 'Dec 2026', predicted_spend: 3080, predicted_savings_if_actioned: 1099 },
  { forecast_month: 'Jan 2027', predicted_spend: 3140, predicted_savings_if_actioned: 1099 },
]

export function formatINR(value: number) {
  return '₹' + value.toLocaleString('en-IN')
}
