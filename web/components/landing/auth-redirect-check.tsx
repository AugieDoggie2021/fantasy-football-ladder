'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

/**
 * Client-side check to redirect authenticated users from landing page to dashboard.
 * This is a fallback in case server-side redirect doesn't work due to cookie timing issues.
 */
export function AuthRedirectCheck() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we're on the landing page (pathname === '/')
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          return // Not on landing page, don't redirect
        }

        const { data: { user }, error } = await supabase.auth.getUser()
        if (user && !error) {
          // User is authenticated, redirect to dashboard immediately
          // Use replace to prevent back button issues
          router.replace('/dashboard')
        }
      } catch (error) {
        // Silently fail - server-side redirect should handle it
        if (process.env.NEXT_PUBLIC_APP_ENV === 'dev') {
          console.error('[AuthRedirectCheck] Auth check error:', error)
        }
      }
    }

    // Check immediately and also after a short delay
    // This handles both immediate checks and cookie propagation delays
    checkAuth()
    const timeoutId = setTimeout(checkAuth, 200)
    
    return () => clearTimeout(timeoutId)
  }, [router])

  return null
}

