'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { reset, track } from '@/lib/analytics/track'
import { AnalyticsEvents } from '@/lib/analytics/events'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      // Get user ID before signing out
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id

      // Track logout event before resetting
      if (userId) {
        track(AnalyticsEvents.USER_LOGGED_OUT, {
          user_id: userId,
        })
      }

      // Reset PostHog session
      reset()

      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
        // Still redirect even if there's an error
      }
      // Redirect to login page
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Still reset PostHog even on error
      reset()
      // Still redirect on error
      router.push('/login')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  )
}

