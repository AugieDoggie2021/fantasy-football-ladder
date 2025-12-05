'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeagueStatus } from '@/app/actions/leagues'

interface CommissionerSetupPanelProps {
  leagueId: string
  leagueStatus: 'invites_open' | 'draft' | 'active'
  teamCount: number
  maxTeams: number
}

export function CommissionerSetupPanel({
  leagueId,
  leagueStatus,
  teamCount,
  maxTeams,
}: CommissionerSetupPanelProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartDraft = async () => {
    setIsUpdating(true)
    setError(null)

    const result = await updateLeagueStatus(leagueId, 'draft')

    if (result.error) {
      setError(result.error)
      setIsUpdating(false)
    } else {
      router.refresh()
    }
  }

  const handleStartSeason = async () => {
    setIsUpdating(true)
    setError(null)

    const result = await updateLeagueStatus(leagueId, 'active')

    if (result.error) {
      setError(result.error)
      setIsUpdating(false)
    } else {
      router.refresh()
    }
  }

  if (leagueStatus === 'invites_open') {
    const isFull = teamCount >= maxTeams

    return (
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Step 1: Invite Managers
        </h2>
        
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Teams joined: <span className="font-semibold text-gray-900 dark:text-white">{teamCount} / {maxTeams}</span>
          </p>
          {!isFull && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Invite managers until the league is full, then start the draft.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {isFull && (
          <button
            onClick={handleStartDraft}
            disabled={isUpdating}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50"
          >
            {isUpdating ? 'Starting Draft...' : 'Start Draft'}
          </button>
        )}
      </div>
    )
  }

  if (leagueStatus === 'draft') {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Draft in Progress
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Draft flow coming soon. For now, you can manage teams manually after setting the league to active.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <button
          onClick={handleStartSeason}
          disabled={isUpdating}
          className="px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium disabled:opacity-50"
        >
          {isUpdating ? 'Starting Season...' : 'Mark Draft Complete / Start Season'}
        </button>
      </div>
    )
  }

  return null
}

