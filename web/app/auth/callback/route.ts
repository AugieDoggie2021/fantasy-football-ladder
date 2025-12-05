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
    // Determine redirect path first - ensure it's never the landing page
    let redirectPath = redirectTo || '/dashboard'
    // Safety check: never redirect to landing page after auth
    if (redirectPath === '/' || !redirectPath || redirectPath.trim() === '') {
      redirectPath = '/dashboard'
    }
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
    const { error: exchangeError, data: exchangeData } = await supabase.auth.exchangeCodeForSession(code)

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
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (isDev) {
      if (user) {
        console.log('[Auth Callback] Successfully authenticated user:', user.email)
        console.log('[Auth Callback] Redirecting to:', redirectPath)
        console.log('[Auth Callback] Session data:', exchangeData?.session ? 'Session exists' : 'No session')
      } else {
        console.warn('[Auth Callback] Session created but user not found')
        console.warn('[Auth Callback] User error:', userError)
      }
    }

    // If no user found, redirect to login with error
    if (!user) {
      const errorUrl = new URL('/login', requestUrl.origin)
      errorUrl.searchParams.set('error', 'session_error')
      errorUrl.searchParams.set('message', 'Session created but user not found. Please try signing in again.')
      return NextResponse.redirect(errorUrl)
    }

    // Success! Ensure we're redirecting to dashboard (never landing page)
    // Force redirectPath to dashboard if it's somehow set to landing page
    if (redirectPath === '/' || redirectPath === '' || !redirectPath) {
      redirectPath = '/dashboard'
    }
    
    // Create a new response with the correct redirect path
    const finalResponse = NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
    
    // Copy all cookies from the exchange response to the final response
    // This ensures cookies are properly set before redirect
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path || '/',
        domain: cookie.domain,
        sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
      })
    })
    
    // Add headers to prevent caching and ensure cookies are set
    finalResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    finalResponse.headers.set('Pragma', 'no-cache')
    finalResponse.headers.set('Expires', '0')
    
    return finalResponse
  }

  // No code or error - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}

