'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { generateDraftPicksForLeague, makeDraftPick } from '@/app/actions/draft'
import { useDraftRealtime, DraftFeedEvent } from '@/lib/hooks/use-draft-realtime'
import { useExpiredPicksCheck } from '@/lib/hooks/use-expired-picks-check'
import { DraftTimer } from '@/components/draft-timer'
import { DraftQueue } from '@/components/draft-queue'
import { DraftPlayerList } from '@/components/draft-player-list'
import { DraftStatusPanel } from '@/components/draft-status-panel'
import { DraftMobileActions } from '@/components/draft-mobile-actions'
import { DraftFeed } from '@/components/draft-feed'
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
  adp?: number | null
  average_draft_position?: number | null
  rank?: number | null
  external_id?: string | null
}

interface DraftPick {
  id: string
  round: number
  overall_pick: number
  team_id: string
  player_id: string | null
  pick_due_at?: string | null
  pick_started_at?: string | null
  pick_duration_seconds?: number | null
  picked_at?: string | null
  is_auto_pick?: boolean | null
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
  draftSettings?: Record<string, any> | null
}

const normalizeDraftStatus = (status?: string | null) => {
  if (!status) return 'pre_draft'
  if (status === 'in_progress') return 'live'
  if (status === 'scheduled') return 'pre_draft'
  return status
}

export function DraftBoard({
  leagueId,
  teams,
  draftPicks: initialDraftPicks,
  availablePlayers: initialAvailablePlayers,
  draftStatus: initialDraftStatus = 'pre_draft',
  currentPickId: initialCurrentPickId = null,
  userTeamId = null,
  isCommissioner = false,
  draftSettings = null,
}: DraftBoardProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [recentlyPicked, setRecentlyPicked] = useState<Set<string>>(new Set())
  const [availablePlayers, setAvailablePlayers] = useState(initialAvailablePlayers)
  const [draftedPlayerIds, setDraftedPlayerIds] = useState<Set<string>>(new Set())
  const [queuedPlayerIds, setQueuedPlayerIds] = useState<Set<string>>(new Set())
  const [teamNameDraft, setTeamNameDraft] = useState(() => teams.find(t => t.id === userTeamId)?.name || '')
  const [renaming, setRenaming] = useState(false)

  const syncQueuedIds = useCallback((ids: string[]) => setQueuedPlayerIds(new Set(ids)), [])
  const handleQueueAdd = useCallback((playerId: string) => {
    setQueuedPlayerIds((prev) => {
      const next = new Set(prev)
      next.add(playerId)
      return next
    })
  }, [])

  const {
    picks: realtimePicks,
    draftState: realtimeDraftState,
    feedEvents: realtimeFeedEvents,
    isConnected,
    error: realtimeError,
  } = useDraftRealtime({
    leagueId,
    enabled: normalizeDraftStatus(initialDraftStatus) !== 'completed',
    onPickUpdate: (pick) => {
      if (pick.player_id) {
        setRecentlyPicked((prev) => new Set([...prev, pick.id]))
        setTimeout(() => {
          setRecentlyPicked((prev) => {
            const next = new Set(prev)
            next.delete(pick.id)
            return next
          })
        }, 2000)
      }
    },
  })

  const draftPicks = realtimePicks.length > 0 ? realtimePicks : initialDraftPicks
  const rawDraftStatus = realtimeDraftState?.draft_status || initialDraftStatus
  const draftStatus = normalizeDraftStatus(rawDraftStatus)
  const currentPickId = realtimeDraftState?.current_pick_id || initialCurrentPickId
  const pausedRemainingSeconds =
    (realtimeDraftState?.draft_settings as any)?.paused_remaining_seconds ??
    (normalizeDraftStatus(initialDraftStatus) === 'paused'
      ? (draftSettings as any)?.paused_remaining_seconds ?? null
      : null)

  useExpiredPicksCheck({
    enabled: draftStatus === 'live',
    intervalMs: 10000,
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Expired picks check error:', error)
      }
    },
  })

  useEffect(() => {
    const drafted = new Set(
      draftPicks.filter((p) => p.player_id).map((p) => p.player_id).filter(Boolean) as string[]
    )
    setDraftedPlayerIds(drafted)
    const available = initialAvailablePlayers.filter((p) => !drafted.has(p.id))
    setAvailablePlayers(available)
  }, [draftPicks, initialAvailablePlayers])

  const handleGenerateDraft = async () => {
    if (!confirm('Generate draft picks? This will create picks for all teams.')) {
      return
    }
    setLoading(true)
    const result = await generateDraftPicksForLeague(leagueId, 14)
    if ((result as any)?.error) {
      alert((result as any).error)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  const handleAssignPlayer = async (pickId: string, playerId: string, retries = 0) => {
    if (!pickId) {
      showToast('No active pick available right now.', 'error')
      return
    }

    setLoading(true)
    setAvailablePlayers((prev) => prev.filter((p) => p.id !== playerId))
    setRecentlyPicked((prev) => new Set([...prev, pickId]))

    const formData = new FormData()
    formData.append('draft_pick_id', pickId)
    formData.append('player_id', playerId)
    formData.append('league_id', leagueId)

    try {
      const result = await makeDraftPick(formData)

      if ((result as any)?.error) {
        const errMsg = (result as any).error as string
        setRecentlyPicked((prev) => {
          const next = new Set(prev)
          next.delete(pickId)
          return next
        })
        showToast(errMsg, 'error')
        if (errMsg.includes('already been made') || errMsg.includes('no longer available')) {
          setTimeout(() => router.refresh(), 1500)
        }
      } else {
        showToast('Pick made successfully!', 'success')
        setTimeout(() => {
          setRecentlyPicked((prev) => {
            const next = new Set(prev)
            next.delete(pickId)
            return next
          })
        }, 2000)
      }
    } catch (error: any) {
      setRecentlyPicked((prev) => {
        const next = new Set(prev)
        next.delete(pickId)
        return next
      })
      if (
        retries < 2 &&
        (error?.message?.includes('network') || error?.message?.includes('fetch'))
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1)))
        setLoading(false)
        return handleAssignPlayer(pickId, playerId, retries + 1)
      }
      showToast('Failed to make pick. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const currentPick = useMemo(() => {
    if (currentPickId) {
      return draftPicks.find((p) => p.id === currentPickId) || null
    }
    return draftPicks.find((p) => !p.player_id) || null
  }, [currentPickId, draftPicks])

  const isUserTurn = useMemo(
    () => currentPick && userTeamId && currentPick.team_id === userTeamId,
    [currentPick, userTeamId]
  )

  const canMakePick = Boolean(
    currentPick &&
      isUserTurn &&
      draftStatus === 'live' &&
      !currentPick.player_id
  )

  const onDraftPlayer = (playerId: string) => {
    if (!canMakePick || !currentPick?.id) {
      showToast('You can only draft when you are on the clock.', 'error')
      return
    }
    handleAssignPlayer(currentPick.id, playerId)
  }

  const mergedFeedEvents: DraftFeedEvent[] =
    realtimeFeedEvents && realtimeFeedEvents.length > 0
      ? realtimeFeedEvents
      : draftPicks
          .filter(p => p.player_id)
          .map((p): DraftFeedEvent => ({
            id: `fallback-${p.id}`,
            league_id: leagueId,
            pick_id: p.id,
            event_type: 'pick_made',
            payload: {
              round: p.round,
              overall_pick: p.overall_pick,
              team_id: p.team_id,
              player_id: p.player_id,
            },
            actor_user_id: null,
            is_auto_pick: p.is_auto_pick || false,
            created_at: p.picked_at || new Date().toISOString(),
            draft_picks: {
              id: p.id,
              overall_pick: p.overall_pick,
              round: p.round,
              team_id: p.team_id,
              player_id: p.player_id,
              teams: p.teams ? { id: p.teams.id, name: p.teams.name } : null,
              players: p.players
                ? {
                    id: p.players.id,
                    full_name: p.players.full_name,
                    position: p.players.position,
                    nfl_team: p.players.nfl_team || null,
                  }
                : null,
            },
          }))

  const handleRenameTeam = async () => {
    if (!userTeamId) return
    if (!teamNameDraft.trim()) {
      showToast('Team name cannot be empty', 'error')
      return
    }
    setRenaming(true)
    const { error } = await supabase
      .from('teams')
      .update({ name: teamNameDraft.trim() })
      .eq('id', userTeamId)

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Team name updated', 'success')
      router.refresh()
    }
    setRenaming(false)
  }

  return (
    <div className="space-y-4 lg:space-y-5 pb-3 lg:pb-2 h-full">
      <DraftMobileActions
        leagueId={leagueId}
        teamId={userTeamId}
        availablePlayers={availablePlayers}
        draftedPlayerIds={draftedPlayerIds}
        queuedPlayerIds={queuedPlayerIds}
        canDraft={canMakePick}
        draftStatus={draftStatus}
        onSelectPlayer={onDraftPlayer}
        currentPickId={currentPickId}
        onQueueSync={syncQueuedIds}
        onQueueAdd={handleQueueAdd}
      />

      {(normalizeDraftStatus(initialDraftStatus) === 'live' || normalizeDraftStatus(initialDraftStatus) === 'paused') && (
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-3 sticky top-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Draft Status</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {draftStatus.replace('_', ' ')}
                  </span>
                  {isUserTurn && draftStatus === 'live' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">
                      You&apos;re up
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {draftStatus === 'paused'
                    ? 'Draft paused by commissioner'
                    : isUserTurn
                    ? 'You are on the clock'
                    : 'Waiting for current manager'}
                </p>
              </div>
              {currentPick && (draftStatus === 'live' || draftStatus === 'paused') ? (
                <div className="flex-1 flex md:justify-center">
                  <DraftTimer
                    pickDueAt={currentPick.pick_due_at || null}
                    pickStartedAt={(currentPick as any).pick_started_at || null}
                    pickDurationSeconds={(currentPick as any).pick_duration_seconds || null}
                    isPaused={draftStatus === 'paused'}
                    pausedSeconds={pausedRemainingSeconds}
                    size="xl"
                    label={draftStatus === 'paused' ? 'Draft Paused' : 'On the Clock'}
                  />
                </div>
              ) : (
                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                  Timer will appear once the draft is live.
                </div>
              )}
              <div className="text-right space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Current Pick</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentPick
                    ? `Round ${currentPick.round}, Pick ${currentPick.overall_pick}`
                    : 'Waiting for next pick'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentPick?.teams?.name || 'No active team'}
                </p>
              </div>
            </div>
            {draftStatus === 'paused' && !isCommissioner && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 px-3 py-2 text-sm text-yellow-800 dark:text-yellow-200">
                Draft paused by commissioner. Draft buttons are disabled until play resumes.
              </div>
            )}
          </div>

          <div
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5"
            style={{ height: 'calc(100vh - 220px)' }}
          >
            <div className="lg:col-span-3 flex flex-col gap-3 h-full min-h-0">
              <DraftStatusPanel
                draftPicks={draftPicks}
                teams={teams}
                currentPickId={currentPickId}
                draftStatus={draftStatus}
                userTeamId={userTeamId}
                className="flex-1 min-h-0"
              />

              <DraftFeed events={mergedFeedEvents} picks={draftPicks} teams={teams} className="min-h-0" />
            </div>

            <div className="lg:col-span-5 flex flex-col h-full min-h-0 space-y-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    Available Players
                  </h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    ADP sorted
                  </span>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <DraftPlayerList
                    players={availablePlayers}
                    leagueId={leagueId}
                    teamId={userTeamId}
                    draftedPlayerIds={draftedPlayerIds}
                    queuedPlayerIds={queuedPlayerIds}
                    canDraft={canMakePick}
                    draftStatus={draftStatus}
                    onSelectPlayer={onDraftPlayer}
                    onQueueAdd={handleQueueAdd}
                    className="h-full overflow-y-auto"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 hidden lg:block">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Your Team</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{teamNameDraft || 'My Team'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      value={teamNameDraft}
                      onChange={(e) => setTeamNameDraft(e.target.value)}
                      placeholder="Team name"
                    />
                    <button
                      onClick={handleRenameTeam}
                      disabled={!userTeamId || renaming}
                      className="px-3 py-1 rounded bg-indigo-600 text-white text-sm disabled:opacity-50"
                    >
                      {renaming ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 h-full min-h-0">
              {userTeamId && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 flex-1 min-h-0 overflow-hidden">
                  <div className="hidden lg:block h-full">
                    <DraftQueue
                      leagueId={leagueId}
                      teamId={userTeamId}
                      availablePlayers={availablePlayers}
                      draftedPlayerIds={draftedPlayerIds}
                      isEditable={true}
                      onQueueSync={syncQueuedIds}
                    />
                  </div>
                  <div className="lg:hidden text-sm text-gray-500 dark:text-gray-400">
                    Queue available on desktop view.
                  </div>
                </div>
              )}

              {!userTeamId && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Join a team to edit queue and roster.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
