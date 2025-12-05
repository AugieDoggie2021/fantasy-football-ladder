import { createServerClient, type CookieOptions } from '@supabase/ssr'
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
  const redirectTo = requestUrl.searchParams.get('redirect_to') || requestUrl.searchParams.get('redirect')
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'dev'

  // Handle OAuth errors
  if (error) {
    if (isDev) {
      console.error('[Auth Callback] OAuth error:', error, errorDescription)
    }
    const errorUrl = new URL('/login', requestUrl.origin)
    errorUrl.searchParams.set('error', 'oauth_error')
    errorUrl.searchParams.set('message', errorDescription || error)
    return NextResponse.redirect(errorUrl)
  }

  // If code is present, exchange it for a session
  if (code) {
    // Determine redirect path first
    const redirectPath = redirectTo || '/dashboard'
    let response = NextResponse.redirect(new URL(redirectPath, requestUrl.origin))

    // Create Supabase client with proper cookie handling for route handlers
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Exchange the code for a session (this will set cookies via the handlers above)
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      if (isDev) {
        console.error('[Auth Callback] Error exchanging code for session:', exchangeError.message)
      }
      const errorUrl = new URL('/login', requestUrl.origin)
      errorUrl.searchParams.set('error', 'auth_error')
      errorUrl.searchParams.set('message', 'Failed to complete authentication. Please try again.')
      return NextResponse.redirect(errorUrl)
    }

    // Verify session was created successfully
    const { data: { user } } = await supabase.auth.getUser()
    
    if (isDev) {
      if (user) {
        console.log('[Auth Callback] Successfully authenticated user:', user.email)
        console.log('[Auth Callback] Redirecting to:', redirectPath)
      } else {
        console.warn('[Auth Callback] Session created but user not found')
      }
    }

    // Success! Return response with cookies set
    return response
  }

  // No code or error - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}

