'use client'

import { useEffect, useState } from 'react'
import { api } from './api'
import { statements as demoStatements, forecast as demoForecast, type Statement, type SpendingForecast } from './data'

export type HistoryData = {
  statements: Statement[]
  forecast: SpendingForecast[]
  isLive: boolean
  loading: boolean
}

export function useHistoryData(): HistoryData {
  const [state, setState] = useState<HistoryData>({
    statements: demoStatements,
    forecast: demoForecast,
    isLive: false,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [statements, forecast] = await Promise.all([
          api.history.statements(),
          api.history.forecast(),
        ])
        if (!cancelled) {
          setState({
            statements,
            forecast: forecast.map((f) => ({
              ...f,
              forecast_month: new Date(f.forecast_month).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric',
              }),
            })),
            isLive: true,
            loading: false,
          })
        }
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
