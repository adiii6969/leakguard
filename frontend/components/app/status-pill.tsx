import { Badge } from '@/components/ui/badge'
import type { Status } from '@/lib/data'

const map: Record<Status, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  healthy: { label: 'Healthy', variant: 'success' },
  warning: { label: 'Warning', variant: 'warning' },
  critical: { label: 'Critical', variant: 'danger' },
}

export function StatusPill({ status }: { status: Status }) {
  const s = map[status]
  return (
    <Badge variant={s.variant}>
      <span className="size-1.5 rounded-full bg-current" />
      {s.label}
    </Badge>
  )
}
