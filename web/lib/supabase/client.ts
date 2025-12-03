import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for browser/client-side usage.
 * This client respects Row Level Security (RLS) policies and user authentication.
 * 
 * Environment variables used:
 * - NEXT_PUBLIC_SUPABASE_URL (from .env.local)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY (from .env.local)
 * 
 * TODO: Future iOS app will use the same NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * values, which are safe to include in mobile app bundles.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
  )
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

