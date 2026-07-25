'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { LogoMark } from '@/components/logo'
import { processingSteps } from '@/lib/data'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function ProcessingPage() {
  return (
    <Suspense fallback={null}>
      <ProcessingPageInner />
    </Suspense>
  )
}

function ProcessingPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const statementId = searchParams.get('statementId')
  const [current, setCurrent] = useState(0)
  const [failed, setFailed] = useState<string | null>(null)

  // Real upload in progress: poll the backend for this statement's status.
  useEffect(() => {
    if (!statementId) return
    let cancelled = false

    async function poll() {
      try {
        const statements = await api.history.statements()
        const statement = statements.find((s: any) => s.id === statementId)
        if (cancelled) return

        if (statement?.status === 'completed') {
          setCurrent(processingSteps.length)
          setTimeout(() => router.push('/dashboard'), 600)
          return
        }
        if (statement?.status === 'failed') {
          setFailed(statement.error_message || 'Something went wrong while analyzing your statement.')
          return
        }
        // Still processing — advance the visual steps (capped just short of the end) and poll again.
        setCurrent((c) => Math.min(c + 1, processingSteps.length - 1))
        setTimeout(poll, 1200)
      } catch {
        if (!cancelled) setTimeout(poll, 1500)
      }
    }

    poll()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statementId])

  // Demo mode (no statementId): just animate through the steps on a timer.
  useEffect(() => {
    if (statementId) return
    if (current >= processingSteps.length) {
      const t = setTimeout(() => router.push('/dashboard'), 700)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setCurrent((c) => c + 1), 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, router, statementId])

  const progress = Math.round((current / processingSteps.length) * 100)

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <LogoMark className="size-16" />
            </motion.div>
            <h2 className="mt-5 text-xl font-bold text-foreground">
              {failed ? 'Analysis failed' : 'Analyzing your statement'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {failed ?? 'This takes just a few seconds — everything runs on your device.'}
            </p>
            {failed && (
              <button
                type="button"
                onClick={() => router.push('/upload')}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                Try uploading again
              </button>
            )}
          </div>

          {!failed && (
            <>
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.min(100, progress)}%</span>
                </div>
                <Progress
                  value={progress}
                  indicatorClassName="gradient-hero"
                />
              </div>

              <ul className="mt-6 space-y-2.5">
                {processingSteps.map((step, i) => {
                  const done = i < current
                  const active = i === current
                  return (
                    <motion.li
                      key={step}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                        done && 'border-success/30 bg-success/[0.05]',
                        active && 'border-primary/40 bg-primary/[0.05]',
                        !done && !active && 'border-border',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full',
                          done && 'bg-success text-white',
                          active && 'bg-primary/15 text-primary',
                          !done && !active && 'bg-muted text-muted-foreground',
                        )}
                      >
                        {done ? (
                          <Check className="size-3.5" />
                        ) : active ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <span className="text-[11px] font-semibold">{i + 1}</span>
                        )}
                      </span>
                      <span
                        className={cn(
                          'text-sm font-medium',
                          done || active ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {step}
                      </span>
                    </motion.li>
                  )
                })}
              </ul>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
