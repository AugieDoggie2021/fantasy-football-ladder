'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics/track'
import { AnalyticsEvents } from '@/lib/analytics/events'

interface PageEventTrackerProps {
  event: string
  properties?: Record<string, unknown>
}

/**
 * Client component that tracks a specific event when the page loads
 * Use this for page-specific events (e.g., league viewed, draft board viewed)
 */
export function PageEventTracker({ event, properties }: PageEventTrackerProps) {
  useEffect(() => {
    track(event, properties)
  }, [event, properties])

  return null
}

