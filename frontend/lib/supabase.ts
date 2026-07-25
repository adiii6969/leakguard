import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
console.log("Supabase URL exists:", !!supabaseUrl)
console.log("Supabase key exists:", !!supabaseAnonKey)
let client: SupabaseClient | null = null

/**
 * Singleton browser Supabase client. Uses `createBrowserClient` from
 * `@supabase/ssr` so the session is stored in cookies (not just
 * localStorage) — this lets `middleware.ts` read the session on the
 * server and gate protected routes before the page ever renders.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.'
      )
    }
    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}

/** Returns the current session's access token, or null if signed out. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await getSupabaseClient().auth.getSession()
  return data.session?.access_token ?? null
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithPassword(email: string, password: string, fullName?: string) {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut()
  if (error) throw error
}
