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
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // User is authenticated, redirect to dashboard
          router.replace('/dashboard')
        }
      } catch (error) {
        // Silently fail - server-side redirect should handle it
        console.error('Auth check error:', error)
      }
    }

    // Small delay to allow server-side redirect to happen first
    const timeoutId = setTimeout(checkAuth, 100)
    
    return () => clearTimeout(timeoutId)
  }, [router])

  return null
}

