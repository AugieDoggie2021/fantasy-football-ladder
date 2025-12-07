'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateAndApplyScoresForWeek } from '@/app/actions/scoring'
import { useToast } from './toast-provider'

interface CommissionerScoringControlsProps {
  leagueId: string
  currentWeekId: string | null
  currentWeekNumber: number | null
}

export function CommissionerScoringControls({
  leagueId,
  currentWeekId,
  currentWeekNumber,
}: CommissionerScoringControlsProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [previewResults, setPreviewResults] = useState<any>(null)

  const handlePreviewScores = async () => {
    if (!currentWeekId) {
      showToast('No current week set. Set a current week first.', 'error')
      return
    }

    setLoading('preview')
    const result = await calculateAndApplyScoresForWeek(leagueId, currentWeekId, { dryRun: true })
    if (result.error) {
      showToast(result.error, 'error')
      setPreviewResults(null)
    } else {
      showToast('Score preview calculated. Review below.', 'info')
      setPreviewResults(result.data)
    }
    setLoading(null)
  }

  const handleApplyScores = async () => {
    if (!currentWeekId) {
      showToast('No current week set. Set a current week first.', 'error')
      return
    }

    if (!confirm('Apply scores for this week? This will finalize all matchups.')) {
      return
    }

    setLoading('apply')
    const result = await calculateAndApplyScoresForWeek(leagueId, currentWeekId, { dryRun: false })
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast('Scores applied successfully!', 'success')
      setPreviewResults(null)
      router.refresh()
    }
    setLoading(null)
  }

  if (!currentWeekId) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Set a current week to calculate scores.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
          Score Management - Week {currentWeekNumber}
        </h4>
        <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
          Preview and finalize scores for this week&apos;s matchups based on starting lineups and player stats.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handlePreviewScores}
            disabled={loading !== null}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading === 'preview' ? 'Calculating...' : 'Preview Scores (no changes)'}
          </button>
          <button
            onClick={handleApplyScores}
            disabled={loading !== null}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading === 'apply' ? 'Finalizing...' : 'Finalize Scores for this Week'}
          </button>
        </div>
      </div>

      {previewResults && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h5 className="font-medium text-gray-900 dark:text-white mb-3">
            Score Preview
          </h5>
          <div className="space-y-2">
            {previewResults.matchups.map((matchup: any) => (
              <div
                key={matchup.matchupId}
                className="text-sm p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{matchup.homeTeamName}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {matchup.homeScore.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{matchup.awayTeamName}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {matchup.awayScore.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            These are preview scores. Click &quot;Finalize Scores for this Week&quot; to apply them to matchups.
          </p>
        </div>
      )}
    </div>
  )
}

