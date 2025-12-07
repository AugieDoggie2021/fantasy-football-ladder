'use client'

import { useEffect } from 'react'
import { PostHogProvider, initPostHog } from '@/lib/analytics/posthog'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!posthogKey) {
    return <>{children}</>
  }

  return <PostHogProvider>{children}</PostHogProvider>
}

