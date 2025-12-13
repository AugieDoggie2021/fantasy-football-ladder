'use client'

import { useMemo } from 'react'

interface Team {
  id: string
  name: string
  draft_position?: number | null
}

interface DraftPick {
  id: string
  round: number
  overall_pick: number
  team_id: string
  player_id: string | null
  picked_at?: string | null
  is_auto_pick?: boolean | null
  teams?: Team | null
  players?: {
    id: string
    full_name: string
    position: string
    nfl_team?: string | null
  } | null
}

interface DraftStatusPanelProps {
  draftPicks: DraftPick[]
  teams: Team[]
  currentPickId: string | null
  draftStatus: string
  userTeamId?: string | null
  className?: string
}

type PositionSlot = 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'K' | 'DEF'
const POSITION_SLOTS: PositionSlot[] = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF']

const buildTeamPositionProgress = (teams: Team[], picks: DraftPick[]) => {
  const orderedPicks = [...picks].sort((a, b) => a.overall_pick - b.overall_pick)

  return teams.map(team => {
    const teamPicks = orderedPicks.filter(p => p.team_id === team.id && p.player_id && p.players)
    const usedPlayerIds = new Set<string>()

    const takePlayerFor = (positions: string[]) => {
      const found = teamPicks.find(p => p.players && positions.includes(p.players.position) && !usedPlayerIds.has(p.players.id))
      if (found && found.players) {
        usedPlayerIds.add(found.players.id)
        return found.players
      }
      return null
    }

    const slots: Record<PositionSlot, { name: string; position: string } | null> = {
      QB: takePlayerFor(['QB']),
      RB: takePlayerFor(['RB']),
      WR: takePlayerFor(['WR']),
      TE: takePlayerFor(['TE']),
      FLEX: null,
      K: takePlayerFor(['K']),
      DEF: takePlayerFor(['DEF']),
    }

    // Flex pulls from remaining RB/WR/TE
    slots.FLEX = takePlayerFor(['RB', 'WR', 'TE'])

    const benchCount = teamPicks.filter(p => p.players && !usedPlayerIds.has(p.players.id)).length

    return {
      team,
      slots,
      benchCount,
    }
  })
}

/**
 * DraftStatusPanel component providing:
 * - Draft order clarity (current + upcoming picks)
 * - Position-aware roster progress for every team
 * Layout is columnar and scroll-safe for a constrained viewport.
 */
export function DraftStatusPanel({
  draftPicks,
  teams,
  currentPickId,
  draftStatus,
  userTeamId = null,
  className = '',
}: DraftStatusPanelProps) {
  const orderedPicks = useMemo(
    () => [...draftPicks].sort((a, b) => a.overall_pick - b.overall_pick),
    [draftPicks]
  )
  const currentPickIndex = useMemo(() => {
    if (!currentPickId) {
      return orderedPicks.findIndex(p => !p.player_id)
    }
    return orderedPicks.findIndex(p => p.id === currentPickId)
  }, [orderedPicks, currentPickId])
  const upcomingPickIds = useMemo(() => {
    if (currentPickIndex === -1) return new Set<string>()
    return new Set(
      orderedPicks
        .slice(currentPickIndex + 1, currentPickIndex + 4)
        .map(p => p.id)
    )
  }, [orderedPicks, currentPickIndex])

  const positionProgress = useMemo(
    () => buildTeamPositionProgress(teams, draftPicks),
    [teams, draftPicks]
  )

  const picksMade = draftPicks.filter(p => p.player_id).length
  const totalPicks = draftPicks.length
  const progressPercent = totalPicks > 0 ? Math.round((picksMade / totalPicks) * 100) : 0

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-3 min-h-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Draft Order</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">
            {draftStatus.replace('_', ' ')}
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          {orderedPicks.map((pick, idx) => {
            const isCurrent = currentPickIndex === idx
            const isUpcoming = upcomingPickIds.has(pick.id)
            const isUserTeam = userTeamId === pick.team_id
            return (
              <div
                key={pick.id}
                className={`flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                  isCurrent
                    ? 'bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400'
                    : isUpcoming
                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">#{pick.overall_pick}</span>
                  <span className={`font-medium ${isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                    {pick.teams?.name || 'TBD'}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">R{pick.round}</span>
                  {isUserTeam && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-200">
                      You
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-300 text-yellow-900">
                      On the clock
                    </span>
                  )}
                  {isUpcoming && !isCurrent && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-800/50 text-indigo-800 dark:text-indigo-200">
                      Up next
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {pick.players ? `${pick.players.full_name} (${pick.players.position})` : 'Pending'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-3 min-h-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Roster Progress</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {picksMade} / {totalPicks} picks • {progressPercent}%
          </span>
        </div>
        <div className="space-y-3 flex-1 min-h-0 overflow-y-auto">
          {positionProgress.map(({ team, slots, benchCount }) => {
            const isUserTeam = userTeamId === team.id
            return (
              <div
                key={team.id}
                className={`p-3 rounded-md border ${isUserTeam ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{team.name}</span>
                    {isUserTeam && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-200">
                        You
                      </span>
                    )}
                  </div>
                  {benchCount > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Bench +{benchCount}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {POSITION_SLOTS.map((slot) => {
                    const assigned = slots[slot]
                    return (
                      <div
                        key={slot}
                        className={`p-2 rounded border text-xs ${assigned ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{slot}</span>
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">
                          {assigned ? assigned.name : 'Empty'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
