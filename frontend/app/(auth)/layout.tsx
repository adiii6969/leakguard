import Image from 'next/image'
import Link from 'next/link'
import { Logo } from '@/components/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
          <div className="mt-10">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-muted/40 lg:block">
        <div className="absolute inset-0 gradient-hero opacity-[0.08]" aria-hidden />
        <Image
          src="/login-illustration.png"
          alt=""
          fill
          priority
          className="object-cover mix-blend-luminosity opacity-90"
        />
      </div>
    </div>
  )
}
