'use client'

import { useState, useMemo, useCallback } from 'react'
import type { PlayerWeekStats } from '@/lib/scoring'
import type { ScoringConfig } from '@/lib/scoring-config'

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

interface WeekStats {
  stats: PlayerWeekStats
  weekNumber: number
  weekStatus: string
  fantasyPoints: number
}

interface LeagueWeek {
  id: string
  week_number: number
  status: string
  is_current: boolean
}

interface LeagueTeam {
  id: string
  name: string
}

interface PlayersTableProps {
  players: Player[]
  playerOwnershipMap: Map<string, PlayerOwnership>
  playerStatsMap: Map<string, Map<string, WeekStats>>
  playerAverages: Map<string, { seasonAvg: number | null; last4Avg: number | null }>
  currentWeek: LeagueWeek | null
  allWeeks: LeagueWeek[]
  leagueTeams: LeagueTeam[]
  userTeamId: string
  userId: string
  leagueId: string
  scoringConfig: ScoringConfig
}

type AvailabilityFilter = 'available' | 'all' | 'my_team' | string // string is team ID
type SortOption = 
  | 'fantasy_points_current'
  | 'fantasy_points_actual_current'
  | 'fantasy_points_season_avg'
  | 'fantasy_points_last4_avg'
  | 'name'
  | 'passing_yards'
  | 'rushing_yards'
  | 'receiving_yards'
  | 'receptions'

const POSITIONS = ['All', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF']

export function PlayersTable({
  players,
  playerOwnershipMap,
  playerStatsMap,
  playerAverages,
  currentWeek,
  allWeeks,
  leagueTeams,
  userTeamId,
  userId,
  leagueId,
  scoringConfig,
}: PlayersTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [positionFilter, setPositionFilter] = useState<string>('All')
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('available')
  const [nflTeamFilter, setNflTeamFilter] = useState<string>('All')
  const [selectedWeek, setSelectedWeek] = useState<LeagueWeek | null>(currentWeek)
  const [sortBy, setSortBy] = useState<SortOption>('fantasy_points_current')
  const [sortAscending, setSortAscending] = useState(false)

  // Get unique NFL teams for filter
  const nflTeams = useMemo(() => {
    const teams = new Set<string>()
    players.forEach(p => {
      if (p.nfl_team) {
        teams.add(p.nfl_team)
      }
    })
    return Array.from(teams).sort()
  }, [players])

  // Filter players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      // Position filter
      if (positionFilter !== 'All' && player.position !== positionFilter) {
        return false
      }

      // NFL team filter
      if (nflTeamFilter !== 'All' && player.nfl_team !== nflTeamFilter) {
        return false
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = player.full_name.toLowerCase().includes(query)
        const matchesTeam = player.nfl_team?.toLowerCase().includes(query) || false
        if (!matchesName && !matchesTeam) {
          return false
        }
      }

      // Availability filter
      const ownership = playerOwnershipMap.get(player.id)
      if (availabilityFilter === 'available') {
        if (ownership) return false
      } else if (availabilityFilter === 'my_team') {
        if (!ownership || !ownership.isMyTeam) return false
      } else if (availabilityFilter !== 'all') {
        // Filter by specific team
        if (!ownership || ownership.teamId !== availabilityFilter) return false
      }

      return true
    })
  }, [players, positionFilter, nflTeamFilter, searchQuery, availabilityFilter, playerOwnershipMap])

  // Get stats for selected week
  const getPlayerWeekData = useCallback((playerId: string) => {
    if (!selectedWeek) return null
    const playerWeeks = playerStatsMap.get(playerId)
    if (!playerWeeks) return null
    return playerWeeks.get(selectedWeek.id) || null
  }, [selectedWeek, playerStatsMap])

  // Sort players
  const sortedPlayers = useMemo(() => {
    const sorted = [...filteredPlayers]
    
    sorted.sort((a, b) => {
      let aValue: number | string = 0
      let bValue: number | string = 0

      switch (sortBy) {
        case 'name':
          aValue = a.full_name
          bValue = b.full_name
          break
        case 'fantasy_points_current':
          const aWeekData = getPlayerWeekData(a.id)
          const aAvg = playerAverages.get(a.id)
          aValue = aWeekData?.fantasyPoints ?? aAvg?.seasonAvg ?? 0
          bValue = getPlayerWeekData(b.id)?.fantasyPoints ?? playerAverages.get(b.id)?.seasonAvg ?? 0
          break
        case 'fantasy_points_actual_current':
          aValue = getPlayerWeekData(a.id)?.fantasyPoints ?? 0
          bValue = getPlayerWeekData(b.id)?.fantasyPoints ?? 0
          break
        case 'fantasy_points_season_avg':
          aValue = playerAverages.get(a.id)?.seasonAvg ?? 0
          bValue = playerAverages.get(b.id)?.seasonAvg ?? 0
          break
        case 'fantasy_points_last4_avg':
          aValue = playerAverages.get(a.id)?.last4Avg ?? 0
          bValue = playerAverages.get(b.id)?.last4Avg ?? 0
          break
        case 'passing_yards':
          aValue = getPlayerWeekData(a.id)?.stats.passing_yards ?? 0
          bValue = getPlayerWeekData(b.id)?.stats.passing_yards ?? 0
          break
        case 'rushing_yards':
          aValue = getPlayerWeekData(a.id)?.stats.rushing_yards ?? 0
          bValue = getPlayerWeekData(b.id)?.stats.rushing_yards ?? 0
          break
        case 'receiving_yards':
          aValue = getPlayerWeekData(a.id)?.stats.receiving_yards ?? 0
          bValue = getPlayerWeekData(b.id)?.stats.receiving_yards ?? 0
          break
        case 'receptions':
          aValue = getPlayerWeekData(a.id)?.stats.receptions ?? 0
          bValue = getPlayerWeekData(b.id)?.stats.receptions ?? 0
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortAscending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      
      const numA = typeof aValue === 'number' ? aValue : 0
      const numB = typeof bValue === 'number' ? bValue : 0
      return sortAscending ? numA - numB : numB - numA
    })

    return sorted
  }, [filteredPlayers, sortBy, sortAscending, playerStatsMap, playerAverages, selectedWeek, getPlayerWeekData])

  const handleSort = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortAscending(!sortAscending)
    } else {
      setSortBy(newSortBy)
      setSortAscending(false) // Default to descending for numbers
    }
  }

  const getStatValue = (player: Player, statKey: keyof PlayerWeekStats): number => {
    const weekData = getPlayerWeekData(player.id)
    return weekData?.stats[statKey] ?? 0
  }

  const getFantasyPoints = (player: Player): number | null => {
    if (sortBy === 'fantasy_points_season_avg') {
      return playerAverages.get(player.id)?.seasonAvg ?? null
    }
    if (sortBy === 'fantasy_points_last4_avg') {
      return playerAverages.get(player.id)?.last4Avg ?? null
    }
    return getPlayerWeekData(player.id)?.fantasyPoints ?? null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Filters and Controls */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Player name or team..."
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
            />
          </div>

          {/* Position Filter */}
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
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Availability
            </label>
            <select
              id="availability"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityFilter)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
            >
              <option value="available">Available</option>
              <option value="all">All Players</option>
              <option value="my_team">On My Team</option>
              {leagueTeams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          {/* NFL Team Filter */}
          <div>
            <label htmlFor="nflTeam" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              NFL Team
            </label>
            <select
              id="nflTeam"
              value={nflTeamFilter}
              onChange={(e) => setNflTeamFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
            >
              <option value="All">All Teams</option>
              {nflTeams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Week Selector */}
          <div>
            <label htmlFor="week" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Week
            </label>
            <select
              id="week"
              value={selectedWeek?.id || ''}
              onChange={(e) => {
                const week = allWeeks.find(w => w.id === e.target.value)
                setSelectedWeek(week || null)
              }}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
            >
              {allWeeks.map(week => (
                <option key={week.id} value={week.id}>
                  Week {week.week_number} {week.is_current && '(Current)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
          >
            <option value="fantasy_points_current">Projected Fantasy Points (Current Week)</option>
            <option value="fantasy_points_actual_current">Actual Fantasy Points (Current Week)</option>
            <option value="fantasy_points_season_avg">Average Fantasy Points (Season)</option>
            <option value="fantasy_points_last4_avg">Average Fantasy Points (Last 4 Games)</option>
            <option value="name">Player Name (A-Z)</option>
            <option value="passing_yards">Passing Yards</option>
            <option value="rushing_yards">Rushing Yards</option>
            <option value="receiving_yards">Receiving Yards</option>
            <option value="receptions">Receptions</option>
          </select>
        </div>
      </div>

      {/* Players Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('name')}
              >
                Player {sortBy === 'name' && (sortAscending ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Team
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Bye
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Owned
              </th>
              {/* Position-specific stat columns will be added dynamically */}
              {positionFilter === 'All' || positionFilter === 'QB' ? (
                <>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('passing_yards')}
                  >
                    Pass Yds {sortBy === 'passing_yards' && (sortAscending ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pass TD
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    INT
                  </th>
                </>
              ) : null}
              {(positionFilter === 'All' || ['QB', 'RB', 'WR', 'TE'].includes(positionFilter)) && (
                <>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('rushing_yards')}
                  >
                    Rush Yds {sortBy === 'rushing_yards' && (sortAscending ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rush TD
                  </th>
                </>
              )}
              {(positionFilter === 'All' || ['RB', 'WR', 'TE'].includes(positionFilter)) && (
                <>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('receiving_yards')}
                  >
                    Rec Yds {sortBy === 'receiving_yards' && (sortAscending ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rec TD
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('receptions')}
                  >
                    Rec {sortBy === 'receptions' && (sortAscending ? '↑' : '↓')}
                  </th>
                </>
              )}
              {(positionFilter === 'All' || positionFilter === 'K') && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Kicking Pts
                </th>
              )}
              {(positionFilter === 'All' || positionFilter === 'DEF') && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Defense Pts
                </th>
              )}
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => handleSort('fantasy_points_current')}
              >
                FP {sortBy.startsWith('fantasy_points') && (sortAscending ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedPlayers.map(player => {
              const ownership = playerOwnershipMap.get(player.id)
              const isMyPlayer = ownership?.isMyTeam || false
              const isOwned = !!ownership
              const weekData = getPlayerWeekData(player.id)
              const fantasyPoints = getFantasyPoints(player)

              return (
                <tr
                  key={player.id}
                  className={`
                    ${isMyPlayer ? 'bg-green-50 dark:bg-green-900/20' : ''}
                    ${isOwned && !isMyPlayer ? 'opacity-60' : ''}
                    hover:bg-gray-50 dark:hover:bg-gray-700/50
                  `}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {player.full_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200">
                      {player.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {player.nfl_team || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {player.bye_week ? `W${player.bye_week}` : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {isMyPlayer ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">My Team</span>
                    ) : ownership ? (
                      <span className="text-gray-500 dark:text-gray-400">{ownership.teamName}</span>
                    ) : (
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">Available</span>
                    )}
                  </td>
                  {/* Position-specific stats */}
                  {(positionFilter === 'All' || positionFilter === 'QB') && (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getStatValue(player, 'passing_yards') || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getStatValue(player, 'passing_tds') || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getStatValue(player, 'interceptions') || '—'}
                      </td>
                    </>
                  )}
                  {(positionFilter === 'All' || ['QB', 'RB', 'WR', 'TE'].includes(positionFilter)) && (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getStatValue(player, 'rushing_yards') || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getStatValue(player, 'rushing_tds') || '—'}
                      </td>
                    </>
                  )}
                  {(positionFilter === 'All' || ['RB', 'WR', 'TE'].includes(positionFilter)) && (
                    <>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getStatValue(player, 'receiving_yards') || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getStatValue(player, 'receiving_tds') || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getStatValue(player, 'receptions') || '—'}
                      </td>
                    </>
                  )}
                  {(positionFilter === 'All' || positionFilter === 'K') && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {getStatValue(player, 'kicking_points') || '—'}
                    </td>
                  )}
                  {(positionFilter === 'All' || positionFilter === 'DEF') && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {getStatValue(player, 'defense_points') || '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {fantasyPoints !== null ? fantasyPoints.toFixed(1) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {sortedPlayers.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No players found matching your filters.
        </div>
      )}
    </div>
  )
}

