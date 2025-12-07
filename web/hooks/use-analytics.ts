'use client'

import { useCallback } from 'react'
import { track, identify, reset, setUserProperties, trackPageView } from '@/lib/analytics/track'
import { AnalyticsEvents, type BaseEventProperties } from '@/lib/analytics/events'

export function useAnalytics() {
  const trackEvent = useCallback((event: string, properties?: BaseEventProperties) => {
    track(event, properties)
  }, [])

  const identifyUser = useCallback((userId: string, traits?: Record<string, unknown>) => {
    identify(userId, traits)
  }, [])

  const resetUser = useCallback(() => {
    reset()
  }, [])

  const setProperties = useCallback((properties: Record<string, unknown>) => {
    setUserProperties(properties)
  }, [])

  const trackPage = useCallback((path: string, title?: string) => {
    trackPageView(path, title)
  }, [])

  return {
    track: trackEvent,
    identify: identifyUser,
    reset: resetUser,
    setProperties,
    trackPage,
    events: AnalyticsEvents,
  }
}

