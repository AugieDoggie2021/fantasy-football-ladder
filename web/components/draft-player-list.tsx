'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { addPlayerToQueue } from '@/app/actions/draft'
import { useDebounce } from '@/lib/hooks/use-debounce'

interface Player {
  id: string
  full_name: string
  position: string
  nfl_team: string | null
  bye_week: number | null
  adp?: number | null
  average_draft_position?: number | null
  rank?: number | null
  external_id?: string | null
}

interface DraftPlayerListProps {
  players: Player[]
  leagueId: string
  teamId: string | null
  onSelectPlayer: (playerId: string) => void
  draftedPlayerIds?: Set<string>
  queuedPlayerIds?: Set<string>
  canDraft?: boolean
  draftStatus?: string
  className?: string
  onQueueAdd?: (playerId: string) => void
}

type PositionFilter = 'All' | 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF'
const POSITIONS: PositionFilter[] = ['All', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF']

const normalizeDraftStatus = (status?: string | null) => {
  if (!status) return 'pre_draft'
  if (status === 'scheduled') return 'pre_draft'
  if (status === 'in_progress') return 'live'
  return status
}

const getAdpValue = (player: Player): number => {
  const numericCandidates = [
    player.adp,
    player.average_draft_position,
    player.rank,
  ].filter((v): v is number => typeof v === 'number')

  if (numericCandidates.length > 0) {
    return numericCandidates[0]
  }

  if (player.external_id) {
    const parsed = parseInt(player.external_id.replace(/\D/g, ''), 10)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  return Number.POSITIVE_INFINITY
}

const formatAdp = (value: number) => {
  if (!Number.isFinite(value)) return '—'
  return value % 1 === 0 ? value.toString() : value.toFixed(1)
}

/**
 * ADP-sorted player board with queue + draft actions
 */
export function DraftPlayerList({
  players,
  leagueId,
  teamId,
  onSelectPlayer,
  draftedPlayerIds = new Set(),
  queuedPlayerIds = new Set(),
  canDraft = false,
  draftStatus = 'pre_draft',
  className = '',
  onQueueAdd,
}: DraftPlayerListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('All')
  const [loading, setLoading] = useState<string | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 250)

  const filteredPlayers = useMemo(() => {
    return players
      .filter((player) => {
        if (draftedPlayerIds.has(player.id)) return false
        if (positionFilter !== 'All' && player.position !== positionFilter) return false

        if (debouncedSearch) {
          const query = debouncedSearch.toLowerCase()
          return (
            player.full_name.toLowerCase().includes(query) ||
            player.nfl_team?.toLowerCase().includes(query)
          )
        }

        return true
      })
      .sort((a, b) => {
        const adpA = getAdpValue(a)
        const adpB = getAdpValue(b)
        if (adpA === adpB) {
          return a.full_name.localeCompare(b.full_name)
        }
        return adpA - adpB
      })
  }, [players, draftedPlayerIds, positionFilter, debouncedSearch])

  const handleAddToQueue = useCallback(
    async (playerId: string) => {
      if (!teamId) return
      setLoading(playerId)
      const result = await addPlayerToQueue(leagueId, teamId, playerId)
      if (result.error) {
        alert(result.error)
      } else {
        onQueueAdd?.(playerId)
        router.refresh()
      }
      setLoading(null)
    },
    [leagueId, teamId, router]
  )

  const normalizedStatus = normalizeDraftStatus(draftStatus)
  const draftDisabled = !canDraft || normalizedStatus !== 'live'

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name or team..."
            className="w-full px-4 py-3 sm:py-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-base sm:text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value as PositionFilter)}
            className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {filteredPlayers.length} players available
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="grid grid-cols-12 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40">
          <div className="col-span-5 sm:col-span-4">Player</div>
          <div className="col-span-2 sm:col-span-2">Team</div>
          <div className="col-span-2 sm:col-span-2">ADP</div>
          <div className="col-span-3 sm:col-span-4 text-right">Action</div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[640px] overflow-y-auto">
          {filteredPlayers.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              No players match your filters.
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const adpValue = getAdpValue(player)
              const isQueued = queuedPlayerIds.has(player.id)
              const queueDisabled = !teamId || isQueued || loading === player.id

              return (
                <div
                  key={player.id}
                  className="grid grid-cols-12 items-center px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                >
                  <div className="col-span-5 sm:col-span-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {player.full_name}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {player.position}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {player.nfl_team || '—'} {player.bye_week ? `· Bye ${player.bye_week}` : ''}
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-2 text-gray-800 dark:text-gray-200">
                    {player.nfl_team || '—'}
                  </div>

                  <div className="col-span-2 sm:col-span-2 font-mono text-gray-900 dark:text-white">
                    {formatAdp(adpValue)}
                  </div>

                  <div className="col-span-3 sm:col-span-4 flex justify-end gap-2">
                    {teamId && (
                      <button
                        onClick={() => handleAddToQueue(player.id)}
                        disabled={queueDisabled}
                        className={`px-3 py-2 text-xs rounded-md border ${
                          isQueued
                            ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/30 dark:text-green-200'
                            : 'border-gray-300 bg-white text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-white hover:border-indigo-400'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {isQueued ? 'Queued' : loading === player.id ? 'Adding...' : 'Queue'}
                      </button>
                    )}
                    {canDraft && (
                      <button
                        onClick={() => onSelectPlayer(player.id)}
                        disabled={draftDisabled}
                        className="px-3 py-2 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {normalizedStatus === 'paused' ? 'Paused' : 'Draft Player'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
