'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient, signOut as supabaseSignOut } from './supabase'

export type AuthState = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

/**
 * Tracks the current Supabase auth session client-side. Returns
 * `user: null` (not an error) when signed out — pages should keep
 * rendering with demo data in that case, matching the rest of the app.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let supabase
    try {
      supabase = getSupabaseClient()
    } catch {
      // Supabase env vars not configured yet — behave as signed out.
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setUser(data.session?.user ?? null)
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return { user, loading, signOut: supabaseSignOut }
}
