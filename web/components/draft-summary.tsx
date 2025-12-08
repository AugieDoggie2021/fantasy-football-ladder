'use client'

import { useState } from 'react'
import Link from 'next/link'

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
}

interface DraftPick {
  id: string
  round: number
  overall_pick: number
  team_id: string
  player_id: string
  teams?: Team | null
  players?: Player | null
}

interface DraftSummaryProps {
  leagueId: string
  leagueName: string
  teams: Team[]
  draftPicks: DraftPick[]
  draftCompletedAt: string | null
  className?: string
}

/**
 * DraftSummary component - Post-draft summary view with roster verification
 * 
 * Features:
 * - Complete draft results by round
 * - Team-by-team roster summary
 * - Draft statistics
 * - Roster verification
 */
export function DraftSummary({
  leagueId,
  leagueName,
  teams,
  draftPicks,
  draftCompletedAt,
  className = '',
}: DraftSummaryProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  // Group picks by team
  const picksByTeam: Record<string, DraftPick[]> = {}
  teams.forEach(team => {
    picksByTeam[team.id] = draftPicks
      .filter(pick => pick.team_id === team.id && pick.player_id)
      .sort((a, b) => a.overall_pick - b.overall_pick)
  })

  // Group picks by round
  const picksByRound: Record<number, DraftPick[]> = {}
  draftPicks
    .filter(pick => pick.player_id)
    .forEach(pick => {
      if (!picksByRound[pick.round]) {
        picksByRound[pick.round] = []
      }
      picksByRound[pick.round].push(pick)
    })

  // Calculate statistics
  const totalPicks = draftPicks.filter(p => p.player_id).length
  const totalRounds = Math.max(...draftPicks.map(p => p.round), 0)
  const picksPerTeam = totalPicks / teams.length

  // Group players by position for each team
  const getTeamRosterByPosition = (teamId: string) => {
    const teamPicks = picksByTeam[teamId] || []
    const byPosition: Record<string, Player[]> = {}
    
    teamPicks.forEach(pick => {
      if (pick.players) {
        const pos = pick.players.position
        if (!byPosition[pos]) {
          byPosition[pos] = []
        }
        byPosition[pos].push(pick.players)
      }
    })
    
    return byPosition
  }

  const selectedTeam = selectedTeamId ? teams.find(t => t.id === selectedTeamId) : null
  const selectedTeamRoster = selectedTeamId ? getTeamRosterByPosition(selectedTeamId) : null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Draft Complete!</h1>
        <p className="text-indigo-100">
          {leagueName} • {totalPicks} picks across {totalRounds} rounds
        </p>
        {draftCompletedAt && (
          <p className="text-sm text-indigo-200 mt-2">
            Completed: {new Date(draftCompletedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalPicks}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Picks
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalRounds}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Rounds
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {picksPerTeam.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Picks per Team
          </div>
        </div>
      </div>

      {/* Team Roster Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Team Rosters
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => {
            const teamPicks = picksByTeam[team.id] || []
            const rosterByPos = getTeamRosterByPosition(team.id)
            
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(selectedTeamId === team.id ? null : team.id)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedTeamId === team.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-2">
                  {team.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {teamPicks.length} players
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(rosterByPos).map(([pos, players]) => (
                    <span
                      key={pos}
                      className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {pos}: {players.length}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Team Detailed Roster */}
      {selectedTeam && selectedTeamRoster && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedTeam.name} - Complete Roster
            </h2>
            <button
              onClick={() => setSelectedTeamId(null)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Close
            </button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(selectedTeamRoster)
              .sort(([posA], [posB]) => posA.localeCompare(posB))
              .map(([position, players]) => (
                <div key={position}>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {position} ({players.length})
                  </h3>
                  <div className="space-y-1">
                    {players.map(player => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700/50"
                      >
                        <span className="text-sm text-gray-900 dark:text-white">
                          {player.full_name}
                        </span>
                        {player.nfl_team && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {player.nfl_team}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Draft Results by Round */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Draft Results by Round
        </h2>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Array.from({ length: totalRounds }, (_, i) => i + 1).map(round => {
            const roundPicks = picksByRound[round] || []
            return (
              <div key={round} className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Round {round}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {roundPicks
                    .sort((a, b) => a.overall_pick - b.overall_pick)
                    .map(pick => (
                      <div
                        key={pick.id}
                        className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"
                      >
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          #{pick.overall_pick}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {pick.teams?.name}
                        </div>
                        {pick.players && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {pick.players.full_name} ({pick.players.position})
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href={`/leagues/${leagueId}`}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          View League
        </Link>
        <Link
          href={`/leagues/${leagueId}/draft`}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          View Draft Board
        </Link>
      </div>
    </div>
  )
}

