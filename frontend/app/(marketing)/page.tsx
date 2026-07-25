'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  Upload,
  TrendingUp,
  Bell,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SecurityBanner } from '@/components/app/security-banner'
import { formatINR } from '@/lib/data'
import { useAuth } from '@/lib/use-auth'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' as const },
  }),
}

const features = [
  {
    icon: Bell,
    title: 'Forgotten subscriptions',
    desc: 'Surface every recurring charge you forgot you were paying for.',
  },
  {
    icon: TrendingUp,
    title: 'Silent price hikes',
    desc: 'Get alerted when a service quietly raises its monthly price.',
  },
  {
    icon: Zap,
    title: 'Duplicate services',
    desc: 'Find overlapping streaming and app subscriptions instantly.',
  },
]

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [loading, user, router])

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 lg:px-8">
      {/* Hero */}
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <motion.span
            initial="hidden"
            animate="show"
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft"
          >
            <Sparkles className="size-3.5 text-primary" />
            AI-powered money leak detection
          </motion.span>

          <motion.h1
            initial="hidden"
            animate="show"
            custom={1}
            variants={fadeUp}
            className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl"
          >
            Stop Losing Money <span className="gradient-text">Every Month.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            custom={2}
            variants={fadeUp}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg"
          >
            Upload your bank statement securely. Detect forgotten subscriptions,
            find silent price hikes, and save thousands every year — with total
            privacy.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            custom={3}
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link href="/sign-up">
              <Button
                size="lg"
                className="h-12 px-6 text-sm"
              >
                <Upload className="size-4" />
                Get Started Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 text-sm"
              >
                Sign in
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            custom={4}
            variants={fadeUp}
            className="mt-8 flex items-center gap-6"
          >
            <div>
              <p className="text-2xl font-bold text-foreground">₹14,560</p>
              <p className="text-xs text-muted-foreground">Avg. yearly savings</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground">100%</p>
              <p className="text-xs text-muted-foreground">On-device & private</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground">60s</p>
              <p className="text-xs text-muted-foreground">To full analysis</p>
            </div>
          </motion.div>
        </div>

        {/* Illustration + floating cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border gradient-hero shadow-soft-lg">
            <Image
              src="/hero-illustration.png"
              alt="LeakGuard AI analyzing subscriptions"
              width={720}
              height={560}
              priority
              className="h-full w-full object-cover mix-blend-luminosity opacity-90"
            />
          </div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-3 top-10 hidden sm:block"
          >
            <Card className="glass w-48 p-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-destructive/12 text-destructive">
                  <TrendingUp className="size-4" />
                </span>
                <div>
                  <p className="text-[11px] text-muted-foreground">Price hike</p>
                  <p className="text-sm font-bold text-foreground">Spotify +25%</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-3 bottom-10 hidden sm:block"
          >
            <Card className="glass w-52 p-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-success/12 text-success">
                  <ShieldCheck className="size-4" />
                </span>
                <div>
                  <p className="text-[11px] text-muted-foreground">Potential savings</p>
                  <p className="text-sm font-bold text-foreground">
                    {formatINR(14560)}/yr
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        {features.map((f, i) => {
          const Icon = f.icon
          return (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
            >
              <Card className="h-full p-6 transition-shadow hover:shadow-soft-lg">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </Card>
            </motion.div>
          )
        })}
      </section>

      {/* Trust */}
      <SecurityBanner />
    </div>
  )
}
