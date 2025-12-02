import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth Callback Route
 * 
 * Handles OAuth callbacks from Supabase Auth providers (Google, etc.)
 * Also handles email confirmation callbacks.
 * 
 * After successful authentication, redirects to /dashboard or to the redirectTo
 * parameter if present (for deep linking after auth).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const redirectTo = requestUrl.searchParams.get('redirect_to')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const errorUrl = new URL('/login', requestUrl.origin)
    errorUrl.searchParams.set('error', 'oauth_error')
    errorUrl.searchParams.set('message', errorDescription || error)
    return NextResponse.redirect(errorUrl)
  }

  // If code is present, exchange it for a session
  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      const errorUrl = new URL('/login', requestUrl.origin)
      errorUrl.searchParams.set('error', 'auth_error')
      errorUrl.searchParams.set('message', 'Failed to complete authentication. Please try again.')
      return NextResponse.redirect(errorUrl)
    }

    // Success! Redirect to dashboard or the specified redirect target
    const redirectPath = redirectTo || '/dashboard'
    const redirectUrl = new URL(redirectPath, requestUrl.origin)
    return NextResponse.redirect(redirectUrl)
  }

  // No code or error - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}

