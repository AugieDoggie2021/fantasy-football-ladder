'use client'

import posthog, { PostHog } from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

/**
 * Get PostHog configuration from environment variables
 */
function getPostHogConfig() {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
  return { posthogKey, posthogHost }
}

/**
 * Create a PostHog client instance
 * This should only be called on the client side
 */
export function createPostHogClient(): PostHog | null {
  if (typeof window === 'undefined') return null

  const { posthogKey, posthogHost } = getPostHogConfig()

  if (!posthogKey) {
    console.warn(
      '⚠️ PostHog key not found. Analytics will be disabled.\n' +
      'Please add NEXT_PUBLIC_POSTHOG_KEY to your .env.local file.\n' +
      'Get your key from: https://app.posthog.com → Project Settings → API Keys'
    )
    return null
  }

  // Log initialization details in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Initializing PostHog:', {
      key: posthogKey.substring(0, 10) + '...',
      host: posthogHost,
    })
  }

  try {
    const client = posthog.init(posthogKey, {
      api_host: posthogHost,
      loaded: (posthog) => {
        console.log('✅ PostHog loaded and ready', {
          host: posthogHost,
          hasSessionId: !!posthog.get_session_id(),
        })
      },
      capture_pageview: false, // We'll handle pageviews manually
      capture_pageleave: true,
      autocapture: {
        dom_event_allowlist: ['click', 'submit'],
      },
      respect_dnt: true,
      opt_out_capturing_by_default: false,
      // Enable debug mode in development
      debug: process.env.NODE_ENV === 'development',
    })
    return client
  } catch (error) {
    console.error('❌ Error initializing PostHog:', error)
    return null
  }
}

export { PostHogProvider }

