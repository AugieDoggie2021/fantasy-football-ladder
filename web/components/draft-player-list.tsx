'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addPlayerToQueue } from '@/app/actions/draft'
import { useDebounce } from '@/lib/hooks/use-debounce'

interface Player {
  id: string
  full_name: string
  position: string
  nfl_team: string | null
  bye_week: number | null
}

interface DraftPlayerListProps {
  players: Player[]
  leagueId: string
  teamId: string | null
  onSelectPlayer: (playerId: string) => void
  draftedPlayerIds?: Set<string>
  className?: string
}

type SortOption = 'name' | 'position' | 'team' | 'bye'
type PositionFilter = 'All' | 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF'

const POSITIONS: PositionFilter[] = ['All', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF']

/**
 * DraftPlayerList component with enhanced search, filters, and sorting
 * 
 * Features:
 * - Debounced search (name, team)
 * - Position filter
 * - Multiple sort options (name, position, team, bye week)
 * - Quick-add to queue
 * - Visual indicators for drafted players
 * - Responsive design
 */
export function DraftPlayerList({
  players,
  leagueId,
  teamId,
  onSelectPlayer,
  draftedPlayerIds = new Set(),
  className = '',
}: DraftPlayerListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('All')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortAscending, setSortAscending] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(50) // Lazy load: show 50 initially
  const listRef = useRef<HTMLDivElement>(null)

  // Debounced search using custom hook
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players.filter(player => {
      // Filter out drafted players
      if (draftedPlayerIds.has(player.id)) {
        return false
      }

      // Position filter
      if (positionFilter !== 'All' && player.position !== positionFilter) {
        return false
      }

      // Search filter
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase()
        const matchesName = player.full_name.toLowerCase().includes(query)
        const matchesTeam = player.nfl_team?.toLowerCase().includes(query) || false
        if (!matchesName && !matchesTeam) {
          return false
        }
      }

      return true
    })

    // Sort players
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name)
          break
        case 'position':
          comparison = a.position.localeCompare(b.position)
          if (comparison === 0) {
            comparison = a.full_name.localeCompare(b.full_name)
          }
          break
        case 'team':
          const aTeam = a.nfl_team || ''
          const bTeam = b.nfl_team || ''
          comparison = aTeam.localeCompare(bTeam)
          if (comparison === 0) {
            comparison = a.full_name.localeCompare(b.full_name)
          }
          break
        case 'bye':
          const aBye = a.bye_week || 99
          const bBye = b.bye_week || 99
          comparison = aBye - bBye
          if (comparison === 0) {
            comparison = a.full_name.localeCompare(b.full_name)
          }
          break
      }

      return sortAscending ? comparison : -comparison
    })

    return filtered
  }, [players, debouncedSearch, positionFilter, sortBy, sortAscending, draftedPlayerIds])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(50)
  }, [debouncedSearch, positionFilter, sortBy])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(50)
  }, [debouncedSearch, positionFilter, sortBy])

  const handleAddToQueue = useCallback(async (playerId: string) => {
    if (!teamId) return

    setLoading(playerId)
    try {
      const result = await addPlayerToQueue(leagueId, teamId, playerId)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      alert('Failed to add player to queue')
    } finally {
      setLoading(null)
    }
  }, [leagueId, teamId, router])

  const handleSort = useCallback((newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortAscending(!sortAscending)
    } else {
      setSortBy(newSortBy)
      setSortAscending(true)
    }
  }, [sortBy, sortAscending])

  const SortButton = ({ option, label }: { option: SortOption; label: string }) => (
    <button
      onClick={() => handleSort(option)}
      className={`px-3 py-1 text-xs rounded transition-colors ${
        sortBy === option
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {label}
      {sortBy === option && (
        <span className="ml-1">{sortAscending ? '↑' : '↓'}</span>
      )}
    </button>
  )

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      <div className="space-y-2 sm:space-y-3">
        {/* Search Bar */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search players by name or team..."
          className="w-full px-4 py-3 sm:py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-base sm:text-sm min-h-[44px]"
        />

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Position Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Position:
            </label>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value as PositionFilter)}
              className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              {POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</span>
            <div className="flex gap-1">
              <SortButton option="name" label="Name" />
              <SortButton option="position" label="Pos" />
              <SortButton option="team" label="Team" />
              <SortButton option="bye" label="Bye" />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredAndSortedPlayers.length} of {players.length} available players
        </div>
      </div>

      {/* Player List with Lazy Loading */}
      <div 
        ref={listRef}
        className="max-h-[600px] overflow-y-auto space-y-2"
        onScroll={(e) => {
          // Lazy load more items when scrolling near bottom
          const target = e.currentTarget
          const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight
          if (scrollPercentage > 0.8 && visibleCount < filteredAndSortedPlayers.length) {
            setVisibleCount(prev => Math.min(prev + 50, filteredAndSortedPlayers.length))
          }
        }}
      >
        {filteredAndSortedPlayers.length > 0 ? (
          filteredAndSortedPlayers.slice(0, visibleCount).map(player => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {/* Player Info */}
              <button
                onClick={() => onSelectPlayer(player.id)}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {player.full_name}
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    {player.position}
                  </span>
                  {player.nfl_team && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {player.nfl_team}
                    </span>
                  )}
                  {player.bye_week && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      (Bye: {player.bye_week})
                    </span>
                  )}
                </div>
              </button>

              {/* Actions */}
              {teamId && (
                <button
                  onClick={() => handleAddToQueue(player.id)}
                  disabled={loading === player.id}
                  className="flex-shrink-0 px-3 py-2.5 sm:py-1.5 text-xs sm:text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-0"
                  title="Add to queue"
                >
                  {loading === player.id ? 'Adding...' : '+ Queue'}
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No players match your filters.</p>
            <p className="text-xs mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
        {visibleCount < filteredAndSortedPlayers.length && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            Showing {visibleCount} of {filteredAndSortedPlayers.length} players. Scroll for more...
          </div>
        )}
      </div>
    </div>
  )
}

