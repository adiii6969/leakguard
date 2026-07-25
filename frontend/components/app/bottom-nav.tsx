'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Upload, CreditCard, Sparkles, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Subs', href: '/subscriptions', icon: CreditCard },
  { label: 'Upload', href: '/upload', icon: Upload },
  { label: 'Leaks', href: '/leak-analysis', icon: Activity },
  { label: 'Tips', href: '/recommendations', icon: Sparkles },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-2 py-1.5">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          const isUpload = item.href === '/upload'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {isUpload ? (
                <span className="flex size-9 -translate-y-0.5 items-center justify-center rounded-2xl gradient-hero text-white shadow-soft">
                  <Icon className="size-[18px]" />
                </span>
              ) : (
                <Icon className="size-[18px]" />
              )}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
