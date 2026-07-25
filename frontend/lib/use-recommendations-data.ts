'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, ApiError, type Recommendation as ApiRecommendation, type Subscription as ApiSubscription } from './api'
import { recommendations as demoRecommendations, type Recommendation } from './data'
import { mapRecommendation } from './live-mappers'

export type RecommendationsData = {
  recommendations: Recommendation[]
  isLive: boolean
  loading: boolean
  /** Accepts or dismisses a recommendation. No-ops (and returns false) when running on demo data. */
  updateStatus: (id: string, status: 'accepted' | 'dismissed') => Promise<boolean>
}

export function useRecommendationsData(): RecommendationsData {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(demoRecommendations)
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [live, subs]: [ApiRecommendation[], ApiSubscription[]] = await Promise.all([
          api.recommendations.list('pending'),
          api.subscriptions.list(),
        ])
        if (cancelled) return
        const subsById = new Map(subs.map((s) => [s.id, s]))
        setRecommendations(live.map((r) => mapRecommendation(r, subsById.get(r.subscription_id))))
        setIsLive(true)
        setLoading(false)
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const updateStatus = useCallback(
    async (id: string, status: 'accepted' | 'dismissed') => {
      if (!isLive) return false
      try {
        await api.recommendations.updateStatus(id, status)
        setRecommendations((prev) => prev.filter((r) => r.id !== id))
        return true
      } catch (err) {
        console.error(err instanceof ApiError ? err.message : err)
        return false
      }
    },
    [isLive]
  )

  return { recommendations, isLive, loading, updateStatus }
}
