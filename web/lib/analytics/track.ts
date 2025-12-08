'use client'

import posthog from 'posthog-js'
import { AnalyticsEvents, type BaseEventProperties } from './events'

/**
 * Check if PostHog is initialized and ready
 */
function isPostHogReady(): boolean {
  if (typeof window === 'undefined') return false
  return !!(posthog && posthog.__loaded)
}

/**
 * Track an analytics event
 */
export function track(event: string, properties?: BaseEventProperties) {
  if (typeof window === 'undefined') return

  if (!isPostHogReady()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('PostHog not initialized. Event not tracked:', event)
    }
    return
  }

  try {
    posthog.capture(event, {
      ...properties,
      timestamp: new Date().toISOString(),
    })
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ PostHog event tracked:', event, properties)
    }
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}

/**
 * Identify a user for analytics
 */
export function identify(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  if (!isPostHogReady()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('PostHog not initialized. User not identified:', userId)
    }
    return
  }

  try {
    posthog.identify(userId, traits)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ PostHog user identified:', userId)
    }
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

  if (!isPostHogReady()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('PostHog not initialized. Page view not tracked:', path)
    }
    return
  }

  try {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      path,
      title,
    })
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ PostHog page view tracked:', path)
    }
  } catch (error) {
    console.error('Error tracking page view:', error)
  }
}

// Export event constants for convenience
export { AnalyticsEvents }

