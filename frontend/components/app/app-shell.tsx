'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SidebarContent, MobileSidebar } from './sidebar'
import { Navbar } from './navbar'
import { BottomNav } from './bottom-nav'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-[width] duration-300 lg:block',
          collapsed ? 'w-[76px]' : 'w-64',
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </aside>

      {/* Mobile sidebar */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-300',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-64',
        )}
      >
        <Navbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      </div>

      <BottomNav />
    </div>
  )
}
