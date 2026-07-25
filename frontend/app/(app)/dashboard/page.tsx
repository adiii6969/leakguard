'use client'

import Link from 'next/link'
import { CreditCard, PiggyBank, Activity, Layers, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/app/page-header'
import { MetricCard } from '@/components/app/metric-card'
import { LeakGauge, scoreMeta } from '@/components/app/leak-gauge'
import { SpendChart } from '@/components/app/spend-chart'
import { CategoryDonut } from '@/components/app/category-donut'
import { SubscriptionTable } from '@/components/app/subscription-table'
import { QuickInsights } from '@/components/app/quick-insights'
import { UpcomingRenewals } from '@/components/app/upcoming-renewals'
import { PrivacyFooter } from '@/components/app/privacy-footer'
import { useDashboardData } from '@/lib/use-dashboard-data'

export default function DashboardPage() {
  const { summary, insights, isLive } = useDashboardData()
  const metrics = {
    monthlySpend: summary.monthly_spend,
    potentialSavings: summary.potential_savings,
    leakScore: summary.leak_score,
    recurringCount: summary.active_subscriptions,
  }
  const meta = scoreMeta(metrics.leakScore)
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 lg:px-8">
      <PageHeader
        title="Welcome back, Aarav"
        description="Here's a snapshot of your recurring spend and where your money is leaking this month."
      >
        <Button variant="outline" render={<Link href="/upload" />}>
          Upload new
        </Button>
        <Button render={<Link href="/recommendations" />}>
          View savings
          <ArrowRight className="size-4" />
        </Button>
      </PageHeader>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          label="Monthly subscription spend"
          value={metrics.monthlySpend}
          prefix="₹"
          icon={CreditCard}
          tone="primary"
          delta={9}
          deltaLabel="vs. last month"
        />
        <MetricCard
          index={1}
          label="Potential savings"
          value={metrics.potentialSavings}
          prefix="₹"
          suffix="/yr"
          icon={PiggyBank}
          tone="success"
          delta={-18}
          deltaLabel="if you act on tips"
        />
        <MetricCard
          index={2}
          label="Leak score"
          value={metrics.leakScore}
          suffix="/100"
          icon={Activity}
          tone="danger"
          deltaLabel="Critical — needs review"
        />
        <MetricCard
          index={3}
          label="Recurring subscriptions"
          value={metrics.recurringCount}
          icon={Layers}
          tone="brand"
          deltaLabel="4 flagged as leaks"
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: leak gauge */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Leak Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <LeakGauge score={metrics.leakScore} />
            <p className="mt-5 text-center text-sm leading-relaxed text-muted-foreground">
              Your score is{' '}
              <span className="font-semibold" style={{ color: meta.color }}>
                {meta.label}
              </span>
              . Driven by 2 recent price hikes and 3 overlapping streaming
              services.
            </p>
          </CardContent>
        </Card>

        {/* Center: spend chart */}
        <Card className="lg:col-span-5">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Subscription Spending</CardTitle>
              <p className="text-sm text-muted-foreground">Last 7 months</p>
            </div>
          </CardHeader>
          <CardContent>
            <SpendChart />
          </CardContent>
        </Card>

        {/* Right: category donut */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonut showLegend={false} />
          </CardContent>
        </Card>
      </div>

      {/* Table + right rail */}
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <SubscriptionTable />
          <PrivacyFooter />
        </div>
        <aside className="space-y-6 xl:col-span-4">
          <QuickInsights />
          <UpcomingRenewals />
        </aside>
      </div>
    </div>
  )
}
