'use client'

import { useState, useMemo } from 'react'
import { addPlayerToRoster } from '@/app/actions/rosters'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/analytics/track'
import { AnalyticsEvents } from '@/lib/analytics/events'

interface Player {
  id: string
  full_name: string
  position: string
  nfl_team: string | null
  bye_week: number | null
}

interface PlayerOwnership {
  teamId: string
  teamName: string
  isMyTeam: boolean
}

interface PlayersListProps {
  players: Player[]
  playerOwnershipMap: Map<string, PlayerOwnership>
  teamId: string
  leagueId: string
}

const POSITIONS = ['All', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF']

export function PlayersList({
  players,
  playerOwnershipMap,
  teamId,
  leagueId,
}: PlayersListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [positionFilter, setPositionFilter] = useState<string>('All')
  const [loading, setLoading] = useState<string | null>(null)

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      // Position filter
      if (positionFilter !== 'All' && player.position !== positionFilter) {
        return false
      }

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = player.full_name.toLowerCase().includes(query)
        const matchesTeam = player.nfl_team?.toLowerCase().includes(query) || false
        if (!matchesName && !matchesTeam) {
          return false
        }
      }

      return true
    })
  }, [players, positionFilter, searchQuery])

  const handleAddPlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Add ${playerName} to your team?`)) {
      return
    }

    setLoading(playerId)
    const formData = new FormData()
    formData.append('team_id', teamId)
    formData.append('player_id', playerId)
    formData.append('league_id', leagueId)
    formData.append('slot_type', 'BENCH') // Default to bench, user can move to starter later

    const result = await addPlayerToRoster(formData)
    if (!result.error) {
      // Track player added
      track(AnalyticsEvents.PLAYER_ADDED, {
        league_id: leagueId,
        team_id: teamId,
        player_id: playerId,
      })
      router.refresh()
    } else {
      alert(result.error)
    }
    setLoading(null)
  }

  // Group players by position for better organization
  const playersByPosition = useMemo(() => {
    const grouped: Record<string, Player[]> = {}
    filteredPlayers.forEach(player => {
      if (!grouped[player.position]) {
        grouped[player.position] = []
      }
      grouped[player.position].push(player)
    })
    return grouped
  }, [filteredPlayers])

  const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Players
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or team..."
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Position
          </label>
          <select
            id="position"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
          >
            {POSITIONS.map(pos => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Players List */}
      <div className="space-y-6">
        {positionOrder.map(position => {
          const positionPlayers = playersByPosition[position] || []
          if (positionFilter !== 'All' && positionFilter !== position) {
            return null
          }
          if (positionPlayers.length === 0) {
            return null
          }

          return (
            <div key={position}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {position} ({positionPlayers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {positionPlayers.map(player => {
                  const ownership = playerOwnershipMap.get(player.id)
                  const isOwned = !!ownership
                  const isMyPlayer = ownership?.isMyTeam || false

                  return (
                    <div
                      key={player.id}
                      className={`p-3 border rounded-lg ${
                        isMyPlayer
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : isOwned
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {player.full_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {player.position}
                            {player.nfl_team && ` • ${player.nfl_team}`}
                            {player.bye_week && ` • Bye: Week ${player.bye_week}`}
                          </div>
                          {isOwned && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {isMyPlayer ? (
                                <span className="text-green-600 dark:text-green-400">
                                  On your team
                                </span>
                              ) : (
                                <span>Owned by: {ownership.teamName}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {!isOwned && (
                          <button
                            onClick={() => handleAddPlayer(player.id, player.full_name)}
                            disabled={loading === player.id}
                            className="ml-2 px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading === player.id ? 'Adding...' : 'Add'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No players found matching your filters.
        </div>
      )}
    </div>
  )
}

