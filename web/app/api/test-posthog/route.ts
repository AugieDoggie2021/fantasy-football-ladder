import { NextResponse } from 'next/server'

/**
 * API route to test PostHog integration
 * This endpoint can be called to verify PostHog is working
 */
export async function GET() {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

  return NextResponse.json({
    posthog_configured: !!posthogKey,
    posthog_host: posthogHost,
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'unknown',
    message: posthogKey
      ? 'PostHog is configured. Check the /admin/posthog-test page to send test events.'
      : 'PostHog key is missing. Please add NEXT_PUBLIC_POSTHOG_KEY to environment variables.',
  })
}

