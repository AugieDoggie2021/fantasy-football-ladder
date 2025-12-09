'use server'

import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

/**
 * Get or create PostHog server client
 * Singleton pattern to reuse the same client instance
 */
function getPostHogClient(): PostHog | null {
  // Return null if already initialized as null (missing key)
  if (posthogClient === null && process.env.POSTHOG_PROJECT_API_KEY === undefined) {
    return null
  }

  // Create client if it doesn't exist and key is available
  if (!posthogClient && process.env.POSTHOG_PROJECT_API_KEY) {
    const posthogHost = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
    
    try {
      posthogClient = new PostHog(process.env.POSTHOG_PROJECT_API_KEY, {
        host: posthogHost,
        flushAt: 20, // Batch events
        flushInterval: 10000, // Flush every 10 seconds
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ PostHog server client initialized')
      }
    } catch (error) {
      console.error('❌ Error initializing PostHog server client:', error)
      return null
    }
  }

  return posthogClient
}

/**
 * Track an event on the server side
 */
export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const client = getPostHogClient()
  if (!client) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('PostHog server client not available. Event not tracked:', event)
    }
    return
  }

  try {
    client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        $lib: 'posthog-node',
        $lib_version: 'server',
      },
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ PostHog server event tracked:', event, { distinctId })
    }
  } catch (error) {
    console.error('Error tracking server event in PostHog:', error)
  }
}

/**
 * Identify a user on the server side
 */
export async function identifyServerUser(
  distinctId: string,
  traits?: Record<string, unknown>
) {
  const client = getPostHogClient()
  if (!client) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('PostHog server client not available. User not identified:', distinctId)
    }
    return
  }

  try {
    client.identify({
      distinctId,
      properties: traits || {},
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ PostHog server user identified:', distinctId)
    }
  } catch (error) {
    console.error('Error identifying user in PostHog:', error)
  }
}

/**
 * Set user properties on the server side
 */
export async function setServerUserProperties(
  distinctId: string,
  properties: Record<string, unknown>
) {
  const client = getPostHogClient()
  if (!client) {
    return
  }

  try {
    client.identify({
      distinctId,
      properties,
    })
  } catch (error) {
    console.error('Error setting user properties in PostHog:', error)
  }
}

/**
 * Shutdown PostHog client (call on app shutdown)
 */
export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown()
    posthogClient = null
  }
}

