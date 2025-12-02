import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const env = process.env.NEXT_PUBLIC_APP_ENV || 'dev'
  
  // Only allow in dev/staging
  if (env === 'prod') {
    return NextResponse.json(
      { error: 'Seed function not available in production' },
      { status: 403 }
    )
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Get the session token
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'No session found' },
      { status: 401 }
    )
  }

  // Call the Supabase edge function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const functionUrl = `${supabaseUrl}/functions/v1/seed_demo`

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to seed data' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to call seed function' },
      { status: 500 }
    )
  }
}

// Handle GET requests (for form submission)
export async function GET() {
  return POST()
}

