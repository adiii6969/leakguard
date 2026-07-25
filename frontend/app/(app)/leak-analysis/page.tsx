"use client"

import { motion } from "framer-motion"
import { TrendingUp, AlertTriangle, Layers, ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/app/page-header"
import { LeakGauge } from "@/components/app/leak-gauge"
import { CategoryDonut } from "@/components/app/category-donut"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MerchantAvatar } from "@/components/logo"
import { formatINR } from "@/lib/data"
import { useLeakAnalysisData } from "@/lib/use-leak-analysis-data"
import { colorForMerchant, shortForMerchant } from "@/lib/live-mappers"

function scoreLabel(score: number) {
  if (score <= 30) return "healthy"
  if (score <= 70) return "in need of review"
  return "critical"
}

export default function LeakAnalysisPage() {
  const { leakScore, categories, priceHikes, duplicates, isLive } = useLeakAnalysisData()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Leak Analysis"
        title="Where your money is quietly leaking"
        description="We traced silent price hikes, duplicate services, and overlapping plans across your statement."
      >
        <Badge variant={isLive ? "success" : "secondary"}>
          {isLive ? "Live data" : "Demo data"}
        </Badge>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leak score panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Leak Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <LeakGauge score={leakScore} />
            <div className="w-full space-y-2 text-sm">
              <ScoreRow range="0 – 30" label="Healthy" tone="bg-success" />
              <ScoreRow range="31 – 70" label="Review" tone="bg-warning" />
              <ScoreRow range="71 – 100" label="Critical" tone="bg-destructive" />
            </div>
            <p className="text-pretty text-center text-sm leading-relaxed text-muted-foreground">
              Your score is <span className="font-semibold text-foreground">{scoreLabel(leakScore)}</span>
              {priceHikes.length > 0 || duplicates.length > 0
                ? ` — driven by ${priceHikes.length} price hike${priceHikes.length === 1 ? "" : "s"} and ${duplicates.length} duplicate service${duplicates.length === 1 ? "" : "s"}.`
                : "."}
            </p>
          </CardContent>
        </Card>

        {/* Price hike timeline */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-warning" />
              Silent Price Hikes
            </CardTitle>
            <Badge variant="warning">{priceHikes.length} detected</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {priceHikes.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No silent price hikes detected yet.
              </p>
            )}
            {priceHikes.map((h, i) => (
              <motion.div
                key={h.merchant}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/40 p-4"
              >
                <MerchantAvatar
                  short={shortForMerchant(h.merchant)}
                  color={colorForMerchant(h.merchant)}
                  className="size-11"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{h.merchant}</p>
                  <p className="text-xs text-muted-foreground">{h.date}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground line-through">{formatINR(h.from)}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{formatINR(h.to)}</span>
                </div>
                <Badge variant="warning" className="shrink-0">
                  +{h.pct}%
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Duplicate services */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              Duplicate Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {duplicates.length > 0 ? (
              <>
                <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
                  <div>
                    <p className="font-semibold text-foreground">Overlapping services detected</p>
                    <p className="text-sm text-muted-foreground">
                      You&apos;re paying for {duplicates.length} overlapping subscriptions in the same category.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {duplicates.map((d) => (
                    <div
                      key={d.name}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-border p-4 text-center"
                    >
                      <MerchantAvatar short={d.short} color={d.color} className="size-12" />
                      <p className="text-sm font-medium text-foreground">{d.name}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No duplicate services detected yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Category analytics */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Category Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonut data={categories} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ScoreRow({ range, label, tone }: { range: string; label: string; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
      <span className="flex items-center gap-2 font-medium text-foreground">
        <span className={`size-2.5 rounded-full ${tone}`} />
        {label}
      </span>
      <span className="text-muted-foreground">{range}</span>
    </div>
  )
}
