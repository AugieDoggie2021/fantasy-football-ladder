'use client'

import { useState } from 'react'
import { getLeagueWeekPlayerScoresAction, type LeagueWeekPlayerScore } from '@/app/actions/scores'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export function DevPlayerScoresView() {
  const [leagueId, setLeagueId] = useState<string>('')
  const [seasonYear, setSeasonYear] = useState<number>(new Date().getFullYear())
  const [week, setWeek] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState<LeagueWeekPlayerScore[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [leagues, setLeagues] = useState<Array<{ id: string; name: string }>>([])

  // Fetch available leagues on mount
  useEffect(() => {
    async function fetchLeagues() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('leagues')
        .select('id, name')
        .order('name', { ascending: true })

      if (data) {
        setLeagues(data)
        if (data.length > 0 && !leagueId) {
          setLeagueId(data[0].id)
        }
      }
    }

    fetchLeagues()
  }, [leagueId])

  const handleFetchScores = async () => {
    if (!leagueId) {
      setError('Please select a league')
      return
    }

    setLoading(true)
    setError(null)
    setScores(null)

    try {
      const result = await getLeagueWeekPlayerScoresAction({
        leagueId,
        seasonYear,
        week,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setScores(result.data || [])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch scores')
    } finally {
      setLoading(false)
    }
  }

  // Only show in dev environment
  const env = process.env.NEXT_PUBLIC_APP_ENV || 'dev'
  if (env === 'prod') {
    return null
  }

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Player Scores API Test (Dev Only)
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Test the player scores backend API with real data
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            League
          </label>
          <select
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a league</option>
            {leagues.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Season Year
          </label>
          <input
            type="number"
            value={seasonYear}
            onChange={(e) => setSeasonYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            min="2000"
            max="2100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Week (1-18)
          </label>
          <input
            type="number"
            value={week}
            onChange={(e) => setWeek(parseInt(e.target.value, 10) || 1)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            min="1"
            max="18"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleFetchScores}
            disabled={loading || !leagueId}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch Scores'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          <strong>Error:</strong> {error}
        </div>
      )}

      {scores && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Results ({scores.length} players)
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              API: <code className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
                /api/leagues/{leagueId}/scores?seasonYear={seasonYear}&week={week}
              </code>
            </div>
          </div>

          {scores.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No rostered players found for this league/week.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Player
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Team
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Slot
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Points
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Stats
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {scores.map((score) => (
                    <tr key={score.playerId}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {score.playerName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {score.position || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {score.teamAbbrev || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            score.rosterSlot === 'starter'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {score.rosterSlot}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                        {score.fantasyPoints.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        <div className="space-y-1">
                          {score.stats.passingYards !== undefined && (
                            <div>Pass: {score.stats.passingYards} yds, {score.stats.passingTds || 0} TD, {score.stats.interceptions || 0} INT</div>
                          )}
                          {score.stats.rushingYards !== undefined && score.stats.rushingYards > 0 && (
                            <div>Rush: {score.stats.rushingYards} yds, {score.stats.rushingTds || 0} TD</div>
                          )}
                          {score.stats.receivingYards !== undefined && score.stats.receivingYards > 0 && (
                            <div>Rec: {score.stats.receivingYards} yds, {score.stats.receivingTds || 0} TD, {score.stats.receptions || 0} rec</div>
                          )}
                          {score.stats.kickingPoints !== undefined && score.stats.kickingPoints > 0 && (
                            <div>K: {score.stats.kickingPoints} pts</div>
                          )}
                          {score.stats.defensePoints !== undefined && score.stats.defensePoints > 0 && (
                            <div>DEF: {score.stats.defensePoints} pts</div>
                          )}
                          {Object.values(score.stats).every(v => v === undefined || v === 0) && (
                            <div className="text-gray-400">No stats</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

