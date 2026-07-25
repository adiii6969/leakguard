import { ArrowUpRight, Crown, Layers, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { quickInsights } from '@/lib/data'

const icons = [Crown, TrendingUp, Layers, ArrowUpRight]

export function QuickInsights() {
  return (
    <Card className="p-5">
      <h3 className="font-semibold text-foreground">Quick Insights</h3>
      <ul className="mt-4 space-y-3">
        {quickInsights.map((insight, i) => {
          const Icon = icons[i % icons.length]
          return (
            <li
              key={insight.label}
              className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/40"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {insight.label}
                </p>
                <p className="truncate text-sm font-semibold text-foreground">
                  {insight.value}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{insight.sub}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
