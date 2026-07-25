import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/app/theme-toggle'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:px-8">
          <Link href="/" className="mr-auto">
            <Logo />
          </Link>

          <ThemeToggle />

          <Link href="/sign-in">
            <Button>
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="h-9">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-8 text-center text-xs text-muted-foreground lg:px-8">
          <p>© {new Date().getFullYear()} LeakGuard AI. Your data is analyzed privately and never sold.</p>
        </div>
      </footer>
    </div>
  )
}
