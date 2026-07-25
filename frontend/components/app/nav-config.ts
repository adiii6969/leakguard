import {
  LayoutDashboard,
  Upload,
  CreditCard,
  Activity,
  Sparkles,
  History,

  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
}

export const primaryNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Upload Statement', href: '/upload', icon: Upload },
  { label: 'Subscriptions', href: '/subscriptions', icon: CreditCard, badge: '12' },
  { label: 'Leak Analysis', href: '/leak-analysis', icon: Activity },
  { label: 'Recommendations', href: '/recommendations', icon: Sparkles, badge: '4' },
  { label: 'History', href: '/history', icon: History },
]
export const secondaryNav: NavItem[] = []