'use client'

import Link from 'next/link'
import { LogOut, Menu, Search } from 'lucide-react'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import { useAuth } from '@/lib/use-auth'
import { useRouter } from 'next/navigation'

function initialsFor(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function Navbar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    ''

  // ✅ Logout function belongs here
  const handleLogout = async () => {
    await signOut()

    router.replace('/sign-in')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      {/* ...rest of your navbar */}

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />

        {!loading && !user && (
          <Button variant="outline" size="sm" render={<Link href="/sign-in" />}>
            Sign in
          </Button>
        )}

        {!loading && user && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-border bg-card py-1 pl-1 pr-2"
            >
              <span className="flex size-7 items-center justify-center rounded-lg gradient-hero text-xs font-bold text-white">
                {initialsFor(displayName)}
              </span>

              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold">
                  {displayName}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  Signed in
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-card hover:bg-accent"
            >
              <LogOut className="size-[18px]" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}