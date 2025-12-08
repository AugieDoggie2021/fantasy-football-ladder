'use client'

import { useState, useEffect } from 'react'
import { useAnalytics } from '@/hooks/use-analytics'
import posthog from 'posthog-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function PostHogTestPage() {
  const { track } = useAnalytics()
  const router = useRouter()
  const [status, setStatus] = useState<{
    initialized: boolean
    keyPresent: boolean
    host: string
    error?: string
    sessionId?: string
    distinctId?: string
  }>({
    initialized: false,
    keyPresent: false,
    host: '',
  })
  const [testEventSent, setTestEventSent] = useState(false)
  const [testEventResult, setTestEventResult] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check authentication
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user)
      if (!user) {
        router.push('/login?redirect=/admin/posthog-test')
      }
    })
  }, [router])

  useEffect(() => {
    // Check PostHog initialization status
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

    const checkStatus = () => {
      const isInitialized = typeof posthog !== 'undefined' && posthog.__loaded
      const sessionId = isInitialized ? posthog.get_session_id() : null
      const distinctId = isInitialized ? posthog.get_distinct_id() : null

      setStatus({
        initialized: isInitialized,
        keyPresent: !!posthogKey,
        host: posthogHost,
        error: !posthogKey ? 'NEXT_PUBLIC_POSTHOG_KEY is not set in environment variables' : undefined,
        sessionId: sessionId || undefined,
        distinctId: distinctId || undefined,
      })
    }

    // Initial check
    checkStatus()

    // Check if PostHog is loaded
    if (typeof window !== 'undefined' && posthog) {
      const checkLoaded = setInterval(() => {
        checkStatus()
        if (posthog.__loaded) {
          clearInterval(checkLoaded)
        }
      }, 100)

      return () => clearInterval(checkLoaded)
    }
  }, [])

  const sendTestEvent = () => {
    try {
      const eventName = 'test_event_' + Date.now()
      track(eventName, {
        test_property: 'test_value',
        timestamp: new Date().toISOString(),
        source: 'posthog_test_page',
        test_id: Math.random().toString(36).substring(7),
      })
      setTestEventSent(true)
      setTestEventResult(
        `✅ Test event "${eventName}" sent successfully! Check your PostHog dashboard. ` +
        `It may take a few seconds to appear.`
      )
    } catch (error: any) {
      setTestEventResult(`❌ Error sending test event: ${error.message}`)
    }
  }

  const sendDirectPostHogEvent = () => {
    try {
      if (typeof window !== 'undefined' && posthog && posthog.__loaded) {
        posthog.capture('direct_test_event', {
          test_property: 'direct_test_value',
          timestamp: new Date().toISOString(),
          source: 'posthog_test_page_direct',
        })
        setTestEventResult('✅ Direct PostHog event sent successfully!')
      } else {
        setTestEventResult('❌ PostHog is not initialized. Cannot send direct event.')
      }
    } catch (error: any) {
      setTestEventResult(`❌ Error sending direct event: ${error.message}`)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (isAuthenticated === false) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          PostHog Installation Test
        </h1>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Installation Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                PostHog Key Present:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status.keyPresent
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {status.keyPresent ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                PostHog Initialized:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status.initialized
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}
              >
                {status.initialized ? '✅ Yes' : '⏳ No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                PostHog Host:
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{status.host}</span>
            </div>
            {status.initialized && status.sessionId && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Session ID:
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono text-xs">
                  {status.sessionId.substring(0, 20)}...
                </span>
              </div>
            )}
            {status.initialized && status.distinctId && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Distinct ID:
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono text-xs">
                  {status.distinctId}
                </span>
              </div>
            )}
            {status.error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  ⚠️ {status.error}
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-2">
                  <strong>For local development:</strong> Add NEXT_PUBLIC_POSTHOG_KEY to your .env.local file in the web/ directory.
                  <br />
                  <strong>For production:</strong> Add NEXT_PUBLIC_POSTHOG_KEY to Vercel environment variables and redeploy.
                </p>
              </div>
            )}
            {!status.error && status.keyPresent && !status.initialized && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  ⏳ PostHog key is present but not initialized yet.
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-2">
                  If you just added the environment variables, you may need to:
                  <br />
                  • Refresh the page
                  <br />
                  • Clear your browser cache
                  <br />
                  • Wait a few seconds for PostHog to load
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Test Event Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test Event
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={sendTestEvent}
                disabled={!status.keyPresent}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Send Test Event (via track function)
              </button>
              <button
                onClick={sendDirectPostHogEvent}
                disabled={!status.initialized}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Send Direct PostHog Event
              </button>
            </div>
            {testEventResult && (
              <div
                className={`p-4 rounded-lg ${
                  testEventResult.includes('✅')
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}
              >
                <p className="text-sm">{testEventResult}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Test Instructions */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-green-900 dark:text-green-200 mb-4">
            Quick Test
          </h2>
          <p className="text-sm text-green-800 dark:text-green-300 mb-4">
            Click the buttons above to send test events. Then check your PostHog dashboard at{' '}
            <a
              href={status.host}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              {status.host}
            </a>{' '}
            to see if events appear (may take a few seconds).
          </p>
          <p className="text-xs text-green-700 dark:text-green-400">
            💡 Tip: Open your browser's Network tab to see PostHog API requests being sent.
          </p>
        </div>

        {/* Instructions Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-200 mb-4">
            Setup Instructions
          </h2>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
            <p>
              <strong>1. Get your PostHog API Key:</strong>
            </p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>Go to <a href="https://app.posthog.com" target="_blank" rel="noopener noreferrer" className="underline">app.posthog.com</a></li>
              <li>Navigate to Project Settings → API Keys</li>
              <li>Copy your Project API Key</li>
            </ol>
            <p className="mt-4">
              <strong>2. Add to .env.local:</strong>
            </p>
            <pre className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded mt-2 text-xs overflow-x-auto">
{`NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com`}
            </pre>
            <p className="mt-4">
              <strong>3. Restart your development server:</strong>
            </p>
            <pre className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded mt-2 text-xs">
              npm run dev
            </pre>
            <p className="mt-4">
              <strong>4. Check your PostHog dashboard:</strong> Events should appear within a few seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

