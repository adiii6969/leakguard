'use client'

import { useEffect, useState } from 'react'
import { api, type DashboardSummary, type CategoryBreakdown, type Subscription } from './api'
import { metrics as demoMetrics, subscriptions as demoSubscriptions } from './data'

export type DashboardData = {
  summary: DashboardSummary
  categories: CategoryBreakdown[]
  renewals: Subscription[]
  insights: string[]
  isLive: boolean
  loading: boolean
}

const demoSummary: DashboardSummary = {
  monthly_spend: demoMetrics.monthlySpend,
  yearly_spend: demoMetrics.monthlySpend * 12,
  potential_savings: demoMetrics.potentialSavings,
  leak_score: demoMetrics.leakScore,
  active_subscriptions: demoMetrics.recurringCount,
  duplicate_count: 0,
  price_hike_count: 0,
  unused_count: 0,
}

/**
 * Loads dashboard data from the live backend. If the user isn't
 * authenticated yet or the backend is unreachable (e.g. local dev
 * without the API running), falls back to bundled demo data so the
 * UI keeps working for design/dev purposes.
 */
export function useDashboardData(): DashboardData {
  const [state, setState] = useState<DashboardData>({
    summary: demoSummary,
    categories: [],
    renewals: [],
    insights: [],
    isLive: false,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [summary, categories, renewals, insights] = await Promise.all([
          api.dashboard.summary(),
          api.dashboard.categories(),
          api.dashboard.renewals(),
          api.dashboard.quickInsights(),
        ])
        if (!cancelled) {
          setState({ summary, categories, renewals, insights, isLive: true, loading: false })
        }
      } catch {
        // Not signed in yet, or backend unreachable — keep demo data.
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false }))
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
