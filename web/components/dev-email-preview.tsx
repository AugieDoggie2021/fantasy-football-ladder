'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

/**
 * Dev Email Preview Component
 * 
 * Shows information about email testing in development.
 * In local development, emails are captured by Inbucket.
 */
export function DevEmailPreview() {
  const [inbucketUrl, setInbucketUrl] = useState<string | null>(null)

  useEffect(() => {
    // In local dev, Inbucket typically runs on port 54324
    if (typeof window !== 'undefined') {
      const origin = window.location.origin
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        setInbucketUrl('http://localhost:54324')
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Email Testing (Development)
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          In development mode, emails are logged and can be viewed in Inbucket.
        </p>
      </div>

      {inbucketUrl ? (
        <div className="space-y-2">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>Local Development:</strong> Emails are captured by Inbucket
            </p>
            <Link
              href={inbucketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Open Inbucket →
            </Link>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Inbucket URL: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{inbucketUrl}</code>
          </p>
        </div>
      ) : (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Inbucket is only available in local development.
            In production, emails are sent via Supabase&apos;s email service.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          How to Test Emails:
        </h4>
        <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
          <li>Go to a league detail page as a commissioner</li>
          <li>Use the &quot;Invite Players&quot; section</li>
          <li>Enter an email address and click &quot;Send via Email&quot;</li>
          <li>Check Inbucket (local) or your email inbox (production)</li>
        </ol>
      </div>

      <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Production Email Setup:</strong> Configure SMTP in Supabase Dashboard
          (Settings → Authentication → SMTP Settings) to send emails in production.
        </p>
      </div>
    </div>
  )
}

