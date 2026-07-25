'use client'

import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  XCircle,
  Users,
  Wallet,
  Repeat,
} from 'lucide-react'
import { MerchantAvatar } from '@/components/logo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatINR, type Recommendation } from '@/lib/data'
import { cn } from '@/lib/utils'

const actionMeta: Record<string, { icon: typeof ChevronDown; cls: string }> = {
  Downgrade: { icon: ChevronDown, cls: 'bg-warning/12 text-warning' },
  Cancel: { icon: XCircle, cls: 'bg-destructive/12 text-destructive' },
  'Switch Plan': { icon: RefreshCw, cls: 'bg-primary/10 text-primary' },
  Keep: { icon: CheckCircle2, cls: 'bg-success/12 text-success' },
  Alternative: { icon: RefreshCw, cls: 'bg-primary/10 text-primary' },
  'Family Plan': { icon: Users, cls: 'bg-primary/10 text-primary' },
  Cashback: { icon: Wallet, cls: 'bg-success/12 text-success' },
}
const fallbackMeta = { icon: Repeat, cls: 'bg-muted text-muted-foreground' }

export function RecommendationCard({
  rec,
  index = 0,
}: {
  rec: Recommendation
  index?: number
}) {
  const meta = actionMeta[rec.action] ?? fallbackMeta
  const Icon = meta.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-soft-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MerchantAvatar short={rec.short} color={rec.color} />
            <div>
              <p className="font-semibold text-foreground">{rec.merchant}</p>
              <span
                className={cn(
                  'mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  meta.cls,
                )}
              >
                <Icon className="size-3" />
                {rec.action}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
          {rec.reason}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          {rec.savings > 0 ? (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Potential saving
              </p>
              <p className="text-lg font-bold text-success">
                {formatINR(rec.savings)}
                <span className="text-xs font-medium text-muted-foreground">/mo</span>
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Status</p>
              <p className="text-sm font-semibold text-success">No action needed</p>
            </div>
          )}
          <Button
            variant={rec.action === 'Keep' ? 'outline' : 'default'}
            size="sm"
          >
            {rec.action === 'Keep' ? 'Details' : rec.action}
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
