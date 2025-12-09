'use client'

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
  teams?: Team | null
  players?: {
    id: string
    full_name: string
    position: string
  } | null
}

interface DraftStatusPanelProps {
  draftPicks: DraftPick[]
  teams: Team[]
  currentPickId: string | null
  draftStatus: string
  nextPick?: DraftPick | null
  isUserTurn?: boolean
  userTeamId?: string | null
  className?: string
}

/**
 * DraftStatusPanel component showing current pick, progress, and team summaries
 * 
 * Features:
 * - Current pick information
 * - Draft progress (picks made / total)
 * - Round progress
 * - Team pick counts
 * - Next picks preview
 * - Team roster summaries
 */
export function DraftStatusPanel({
  draftPicks,
  teams,
  currentPickId,
  draftStatus,
  nextPick,
  isUserTurn = false,
  userTeamId = null,
  className = '',
}: DraftStatusPanelProps) {
  // Calculate progress
  const totalPicks = draftPicks.length
  const picksMade = draftPicks.filter(p => p.player_id).length
  const progressPercent = totalPicks > 0 ? (picksMade / totalPicks) * 100 : 0

  // Get current round
  const currentRound = nextPick?.round || 1
  const maxRound = draftPicks.length > 0 ? Math.max(...draftPicks.map(p => p.round)) : 0

  // Calculate picks in current round
  const currentRoundPicks = draftPicks.filter(p => p.round === currentRound)
  const currentRoundPicksMade = currentRoundPicks.filter(p => p.player_id).length
  const currentRoundTotal = currentRoundPicks.length

  // Team pick counts
  const teamPickCounts = teams.map(team => {
    const picks = draftPicks.filter(p => p.team_id === team.id && p.player_id)
    return {
      team,
      count: picks.length,
      picks: picks.slice(0, 5), // Last 5 picks for preview
    }
  }).sort((a, b) => b.count - a.count)

  // Next few picks preview
  const nextPicks = draftPicks
    .filter(p => !p.player_id)
    .slice(0, 5)

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      {/* Current Pick Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Current Pick
        </h3>
        
        {nextPick ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Round {nextPick.round}, Pick {nextPick.overall_pick}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {nextPick.teams?.name || 'Unknown Team'}
                </p>
              </div>
              {isUserTurn && (
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                  Your Turn!
                </span>
              )}
            </div>
            
            {draftStatus === 'in_progress' && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isUserTurn ? 'Make your selection' : 'Waiting for pick...'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No current pick
          </p>
        )}
      </div>

      {/* Draft Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Draft Progress
        </h3>
        
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {picksMade} / {totalPicks} picks
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {progressPercent.toFixed(1)}% complete
            </p>
          </div>

          {/* Round Progress */}
          {currentRound > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Round {currentRound} of {maxRound}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentRoundPicksMade} / {currentRoundTotal} picks
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentRoundPicksMade / currentRoundTotal) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team Pick Counts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Team Progress
        </h3>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {teamPickCounts.map(({ team, count }) => {
            const isUserTeam = userTeamId === team.id
            return (
              <div
                key={team.id}
                className={`flex items-center justify-between p-2 rounded ${
                  isUserTeam
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-gray-50 dark:bg-gray-700/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    isUserTeam
                      ? 'text-indigo-900 dark:text-indigo-200'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {team.name}
                  </span>
                  {isUserTeam && (
                    <span className="text-xs px-1.5 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded">
                      You
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {count} picks
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Next Picks Preview */}
      {nextPicks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Upcoming Picks
          </h3>
          
          <div className="space-y-2">
            {nextPicks.map((pick, index) => (
              <div
                key={pick.id}
                className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700/30 text-sm"
              >
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    #{pick.overall_pick}
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {pick.teams?.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  R{pick.round}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

