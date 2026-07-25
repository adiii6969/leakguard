'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

function scoreMeta(score: number) {
  if (score <= 30)
    return { label: 'Healthy', color: '#22c55e', text: 'text-success' }
  if (score <= 70)
    return { label: 'Review', color: '#f59e0b', text: 'text-warning' }
  return { label: 'Critical', color: '#ef4444', text: 'text-destructive' }
}

export function LeakGauge({
  score,
  size = 200,
  strokeWidth = 16,
  showLabel = true,
}: {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}) {
  const meta = scoreMeta(score)
  const radius = (size - strokeWidth) / 2
  // 270-degree arc
  const circumference = 2 * Math.PI * radius
  const arcFraction = 0.75
  const arcLength = circumference * arcFraction
  const progress = (score / 100) * arcLength

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-[225deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={meta.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: arcLength - progress }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tracking-tight text-foreground">
            {score}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            out of 100
          </span>
          {showLabel && (
            <span
              className={cn(
                'mt-2 rounded-full px-3 py-1 text-xs font-semibold',
                meta.text,
              )}
              style={{ backgroundColor: `${meta.color}1f` }}
            >
              {meta.label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export { scoreMeta }
