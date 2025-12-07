'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkConsent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        // Check if user has set analytics consent
        const { data: profile } = await supabase
          .from('users')
          .select('analytics_consent')
          .eq('id', user.id)
          .single()

        // Show banner if consent hasn't been set
        if (profile && profile.analytics_consent === null) {
          setShowBanner(true)
        }
      } catch (error) {
        console.error('Error checking consent:', error)
      } finally {
        setLoading(false)
      }
    }

    checkConsent()
  }, [])

  const handleAccept = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      await supabase
        .from('users')
        .update({ analytics_consent: true, analytics_consent_at: new Date().toISOString() })
        .eq('id', user.id)

      setShowBanner(false)
    } catch (error) {
      console.error('Error saving consent:', error)
    }
  }

  const handleDecline = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      await supabase
        .from('users')
        .update({ analytics_consent: false, analytics_consent_at: new Date().toISOString() })
        .eq('id', user.id)

      setShowBanner(false)
    } catch (error) {
      console.error('Error saving consent:', error)
    }
  }

  if (loading || !showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 dark:bg-gray-800 border-t border-gray-700 p-4 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-white">
            We use analytics to improve your experience. Do you consent to analytics tracking?
          </p>
          <p className="text-xs text-gray-400 mt-1">
            You can change this preference anytime in your settings.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 rounded-md hover:bg-gray-700"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

