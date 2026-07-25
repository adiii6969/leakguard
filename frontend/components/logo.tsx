import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-xl gradient-hero text-white shadow-soft',
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-[62%]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2.5 4.5 5.2v6.1c0 4.6 3.1 8.4 7.5 9.7 4.4-1.3 7.5-5.1 7.5-9.7V5.2L12 2.5Z"
          fill="rgba(255,255,255,0.16)"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <text
          x="12"
          y="15"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          fill="currentColor"
        >
          ₹
        </text>
      </svg>
    </div>
  )
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="size-9" />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            LeakGuard <span className="gradient-text">AI</span>
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Money Leak Detection
          </span>
        </div>
      )}
    </div>
  )
}

export function MerchantAvatar({
  short,
  color,
  className,
}: {
  short: string
  color: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white',
        className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {short}
    </div>
  )
}
