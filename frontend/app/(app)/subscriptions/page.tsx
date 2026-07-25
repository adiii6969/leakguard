"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Filter, Wallet, TrendingUp, Repeat } from "lucide-react"
import { PageHeader } from "@/components/app/page-header"
import { MetricCard } from "@/components/app/metric-card"
import { SubscriptionTable } from "@/components/app/subscription-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatINR } from "@/lib/data"
import { useSubscriptionsData } from "@/lib/use-subscriptions-data"

const filters = ["All", "Healthy", "Warning", "Critical"] as const

export default function SubscriptionsPage() {
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<(typeof filters)[number]>("All")
  const { subscriptions, isLive } = useSubscriptionsData()

  const filtered = subscriptions.filter((s) => {
    const matchesQuery = s.merchant.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = active === "All" || s.status === active.toLowerCase()
    return matchesQuery && matchesFilter
  })

  const monthlyTotal = subscriptions.reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Subscriptions"
        title="All your recurring payments"
        description="Every subscription we detected from your statement, ranked by leak risk."
      >
        <Badge variant={isLive ? "success" : "secondary"}>
          {isLive ? "Live data" : "Demo data"}
        </Badge>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Active Subscriptions"
          value={subscriptions.length}
          icon={Repeat}
          tone="primary"
          index={0}
        />
        <MetricCard
          label="Monthly Spend"
          value={monthlyTotal}
          prefix="₹"
          icon={Wallet}
          tone="brand"
          index={1}
        />
        <MetricCard
          label="At Risk"
          value={subscriptions.filter((s) => s.status !== "healthy").length}
          icon={TrendingUp}
          tone="danger"
          index={2}
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search merchants..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              aria-label="Search subscriptions"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
            {filters.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={active === f ? "default" : "outline"}
                onClick={() => setActive(f)}
                className="rounded-full"
              >
                {f}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {filtered.length > 0 ? (
          <SubscriptionTable data={filtered} />
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No subscriptions match &quot;{query}&quot;.
            </CardContent>
          </Card>
        )}
      </motion.div>

      <p className="text-center text-sm text-muted-foreground">
        Showing {filtered.length} of {subscriptions.length} subscriptions · {formatINR(monthlyTotal)}/mo total
      </p>
    </div>
  )
}
