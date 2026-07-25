import { Card } from '@/components/ui/card'
import { upcomingRenewals, formatINR } from '@/lib/data'
import { cn } from '@/lib/utils'

const dot = {
  danger: 'bg-destructive',
  warning: 'bg-warning',
  success: 'bg-success',
}

export function UpcomingRenewals() {
  return (
    <Card className="p-5">
      <h3 className="font-semibold text-foreground">Upcoming Renewals</h3>
      <ol className="relative mt-4 space-y-4 border-l border-border pl-5">
        {upcomingRenewals.map((r) => (
          <li key={r.merchant} className="relative">
            <span
              className={cn(
                'absolute -left-[26px] top-1 size-3 rounded-full ring-4 ring-card',
                dot[r.tone],
              )}
            />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{r.merchant}</p>
                <p className="text-xs text-muted-foreground">{r.when}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {formatINR(r.amount)}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
