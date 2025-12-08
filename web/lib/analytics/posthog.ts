'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

export function initPostHog() {
  if (typeof window === 'undefined') return

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

  if (!posthogKey) {
    console.warn(
      '⚠️ PostHog key not found. Analytics will be disabled.\n' +
      'Please add NEXT_PUBLIC_POSTHOG_KEY to your .env.local file.\n' +
      'Get your key from: https://app.posthog.com → Project Settings → API Keys'
    )
    return
  }

  // Log initialization details in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Initializing PostHog:', {
      key: posthogKey.substring(0, 10) + '...',
      host: posthogHost,
    })
  }

  try {
    posthog.init(posthogKey, {
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
  } catch (error) {
    console.error('❌ Error initializing PostHog:', error)
  }
}

export { PostHogProvider }

