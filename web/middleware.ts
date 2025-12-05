import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
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
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
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

  // Refresh session if expired and get user
  const { data: { user } } = await supabase.auth.getUser()

  const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'dev'
  if (isDev && request.nextUrl.pathname.startsWith('/auth/callback')) {
    console.log('[Middleware] Auth callback route, user:', user?.email || 'none')
  }

  // Define public routes that don't require authentication
  // These routes are accessible to all users (authenticated and unauthenticated):
  // - '/' (root): Public landing page with marketing content
  // - '/login': Authentication page
  // - '/auth/callback': OAuth callback handler
  const publicRoutes = ['/', '/login', '/auth/callback']
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith('/auth/callback')
  )

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/leagues',
    '/seasons',
    '/promotion-groups',
  ]
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Protect authenticated routes - require authentication
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    // Store the original URL for redirect after login
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from login page
  if (request.nextUrl.pathname === '/login' && user) {
    // Check if there's a redirect parameter
    const redirectTo = request.nextUrl.searchParams.get('redirect')
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect authenticated users from landing page to dashboard
  if (request.nextUrl.pathname === '/' && user) {
    if (isDev) {
      console.log('[Middleware] Authenticated user on landing page, redirecting to dashboard')
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

