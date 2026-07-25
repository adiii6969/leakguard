'use client'

import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FileText, FileSpreadsheet, Files, TrendingUp, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { MetricCard } from '@/components/app/metric-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatINR } from '@/lib/data'
import { useHistoryData } from '@/lib/use-history-data'

function ForecastTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-soft-lg">
      <p className="font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-foreground">
        {formatINR(payload[0].value)} predicted spend
      </p>
    </div>
  )
}

const statusMeta = {
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle2 },
  processing: { label: 'Processing', variant: 'warning' as const, icon: Clock },
  failed: { label: 'Failed', variant: 'danger' as const, icon: XCircle },
}

export default function HistoryPage() {
  const { statements, forecast, isLive } = useHistoryData()

  const totalTransactions = statements.reduce((sum, s) => sum + s.transactions_found, 0)
  const totalSubscriptionsFound = statements.reduce((sum, s) => sum + s.subscriptions_found, 0)
  const nextMonthSavings = forecast[0]?.predicted_savings_if_actioned ?? 0

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="History"
        title="Statements & spending forecast"
        description="Every statement you've uploaded, and where your subscription spend is headed if nothing changes."
      >
        <Badge variant={isLive ? 'success' : 'secondary'}>
          {isLive ? 'Live data' : 'Demo data'}
        </Badge>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Statements analyzed"
          value={statements.length}
          icon={Files}
          tone="primary"
          index={0}
        />
        <MetricCard
          label="Transactions processed"
          value={totalTransactions}
          icon={FileSpreadsheet}
          tone="brand"
          index={1}
        />
        <MetricCard
          label="Savings possible next month"
          value={nextMonthSavings}
          prefix="₹"
          icon={TrendingUp}
          tone="success"
          index={2}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spending Forecast</CardTitle>
          <p className="text-sm text-muted-foreground">
            Projected monthly spend if your current subscriptions continue unchanged
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={forecast} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="forecast_month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip content={<ForecastTooltip />} cursor={{ stroke: 'var(--border)' }} />
              <Area
                type="monotone"
                dataKey="predicted_spend"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fill="url(#forecastFill)"
                dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-semibold text-foreground">Uploaded Statements</h3>
            <p className="text-xs text-muted-foreground">
              {statements.length} statement{statements.length === 1 ? '' : 's'} uploaded so far
            </p>
          </div>
        </div>

        {statements.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">
            You haven&apos;t uploaded a statement yet.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                    <th className="px-5 py-3 font-medium">File</th>
                    <th className="px-3 py-3 font-medium">Uploaded</th>
                    <th className="px-3 py-3 font-medium">Transactions</th>
                    <th className="px-3 py-3 font-medium">Subscriptions found</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {statements.map((s, i) => {
                    const meta = statusMeta[s.status]
                    const StatusIcon = meta.icon
                    return (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              <FileText className="size-4" />
                            </span>
                            <span className="font-medium text-foreground">{s.file_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-3 py-3.5 font-semibold text-foreground">
                          {s.transactions_found}
                        </td>
                        <td className="px-3 py-3.5 font-semibold text-foreground">
                          {s.subscriptions_found}
                        </td>
                        <td className="px-3 py-3.5">
                          <Badge variant={meta.variant}>
                            <StatusIcon className="size-3" />
                            {meta.label}
                          </Badge>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {statements.map((s) => {
                const meta = statusMeta[s.status]
                return (
                  <div key={s.id} className="flex items-center gap-3 p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium text-foreground">{s.file_name}</span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.transactions_found} transactions · {s.subscriptions_found} subscriptions found
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
