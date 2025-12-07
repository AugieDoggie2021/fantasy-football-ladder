'use client'

import posthog from 'posthog-js'
import { AnalyticsEvents, type BaseEventProperties } from './events'

/**
 * Track an analytics event
 */
export function track(event: string, properties?: BaseEventProperties) {
  if (typeof window === 'undefined') return

  try {
    posthog.capture(event, {
      ...properties,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}

/**
 * Identify a user for analytics
 */
export function identify(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  try {
    posthog.identify(userId, traits)
  } catch (error) {
    console.error('Error identifying user:', error)
  }
}

/**
 * Reset user identification (on logout)
 */
export function reset() {
  if (typeof window === 'undefined') return

  try {
    posthog.reset()
  } catch (error) {
    console.error('Error resetting analytics:', error)
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  try {
    posthog.setPersonProperties(properties)
  } catch (error) {
    console.error('Error setting user properties:', error)
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined') return

  try {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      path,
      title,
    })
  } catch (error) {
    console.error('Error tracking page view:', error)
  }
}

// Export event constants for convenience
export { AnalyticsEvents }

