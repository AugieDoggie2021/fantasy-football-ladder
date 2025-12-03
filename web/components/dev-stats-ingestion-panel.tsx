'use client'

import { useState } from 'react'
import { triggerExternalPlayersSync, triggerExternalWeekStatsSync } from '@/app/actions/stats-ingestion'

export function DevStatsIngestionPanel() {
  const [playersLoading, setPlayersLoading] = useState(false)
  const [playersResult, setPlayersResult] = useState<any>(null)
  const [playersError, setPlayersError] = useState<string | null>(null)

  const [statsLoading, setStatsLoading] = useState(false)
  const [statsResult, setStatsResult] = useState<any>(null)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [seasonYear, setSeasonYear] = useState<number>(new Date().getFullYear())
  const [week, setWeek] = useState<number>(1)
  const [mode, setMode] = useState<'live' | 'replay'>('live')

  const handleSyncPlayers = async () => {
    setPlayersLoading(true)
    setPlayersError(null)
    setPlayersResult(null)

    try {
      const result = await triggerExternalPlayersSync()
      setPlayersResult(result)
    } catch (error: any) {
      setPlayersError(error.message || 'Failed to sync players')
    } finally {
      setPlayersLoading(false)
    }
  }

  const handleSyncWeekStats = async () => {
    setStatsLoading(true)
    setStatsError(null)
    setStatsResult(null)

    try {
      const result = await triggerExternalWeekStatsSync(seasonYear, week, mode)
      setStatsResult(result)
    } catch (error: any) {
      setStatsError(error.message || 'Failed to sync week stats')
    } finally {
      setStatsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          External Stats Ingestion (Dev)
        </h3>
        <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-4">
          Sync players and weekly stats from SportsData.io
        </p>
      </div>

      {/* Sync External Players */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncPlayers}
            disabled={playersLoading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {playersLoading ? 'Syncing...' : 'Sync External Players'}
          </button>
        </div>

        {playersError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
            Error: {playersError}
          </div>
        )}

        {playersResult && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
            <div className="font-semibold text-green-800 dark:text-green-200 mb-1">
              Sync Complete
            </div>
            <div className="text-green-700 dark:text-green-300 space-y-1">
              <div>Inserted: {playersResult.insertedCount || 0}</div>
              <div>Updated: {playersResult.updatedCount || 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* Sync Weekly Stats */}
      <div className="space-y-2 pt-4 border-t border-yellow-200 dark:border-yellow-800">
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Season Year
              </label>
              <input
                type="number"
                value={seasonYear}
                onChange={(e) => setSeasonYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                min="2020"
                max="2030"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Week
              </label>
              <input
                type="number"
                value={week}
                onChange={(e) => setWeek(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                min="1"
                max="18"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'live' | 'replay')}
                className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="live">Live</option>
                <option value="replay">Replay</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleSyncWeekStats}
            disabled={statsLoading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {statsLoading ? 'Syncing...' : 'Sync Week Stats'}
          </button>
        </div>

        {statsError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
            Error: {statsError}
          </div>
        )}

        {statsResult && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
            <div className="font-semibold text-green-800 dark:text-green-200 mb-1">
              Sync Complete
            </div>
            <div className="text-green-700 dark:text-green-300 space-y-1">
              <div>Season: {statsResult.seasonYear} Week {statsResult.week}</div>
              <div>Mode: {statsResult.mode}</div>
              <div>Inserted: {statsResult.insertedCount || 0}</div>
              <div>Updated: {statsResult.updatedCount || 0}</div>
              <div>Skipped: {statsResult.skippedCount || 0}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

