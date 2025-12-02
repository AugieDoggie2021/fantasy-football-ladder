'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateDraftPicksForLeague, assignPlayerToDraftPick } from '@/app/actions/draft'

interface Team {
  id: string
  name: string
  draft_position?: number | null
}

interface Player {
  id: string
  full_name: string
  position: string
  nfl_team: string | null
  bye_week: number | null
}

interface DraftPick {
  id: string
  round: number
  overall_pick: number
  team_id: string
  player_id: string | null
  teams: Team | null
  players: Player | null
}

interface DraftBoardProps {
  leagueId: string
  teams: Team[]
  draftPicks: DraftPick[]
  availablePlayers: Player[]
}

export function DraftBoard({
  leagueId,
  teams,
  draftPicks,
  availablePlayers,
}: DraftBoardProps) {
  const router = useRouter()
  const [selectedPick, setSelectedPick] = useState<string | null>(null)
  const [positionFilter, setPositionFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerateDraft = async () => {
    if (!confirm('Generate draft picks? This will create picks for all teams.')) {
      return
    }

    setLoading(true)
    const result = await generateDraftPicksForLeague(leagueId, 14)
    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  const handleAssignPlayer = async (pickId: string, playerId: string) => {
    setLoading(true)
    const formData = new FormData()
    formData.append('draft_pick_id', pickId)
    formData.append('player_id', playerId)
    formData.append('league_id', leagueId)

    const result = await assignPlayerToDraftPick(formData)
    if (result.error) {
      alert(result.error)
    } else {
      setSelectedPick(null)
      router.refresh()
    }
    setLoading(false)
  }

  // Filter available players
  const filteredPlayers = availablePlayers.filter(player => {
    if (positionFilter !== 'All' && player.position !== positionFilter) {
      return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        player.full_name.toLowerCase().includes(query) ||
        player.nfl_team?.toLowerCase().includes(query) ||
        false
      )
    }
    return true
  })

  // Group draft picks by round
  const picksByRound: Record<number, DraftPick[]> = {}
  draftPicks.forEach(pick => {
    if (!picksByRound[pick.round]) {
      picksByRound[pick.round] = []
    }
    picksByRound[pick.round].push(pick)
  })

  const maxRound = draftPicks.length > 0 ? Math.max(...draftPicks.map(p => p.round)) : 0
  const nextPick = draftPicks.find(p => !p.player_id)

  return (
    <div className="space-y-6">
      {/* Generate Draft Button */}
      {draftPicks.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Setup Draft
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Generate draft picks for all teams in this league. This will create a snake draft order.
          </p>
          <button
            onClick={handleGenerateDraft}
            disabled={loading || teams.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : `Generate Draft (${teams.length} teams, 14 rounds)`}
          </button>
        </div>
      )}

      {draftPicks.length > 0 && (
        <>
          {/* Draft Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Draft Progress
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {draftPicks.filter(p => p.player_id).length} of {draftPicks.length} picks made
                </p>
              </div>
              {nextPick && (
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Next Pick:</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Round {nextPick.round}, Pick {nextPick.overall_pick}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {nextPick.teams?.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Draft Board */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Draft Board
            </h2>
            <div className="space-y-4">
              {Array.from({ length: maxRound }, (_, i) => i + 1).map(round => {
                const roundPicks = picksByRound[round] || []
                return (
                  <div key={round} className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Round {round}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {roundPicks.map(pick => (
                        <button
                          key={pick.id}
                          onClick={() => setSelectedPick(pick.id)}
                          className={`text-left p-2 rounded border text-sm ${
                            selectedPick === pick.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : pick.player_id
                              ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            #{pick.overall_pick} - {pick.teams?.name}
                          </div>
                          {pick.players ? (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {pick.players.full_name} ({pick.players.position})
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 dark:text-gray-500 italic mt-1">
                              Not selected
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Player Selection */}
          {selectedPick && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Select Player
              </h2>
              
              {/* Filters */}
              <div className="mb-4 space-y-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search players..."
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
                />
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
                >
                  <option value="All">All Positions</option>
                  <option value="QB">QB</option>
                  <option value="RB">RB</option>
                  <option value="WR">WR</option>
                  <option value="TE">TE</option>
                  <option value="K">K</option>
                  <option value="DEF">DEF</option>
                </select>
              </div>

              {/* Available Players List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map(player => (
                    <button
                      key={player.id}
                      onClick={() => handleAssignPlayer(selectedPick, player.id)}
                      disabled={loading}
                      className="w-full text-left p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {player.full_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {player.position}
                        {player.nfl_team && ` • ${player.nfl_team}`}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No available players match your filters.
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedPick(null)}
                className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

