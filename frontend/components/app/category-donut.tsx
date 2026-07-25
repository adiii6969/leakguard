'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { categoryBreakdown, formatINR } from '@/lib/data'

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-soft-lg">
      <p className="font-medium text-foreground">{item.name}</p>
      <p className="mt-0.5 font-bold text-foreground">{formatINR(item.value)}</p>
    </div>
  )
}

export type CategorySlice = { name: string; value: number; color: string }

export function CategoryDonut({
  showLegend = true,
  data = categoryBreakdown,
}: {
  showLegend?: boolean
  data?: CategorySlice[]
}) {
  const total = data.reduce((s, c) => s + c.value, 0)

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={64}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-muted-foreground">
            Total / mo
          </span>
          <span className="text-xl font-bold text-foreground">
            {formatINR(total)}
          </span>
        </div>
      </div>

      {showLegend && (
        <ul className="grid w-full grid-cols-2 gap-2">
          {data.map((c) => (
            <li key={c.name} className="flex items-center gap-2 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="flex-1 truncate text-muted-foreground">{c.name}</span>
              <span className="font-semibold text-foreground">
                {formatINR(c.value)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
