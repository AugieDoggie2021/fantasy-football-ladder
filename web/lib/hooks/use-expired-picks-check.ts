'use client'

import { useEffect, useRef } from 'react'

interface UseExpiredPicksCheckOptions {
  enabled?: boolean
  intervalMs?: number
  onError?: (error: Error) => void
}

/**
 * Custom hook for periodically checking and processing expired draft picks
 * 
 * This replaces the server-side cron job for Vercel Hobby accounts which
 * are limited to daily cron jobs. This client-side check runs more frequently
 * when users are actively viewing the draft.
 * 
 * @param enabled - Whether to enable the expired picks check
 * @param intervalMs - How often to check (default: 10000ms = 10 seconds)
 * @param onError - Callback for errors
 */
export function useExpiredPicksCheck({
  enabled = true,
  intervalMs = 10000, // Check every 10 seconds
  onError,
}: UseExpiredPicksCheckOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isCheckingRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const checkExpiredPicks = async () => {
      // Prevent concurrent checks
      if (isCheckingRef.current) {
        return
      }

      isCheckingRef.current = true

      try {
        // Call the API endpoint to check and process expired picks
        const response = await fetch('/api/draft/check-expired-picks', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          // Don't throw on 401 - might be missing auth token, which is fine
          if (response.status === 401) {
            // Silently fail if unauthorized (endpoint might require auth token)
            return
          }
          throw new Error(`Failed to check expired picks: ${response.statusText}`)
        }

        const data = await response.json()
        
        // Log if picks were processed (for debugging)
        if (process.env.NODE_ENV === 'development' && data.data?.processed > 0) {
          console.log(`Processed ${data.data.processed} expired pick(s)`)
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to check expired picks')
        
        // Only call onError for non-401 errors
        if (!(error instanceof Error && error.message.includes('401'))) {
          onError?.(err)
        }
        
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error checking expired picks:', err)
        }
      } finally {
        isCheckingRef.current = false
      }
    }

    // Initial check
    checkExpiredPicks()

    // Set up interval
    intervalRef.current = setInterval(checkExpiredPicks, intervalMs)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, intervalMs, onError])
}
