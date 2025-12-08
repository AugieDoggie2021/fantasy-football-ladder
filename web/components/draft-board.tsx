'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateDraftPicksForLeague, makeDraftPick } from '@/app/actions/draft'
import { useDraftRealtime } from '@/lib/hooks/use-draft-realtime'
import { DraftTimer } from '@/components/draft-timer'
import { DraftQueue } from '@/components/draft-queue'
import { DraftPlayerList } from '@/components/draft-player-list'
import { DraftStatusPanel } from '@/components/draft-status-panel'
import { DraftMobileActions } from '@/components/draft-mobile-actions'
import { useToast } from '@/components/toast-provider'

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
  pick_due_at?: string | null
  picked_at?: string | null
  teams: Team | null
  players: Player | null
}

interface DraftBoardProps {
  leagueId: string
  teams: Team[]
  draftPicks: DraftPick[]
  availablePlayers: Player[]
  draftStatus?: string
  currentPickId?: string | null
  userTeamId?: string | null
  isCommissioner?: boolean
}

export function DraftBoard({
  leagueId,
  teams,
  draftPicks: initialDraftPicks,
  availablePlayers: initialAvailablePlayers,
  draftStatus: initialDraftStatus = 'scheduled',
  currentPickId: initialCurrentPickId = null,
  userTeamId = null,
  isCommissioner = false,
}: DraftBoardProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [selectedPick, setSelectedPick] = useState<string | null>(null)
  const [positionFilter, setPositionFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQueue, setShowQueue] = useState(userTeamId !== null) // Show queue by default if user has a team
  const [recentlyPicked, setRecentlyPicked] = useState<Set<string>>(new Set())
  const [retryCount, setRetryCount] = useState(0)
  
  // Realtime subscription
  const {
    picks: realtimePicks,
    draftState: realtimeDraftState,
    isConnected,
    error: realtimeError,
  } = useDraftRealtime({
    leagueId,
    enabled: initialDraftStatus === 'in_progress' || initialDraftStatus === 'paused',
    onPickUpdate: (pick) => {
      // Show animation when pick is made
      if (pick.player_id) {
        setRecentlyPicked(prev => new Set([...prev, pick.id]))
        // Remove animation class after animation completes
        setTimeout(() => {
          setRecentlyPicked(prev => {
            const next = new Set(prev)
            next.delete(pick.id)
            return next
          })
        }, 2000)
      }
    },
    onDraftStatusChange: (state) => {
      // Optional: Handle draft status changes
      if (process.env.NODE_ENV === 'development') {
        console.log('Draft status changed:', state.draft_status)
      }
    },
  })

  // Use realtime data if available, otherwise fall back to initial props
  const draftPicks = realtimePicks.length > 0 ? realtimePicks : initialDraftPicks
  const draftStatus = realtimeDraftState?.draft_status || initialDraftStatus
  const currentPickId = realtimeDraftState?.current_pick_id || initialCurrentPickId

  // Update available players based on realtime picks
  const [availablePlayers, setAvailablePlayers] = useState(initialAvailablePlayers)
  const [draftedPlayerIds, setDraftedPlayerIds] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    const drafted = new Set(
      draftPicks.filter(p => p.player_id).map(p => p.player_id).filter(Boolean) as string[]
    )
    setDraftedPlayerIds(drafted)
    const available = initialAvailablePlayers.filter(p => !drafted.has(p.id))
    setAvailablePlayers(available)
  }, [draftPicks, initialAvailablePlayers])

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

  const handleAssignPlayer = async (pickId: string, playerId: string, retries = 0) => {
    setLoading(true)
    
    // Optimistic update: remove player from available list immediately
    setAvailablePlayers(prev => prev.filter(p => p.id !== playerId))
    
    // Add to recently picked for animation
    setRecentlyPicked(prev => new Set([...prev, pickId]))
    
    const formData = new FormData()
    formData.append('draft_pick_id', pickId)
    formData.append('player_id', playerId)
    formData.append('league_id', leagueId)

    try {
      const result = await makeDraftPick(formData)
      
      if (result.error) {
        // Handle network errors with retry
        if (result.error.includes('network') || result.error.includes('fetch') || result.error.includes('timeout')) {
          if (retries < 2) {
            // Retry after a short delay
            await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))
            setLoading(false)
            return handleAssignPlayer(pickId, playerId, retries + 1)
          }
        }

        // Revert handled via realtime updates - no need to manually revert
        setRecentlyPicked(prev => {
          const next = new Set(prev)
          next.delete(pickId)
          return next
        })
        
        // Show error toast
        showToast(result.error, 'error')
        
        // If it's a concurrent pick error, refresh to get latest state
        if (result.error.includes('already been made') || result.error.includes('no longer available')) {
          setTimeout(() => {
            router.refresh()
          }, 2000)
        }
      } else {
        setSelectedPick(null)
        showToast('Pick made successfully!', 'success')
        
        // Remove animation after it completes
        setTimeout(() => {
          setRecentlyPicked(prev => {
            const next = new Set(prev)
            next.delete(pickId)
            return next
          })
        }, 2000)
        // Don't refresh - realtime will update automatically
      }
    } catch (error: any) {
      // Handle unexpected errors
      console.error('Unexpected error making draft pick:', error)
      
      // Revert handled via realtime updates - no need to manually revert
      setRecentlyPicked(prev => {
        const next = new Set(prev)
        next.delete(pickId)
        return next
      })
      
      // Retry on network errors
      if (retries < 2 && (error.message?.includes('network') || error.message?.includes('fetch'))) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))
        setLoading(false)
        return handleAssignPlayer(pickId, playerId, retries + 1)
      }
      
      showToast('Failed to make pick. Please try again.', 'error')
    } finally {
      setLoading(false)
      setRetryCount(0)
    }
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

  // Memoize picks by round for performance
  const picksByRound = useMemo(() => {
    const grouped: Record<number, DraftPick[]> = {}
    draftPicks.forEach(pick => {
      if (!grouped[pick.round]) {
        grouped[pick.round] = []
      }
      grouped[pick.round].push(pick)
    })
    return grouped
  }, [draftPicks])

  // Memoize max round and next pick calculations
  const maxRound = useMemo(() => 
    draftPicks.length > 0 ? Math.max(...draftPicks.map(p => p.round)) : 0
  , [draftPicks])
  
  const nextPick = useMemo(() => 
    currentPickId 
      ? draftPicks.find(p => p.id === currentPickId && !p.player_id)
      : draftPicks.find(p => !p.player_id)
  , [currentPickId, draftPicks])
  
  // Check if it's the user's turn
  const isUserTurn = useMemo(() => 
    nextPick && userTeamId && nextPick.team_id === userTeamId
  , [nextPick, userTeamId])
  
  const canMakePick = isUserTurn || isCommissioner

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Mobile Quick Actions */}
      <DraftMobileActions
        leagueId={leagueId}
        teamId={userTeamId}
        availablePlayers={availablePlayers}
        draftedPlayerIds={draftedPlayerIds}
        isUserTurn={isUserTurn}
        isCommissioner={isCommissioner}
        onSelectPlayer={(playerId) => {
          if (selectedPick) {
            handleAssignPlayer(selectedPick, playerId)
          } else if (currentPickId && canMakePick) {
            handleAssignPlayer(currentPickId, playerId)
          }
        }}
        currentPickId={currentPickId}
      />

      {/* Realtime Connection Status */}
      {(initialDraftStatus === 'in_progress' || initialDraftStatus === 'paused') && (
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-600 dark:text-gray-400">
            {isConnected ? 'Live updates active' : 'Reconnecting...'}
          </span>
          {realtimeError && (
            <span className="text-red-600 dark:text-red-400 text-xs">
              ({realtimeError.message})
            </span>
          )}
        </div>
      )}

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
          {/* Draft Status Panel */}
          <DraftStatusPanel
            draftPicks={draftPicks}
            teams={teams}
            currentPickId={currentPickId}
            draftStatus={draftStatus}
            nextPick={nextPick || null}
            isUserTurn={isUserTurn}
            userTeamId={userTeamId}
          />

          {/* Draft Timer (if in progress) */}
          {nextPick && (draftStatus === 'in_progress' || draftStatus === 'paused') && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <DraftTimer
                pickDueAt={(nextPick as any).pick_due_at || null}
                isPaused={draftStatus === 'paused'}
                size="md"
              />
            </div>
          )}

          {/* Draft Board and Queue Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Main Draft Board */}
            <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Draft Board
              </h2>
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: maxRound }, (_, i) => i + 1).map(round => {
                const roundPicks = picksByRound[round] || []
                // Lazy load: only render visible rounds initially, then load more on scroll
                const isVisible = round <= Math.min(maxRound, 5) || roundPicks.some(p => p.id === currentPickId)
                
                if (!isVisible && roundPicks.every(p => p.player_id)) {
                  // Skip fully completed rounds that aren't near current pick
                  return null
                }
                
                return (
                  <div key={round} className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">
                      Round {round}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2">
                      {roundPicks.map(pick => {
                        const isCurrentPick = pick.id === currentPickId
                        const isUserPick = userTeamId && pick.team_id === userTeamId
                        const canSelect = (isCurrentPick && canMakePick) || isCommissioner
                        
                        const isRecentlyPicked = recentlyPicked.has(pick.id)
                        return (
                        <button
                          key={pick.id}
                          onClick={() => canSelect && !pick.player_id ? setSelectedPick(pick.id) : null}
                          disabled={!canSelect || !!pick.player_id}
                          className={`text-left p-3 sm:p-2 rounded border text-xs sm:text-sm transition-all duration-300 touch-manipulation min-h-[44px] ${
                            isRecentlyPicked
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-400 animate-pulse'
                              : selectedPick === pick.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : isCurrentPick && !pick.player_id
                              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-400 animate-pulse'
                              : pick.player_id
                              ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                              : canSelect
                              ? 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:shadow-md'
                              : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            #{pick.overall_pick} - {pick.teams?.name}
                          </div>
                          {pick.players ? (
                            <div className={`text-xs mt-1 transition-all ${
                              isRecentlyPicked
                                ? 'text-green-700 dark:text-green-300 font-semibold'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {pick.players.full_name} ({pick.players.position})
                              {isRecentlyPicked && (
                                <span className="ml-2 animate-bounce">✓</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 dark:text-gray-500 italic mt-1">
                              {isCurrentPick ? 'On the clock' : 'Not selected'}
                            </div>
                          )}
                        </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            </div>

            {/* Draft Queue Sidebar - Hidden on mobile, shown on desktop */}
            {userTeamId && (
              <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
                <DraftQueue
                  leagueId={leagueId}
                  teamId={userTeamId}
                  availablePlayers={availablePlayers}
                  draftedPlayerIds={draftedPlayerIds}
                  isEditable={!isCommissioner || userTeamId !== null}
                />
              </div>
            )}
          </div>

          {/* Player Selection */}
          {selectedPick && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Select Player
                </h2>
                <button
                  onClick={() => setSelectedPick(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <DraftPlayerList
                players={availablePlayers}
                leagueId={leagueId}
                teamId={userTeamId}
                onSelectPlayer={(playerId) => handleAssignPlayer(selectedPick, playerId)}
                draftedPlayerIds={draftedPlayerIds}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

