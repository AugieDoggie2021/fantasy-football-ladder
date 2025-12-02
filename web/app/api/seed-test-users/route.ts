import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const env = process.env.NEXT_PUBLIC_APP_ENV || 'dev'
  if (env === 'prod') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Supabase configuration missing' },
      { status: 500 }
    )
  }

  // Get user's session token
  const { data: { session } } = await supabase.auth.getSession()

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/seed_test_users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
          apikey: supabaseAnonKey,
        },
      }
    )

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to seed test users' },
      { status: 500 }
    )
  }
}

