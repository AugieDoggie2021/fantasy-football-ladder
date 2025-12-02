import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side usage with user session.
 * This client respects Row Level Security (RLS) policies and user authentication.
 * Use this for most server-side operations in Server Components, Server Actions, and API routes.
 * 
 * Environment variables used:
 * - NEXT_PUBLIC_SUPABASE_URL (from .env.local)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY (from .env.local)
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client with service role key for privileged operations.
 * WARNING: This client bypasses Row Level Security (RLS).
 * Only use this for admin operations or system-level tasks where RLS bypass is required.
 * 
 * Environment variables used:
 * - NEXT_PUBLIC_SUPABASE_URL (from .env.local)
 * - SUPABASE_SERVICE_ROLE_KEY (from .env.local - server-only, never exposed to client)
 * 
 * TODO: Future iOS app will share the same NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * but will not have access to SUPABASE_SERVICE_ROLE_KEY (server-only).
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required environment variables for service role client. ' +
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
    )
  }

  // Create a standard Supabase client with service role key
  // This bypasses RLS, so use with extreme caution
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

