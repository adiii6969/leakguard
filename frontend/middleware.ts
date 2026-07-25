import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase-server'

// Routes that require a signed-in Supabase session.
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/upload',
  '/processing',
  '/history',
  '/leak-analysis',
  '/recommendations',
  '/subscriptions',
]

// Auth routes a signed-in user shouldn't see again.
const AUTH_PREFIXES = ['/sign-in', '/sign-up']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  // If Supabase env vars aren't configured yet, don't block navigation —
  // let pages fall back to demo data instead of hard-failing every route.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response
  }

  const supabase = createMiddlewareSupabaseClient(request, response)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const isAuthPage = AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!user && isProtected) {
    const redirectUrl = new URL('/sign-in', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, and files with an extension (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
