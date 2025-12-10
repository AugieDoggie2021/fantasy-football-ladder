'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createPostHogClient } from '@/lib/analytics/posthog'
import type { PostHog } from 'posthog-js'

// Dynamically import PostHogProvider to avoid SSG issues
const PostHogProvider = dynamic(
  () => import('posthog-js/react').then((mod) => mod.PostHogProvider),
  { ssr: false }
)

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [posthogClient, setPosthogClient] = useState<PostHog | null>(null)
  const [isClient, setIsClient] = useState(false)

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

  // Mark as client-side after mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize PostHog client on the client side only
  useEffect(() => {
    if (!isClient) return
    if (!posthogKey) return

    const client = createPostHogClient()
    if (client) {
      setPosthogClient(client)
    }
  }, [isClient, posthogKey])

  // If PostHog is not configured, render children without provider
  if (!posthogKey) {
    return <>{children}</>
  }

  // If not on client or client not yet available, render children without provider
  if (!isClient || !posthogClient) {
    return <>{children}</>
  }

  // Pass the client instance to PostHogProvider
  return <PostHogProvider client={posthogClient}>{children}</PostHogProvider>
}

