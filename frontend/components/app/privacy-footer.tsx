import { ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function PrivacyFooter() {
  return (
    <Card className="flex flex-col items-start gap-4 border-border/60 bg-muted/30 p-5 sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/12 text-success">
        <ShieldCheck className="size-5" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">Privacy summary</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Statement analyzed locally · No transaction stored · Automatically
          deleted after processing.
        </p>
      </div>
    </Card>
  )
}
