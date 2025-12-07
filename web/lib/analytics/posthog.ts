'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

export function initPostHog() {
  if (typeof window === 'undefined') return

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

  if (!posthogKey) {
    console.warn('PostHog key not found. Analytics will be disabled.')
    return
  }

  posthog.init(posthogKey, {
    api_host: posthogHost,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('PostHog loaded')
      }
    },
    capture_pageview: false, // We'll handle pageviews manually
    capture_pageleave: true,
    autocapture: {
      dom_event_allowlist: ['click', 'submit'],
    },
    respect_dnt: true,
    opt_out_capturing_by_default: false,
  })
}

export { PostHogProvider }

