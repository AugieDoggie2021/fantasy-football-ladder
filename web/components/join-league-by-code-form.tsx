'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/analytics/track'
import { AnalyticsEvents } from '@/lib/analytics/events'

interface JoinLeagueByCodeFormProps {}

export function JoinLeagueByCodeForm({}: JoinLeagueByCodeFormProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // For now, treat the code as a token and redirect to the join page
    // In the future, this could be enhanced to support shorter codes
    if (!code.trim()) {
      setError('Please enter an invite code')
      setLoading(false)
      return
    }

    // Track join attempt
    track(AnalyticsEvents.INVITE_ACCEPTED, {
      funnel_name: 'league_join',
      funnel_step: 'code_entered',
      join_method: 'code',
    })

    // Redirect to the join page with the token
    router.push(`/join/${code.trim()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Invite Code or Token
        </label>
        <input
          type="text"
          id="code"
          name="code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(null)
          }}
          required
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
          placeholder="Enter invite code or paste invite link"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          You can paste the full invite link or just the code/token.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Joining...' : 'Join League'}
      </button>
    </form>
  )
}

