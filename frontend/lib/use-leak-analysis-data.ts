'use client'

import { useEffect, useState } from 'react'
import { api } from './api'
import { metrics as demoMetrics, categoryBreakdown as demoCategoryBreakdown, priceHikes as demoPriceHikes } from './data'
import { colorForMerchant, shortForMerchant } from './live-mappers'
import type { CategorySlice } from '@/components/app/category-donut'

export type PriceHike = { merchant: string; from: number; to: number; pct: number; date: string }
export type DuplicateGroup = { short: string; name: string; color: string }

export type LeakAnalysisData = {
  leakScore: number
  categories: CategorySlice[]
  priceHikes: PriceHike[]
  duplicates: DuplicateGroup[]
  isLive: boolean
  loading: boolean
}

const CATEGORY_COLORS: Record<string, string> = {}

function colorForCategory(name: string): string {
  return CATEGORY_COLORS[name] ?? colorForMerchant(name)
}

export function useLeakAnalysisData(): LeakAnalysisData {
  const [state, setState] = useState<LeakAnalysisData>({
    leakScore: demoMetrics.leakScore,
    categories: demoCategoryBreakdown,
    priceHikes: demoPriceHikes,
    duplicates: [],
    isLive: false,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [summary, categories, subs] = await Promise.all([
          api.dashboard.summary(),
          api.dashboard.categories(),
          api.subscriptions.list(),
        ])
        if (cancelled) return

        const priceHikes: PriceHike[] = subs
          .filter((s) => s.price_hike_detected)
          .map((s) => ({
            merchant: s.merchant_name,
            from: s.previous_amount ?? s.amount,
            to: s.amount,
            pct: Math.round(s.price_hike_pct ?? 0),
            date: new Date(s.last_charged).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          }))

        const duplicates: DuplicateGroup[] = subs
          .filter((s) => s.is_duplicate)
          .map((s) => ({
            short: shortForMerchant(s.merchant_name),
            name: s.merchant_name,
            color: colorForMerchant(s.merchant_name),
          }))

        setState({
          leakScore: Math.round(summary.leak_score),
          categories: categories.map((c) => ({
            name: c.category,
            value: c.total_amount,
            color: colorForCategory(c.category),
          })),
          priceHikes,
          duplicates,
          isLive: true,
          loading: false,
        })
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }))
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
