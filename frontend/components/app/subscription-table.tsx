'use client'

import { motion } from 'framer-motion'
import { MoreHorizontal, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { MerchantAvatar } from '@/components/logo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusPill } from './status-pill'
import { subscriptions, formatINR, type Subscription } from '@/lib/data'
import { cn } from '@/lib/utils'

function Trend({ value }: { value: number }) {
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Minus className="size-3.5" /> Stable
      </span>
    )
  const up = value > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold',
        up ? 'text-destructive' : 'text-success',
      )}
    >
      {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
      {up ? '+' : ''}
      {value}%
    </span>
  )
}

function LeakBar({ score }: { score: number }) {
  const color =
    score <= 30 ? 'bg-success' : score <= 70 ? 'bg-warning' : 'bg-destructive'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground">{score}</span>
    </div>
  )
}

export function SubscriptionTable({
  data = subscriptions,
  title = 'Your Subscriptions',
}: {
  data?: Subscription[]
  title?: string
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {data.length} recurring payments detected
          </p>
        </div>
        <Button variant="outline" size="sm">
          Export
        </Button>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
              <th className="px-5 py-3 font-medium">Merchant</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Plan</th>
              <th className="px-3 py-3 font-medium">Amount</th>
              <th className="px-3 py-3 font-medium">Renewal</th>
              <th className="px-3 py-3 font-medium">Trend</th>
              <th className="px-3 py-3 font-medium">Leak</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.map((s, i) => (
              <motion.tr
                key={s.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <MerchantAvatar short={s.short} color={s.color} />
                    <span className="font-medium text-foreground">{s.merchant}</span>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-muted-foreground">{s.category}</td>
                <td className="px-3 py-3.5 text-muted-foreground">{s.plan}</td>
                <td className="px-3 py-3.5 font-semibold text-foreground">
                  {formatINR(s.amount)}
                </td>
                <td className="px-3 py-3.5 text-muted-foreground">{s.renewal}</td>
                <td className="px-3 py-3.5">
                  <Trend value={s.trend} />
                </td>
                <td className="px-3 py-3.5">
                  <LeakBar score={s.leakScore} />
                </td>
                <td className="px-3 py-3.5">
                  <StatusPill status={s.status} />
                </td>

              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-border md:hidden">
        {data.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-4">
            <MerchantAvatar short={s.short} color={s.color} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-foreground">
                  {s.merchant}
                </span>
                <span className="font-semibold text-foreground">
                  {formatINR(s.amount)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {s.category} · {s.renewal}
                </span>
                <StatusPill status={s.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
