'use client'

import { useEffect, useState } from 'react'
import { api } from './api'
import { subscriptions as demoSubscriptions, type Subscription } from './data'
import { mapSubscription } from './live-mappers'

export type SubscriptionsData = {
  subscriptions: Subscription[]
  isLive: boolean
  loading: boolean
}

/**
 * Loads subscriptions from the live backend. Falls back to bundled demo
 * data if the user isn't signed in yet or the backend is unreachable, so
 * the UI keeps working for design/dev purposes.
 */
export function useSubscriptionsData(): SubscriptionsData {
  const [state, setState] = useState<SubscriptionsData>({
    subscriptions: demoSubscriptions,
    isLive: false,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const live = await api.subscriptions.list()
        if (!cancelled) {
          setState({ subscriptions: live.map(mapSubscription), isLive: true, loading: false })
        }
      } catch {
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
