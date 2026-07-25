import { Check, ShieldCheck, Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'

const points = [
  'Processed locally on your device',
  'No cloud storage',
  'No bank data saved',
  'Deleted after analysis',
]

export function SecurityBanner() {
  return (
    <Card className="relative overflow-hidden border-success/20 bg-success/[0.04] p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-success/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-success/12 text-success ring-1 ring-success/20">
          <ShieldCheck className="size-8" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-success" />
            <h3 className="text-lg font-bold text-foreground">
              Your statement never leaves your device.
            </h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Bank-grade privacy. We analyze everything on-device and permanently
            delete it the moment we&apos;re done.
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {points.map((p) => (
              <li
                key={p}
                className="flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="size-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
