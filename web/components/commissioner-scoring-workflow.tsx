'use client'

import { useState } from 'react'
import { 
  ingestStatsForCurrentWeek, 
  dryRunScoringForCurrentWeek, 
  applyScoringForCurrentWeek 
} from '@/app/actions/commissioner-workflow'
import { useRouter } from 'next/navigation'

interface CommissionerScoringWorkflowProps {
  leagueId: string
  currentWeekNumber?: number | null
}

export function CommissionerScoringWorkflow({
  leagueId,
  currentWeekNumber,
}: CommissionerScoringWorkflowProps) {
  const router = useRouter()
  const [ingestLoading, setIngestLoading] = useState(false)
  const [ingestResult, setIngestResult] = useState<any>(null)
  const [ingestError, setIngestError] = useState<string | null>(null)

  const [dryRunLoading, setDryRunLoading] = useState(false)
  const [dryRunResult, setDryRunResult] = useState<any>(null)
  const [dryRunError, setDryRunError] = useState<string | null>(null)

  const [applyLoading, setApplyLoading] = useState(false)
  const [applyResult, setApplyResult] = useState<any>(null)
  const [applyError, setApplyError] = useState<string | null>(null)

  const handleIngestStats = async () => {
    setIngestLoading(true)
    setIngestError(null)
    setIngestResult(null)

    try {
      const result = await ingestStatsForCurrentWeek(leagueId)
      if (result.error) {
        setIngestError(result.error)
      } else {
        setIngestResult(result.data)
        router.refresh()
      }
    } catch (error: any) {
      setIngestError(error.message || 'Failed to ingest stats')
    } finally {
      setIngestLoading(false)
    }
  }

  const handleDryRun = async () => {
    setDryRunLoading(true)
    setDryRunError(null)
    setDryRunResult(null)

    try {
      const result = await dryRunScoringForCurrentWeek(leagueId)
      if (result.error) {
        setDryRunError(result.error)
      } else {
        setDryRunResult(result.data)
      }
    } catch (error: any) {
      setDryRunError(error.message || 'Failed to run dry-run scoring')
    } finally {
      setDryRunLoading(false)
    }
  }

  const handleApplyScoring = async () => {
    if (!confirm('Apply scores for this week? This will update matchups and standings.')) {
      return
    }

    setApplyLoading(true)
    setApplyError(null)
    setApplyResult(null)

    try {
      const result = await applyScoringForCurrentWeek(leagueId)
      if (result.error) {
        setApplyError(result.error)
      } else {
        setApplyResult(result.data)
        router.refresh()
      }
    } catch (error: any) {
      setApplyError(error.message || 'Failed to apply scoring')
    } finally {
      setApplyLoading(false)
    }
  }

  if (currentWeekNumber === null || currentWeekNumber === undefined) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          No current week set. Set a current week to use scoring workflow.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Week {currentWeekNumber} Scoring Workflow
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          Step 1: Ingest stats → Step 2: Preview scores → Step 3: Apply scores
        </p>
      </div>

      {/* Step 1: Ingest Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
              1. Ingest External Stats
            </h5>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Fetch player stats from SportsData.io for this week
            </p>
          </div>
          <button
            onClick={handleIngestStats}
            disabled={ingestLoading || dryRunLoading || applyLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ingestLoading ? 'Ingesting...' : 'Ingest Stats'}
          </button>
        </div>
        {ingestError && (
          <p className="text-xs text-red-600 dark:text-red-400">{ingestError}</p>
        )}
        {ingestResult && (
          <div className="text-xs text-green-600 dark:text-green-400">
            ✓ Ingested: {ingestResult.insertedCount || 0} inserted, {ingestResult.updatedCount || 0} updated
          </div>
        )}
      </div>

      {/* Step 2: Dry Run */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
              2. Preview Scores (Dry Run)
            </h5>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Calculate scores without applying them
            </p>
          </div>
          <button
            onClick={handleDryRun}
            disabled={ingestLoading || dryRunLoading || applyLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {dryRunLoading ? 'Calculating...' : 'Preview Scores'}
          </button>
        </div>
        {dryRunError && (
          <p className="text-xs text-red-600 dark:text-red-400">{dryRunError}</p>
        )}
        {dryRunResult && (
          <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
            <div>✓ Preview complete: {dryRunResult.matchups?.length || 0} matchups calculated</div>
            {dryRunResult.matchups?.map((m: any, i: number) => (
              <div key={i} className="ml-4">
                {m.homeTeamName} {m.homeScore.toFixed(2)} vs {m.awayTeamName} {m.awayScore.toFixed(2)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 3: Apply Scoring */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
              3. Apply Scores
            </h5>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Finalize scores and update matchups
            </p>
          </div>
          <button
            onClick={handleApplyScoring}
            disabled={ingestLoading || dryRunLoading || applyLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applyLoading ? 'Applying...' : 'Apply Scores'}
          </button>
        </div>
        {applyError && (
          <p className="text-xs text-red-600 dark:text-red-400">{applyError}</p>
        )}
        {applyResult && (
          <div className="text-xs text-green-600 dark:text-green-400">
            ✓ Scores applied: {applyResult.matchups?.length || 0} matchups updated
          </div>
        )}
      </div>
    </div>
  )
}

