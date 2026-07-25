"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Check, Circle, TrendingDown } from "lucide-react"
import { PageHeader } from "@/components/app/page-header"
import { RecommendationCard } from "@/components/app/recommendation-card"
import { AnimatedNumber } from "@/components/app/animated-number"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatINR } from "@/lib/data"
import { useRecommendationsData } from "@/lib/use-recommendations-data"
import { cn } from "@/lib/utils"

export default function RecommendationsPage() {
  const { recommendations, isLive, updateStatus } = useRecommendationsData()
  const [done, setDone] = useState<Record<string, boolean>>({})

  const actionItems = recommendations
    .filter((r) => r.action !== "Keep")
    .map((r) => ({ id: r.id, label: `${r.action} ${r.merchant}`, saving: r.savings }))

  const savedMonthly = actionItems.reduce((sum, item) => (done[item.id] ? sum + item.saving : sum), 0)
  const completed = actionItems.filter((i) => done[i.id]).length

  const handleToggle = async (id: string) => {
    const wasDone = !!done[id]
    setDone((d) => ({ ...d, [id]: !d[id] }))
    if (!wasDone && isLive) {
      await updateStatus(id, "accepted")
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI Recommendations"
        title="Your personalized savings plan"
        description="Prioritized actions generated from your spending patterns and detected leaks."
      >
        <Badge variant={isLive ? "success" : "secondary"}>
          {isLive ? "Live data" : "Demo data"}
        </Badge>
        <Badge variant="default" className="gap-1.5">
          <Sparkles className="size-3" />
          AI generated
        </Badge>
      </PageHeader>

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No pending recommendations right now — you&apos;re all caught up.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {recommendations.map((rec, i) => (
            <RecommendationCard key={rec.id} rec={rec} index={i} />
          ))}
        </div>
      )}

      {/* Action Center */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Action Center</CardTitle>
            <Badge variant="secondary">
              {completed}/{actionItems.length} done
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionItems.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">Nothing to action yet.</p>
            )}
            {actionItems.map((item) => {
              const isDone = !!done[item.id]
              return (
                <button
                  key={item.id}
                  onClick={() => handleToggle(item.id)}
                  aria-pressed={isDone}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                    isDone
                      ? "border-success/30 bg-success/10"
                      : "border-border bg-card hover:border-primary/40 hover:bg-secondary/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
                      isDone ? "bg-success text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isDone ? <Check className="size-4" /> : <Circle className="size-3" />}
                  </span>
                  <span
                    className={cn(
                      "flex-1 font-medium",
                      isDone ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-success">+{formatINR(item.saving)}/mo</span>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden lg:col-span-1">
          <div className="absolute inset-0 gradient-hero opacity-[0.06]" aria-hidden />
          <CardContent className="relative flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-success/12 text-success">
              <TrendingDown className="size-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Live savings counter</p>
            <motion.p key={savedMonthly} className="text-4xl font-bold tracking-tight text-foreground">
              <AnimatedNumber value={savedMonthly} prefix="₹" />
              <span className="text-base font-medium text-muted-foreground">/mo</span>
            </motion.p>
            <p className="text-sm text-muted-foreground">
              {formatINR(savedMonthly * 12)} saved per year
            </p>
            <Button className="mt-2 w-full" disabled={completed === 0}>
              Apply {completed} action{completed === 1 ? "" : "s"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
