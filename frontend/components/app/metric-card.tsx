'use client'

import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { AnimatedNumber } from './animated-number'

type Tone = 'primary' | 'success' | 'danger' | 'brand'

const toneMap: Record<Tone, { icon: string; ring: string }> = {
  primary: { icon: 'bg-primary/10 text-primary', ring: 'ring-primary/20' },
  success: { icon: 'bg-success/12 text-success', ring: 'ring-success/20' },
  danger: { icon: 'bg-destructive/12 text-destructive', ring: 'ring-destructive/20' },
  brand: { icon: 'bg-brand/12 text-brand', ring: 'ring-brand/20' },
}

export function MetricCard({
  label,
  value,
  prefix,
  suffix,
  icon: Icon,
  tone = 'primary',
  delta,
  deltaLabel,
  index = 0,
}: {
  label: string
  value: number
  prefix?: string
  suffix?: string
  icon: LucideIcon
  tone?: Tone
  delta?: number
  deltaLabel?: string
  index?: number
}) {
  const positive = (delta ?? 0) >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
    >
      <Card className="group relative overflow-hidden p-5 transition-shadow hover:shadow-soft-lg">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'flex size-11 items-center justify-center rounded-xl ring-1',
              toneMap[tone].icon,
              toneMap[tone].ring,
            )}
          >
            <Icon className="size-5" />
          </div>
          {delta !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                positive
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-success/12 text-success',
              )}
            >
              {positive ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
        </p>
        {deltaLabel && (
          <p className="mt-1 text-xs text-muted-foreground">{deltaLabel}</p>
        )}
      </Card>
    </motion.div>
  )
}
