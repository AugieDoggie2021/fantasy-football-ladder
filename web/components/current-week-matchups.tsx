import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { LivePillIcon } from '@/components/icons'

interface CurrentWeekMatchupsProps {
  leagueId: string
  currentUserId?: string
}

export async function CurrentWeekMatchups({ leagueId, currentUserId }: CurrentWeekMatchupsProps) {
  const supabase = await createClient()
  
  // Get current user if not provided
  if (!currentUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    currentUserId = user?.id
  }

  // Find current week
  const { data: currentWeek } = await supabase
    .from('league_weeks')
    .select('*')
    .eq('league_id', leagueId)
    .eq('is_current', true)
    .single()

  if (!currentWeek) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        No current week set for this league.
      </div>
    )
  }

  // Fetch matchups for current week
  const { data: matchups } = await supabase
    .from('matchups')
    .select(`
      id,
      home_team_id,
      home_score,
      away_team_id,
      away_score,
      status,
      home_team:teams!matchups_home_team_id_fkey (
        id,
        name,
        logo_url,
        owner_user_id
      ),
      away_team:teams!matchups_away_team_id_fkey (
        id,
        name,
        logo_url,
        owner_user_id
      )
    `)
    .eq('league_id', leagueId)
    .eq('league_week_id', currentWeek.id)
    .order('id', { ascending: true })

  if (!matchups || matchups.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        No matchups scheduled for Week {currentWeek.week_number}.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Week {currentWeek.week_number} Matchups
        </h3>
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded ${
          currentWeek.status === 'completed'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
            : currentWeek.status === 'in_progress'
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        }`}>
          {currentWeek.status === 'in_progress' && <LivePillIcon size={14} />}
          {currentWeek.status === 'completed' 
            ? 'Final' 
            : currentWeek.status === 'in_progress' 
            ? 'Live' 
            : currentWeek.status === 'scheduled'
            ? 'Scheduled'
            : currentWeek.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      
      <div className="space-y-4">
        {matchups.map((matchup: any) => {
          const homeTeam = matchup.home_team
          const awayTeam = matchup.away_team
          const homeScore = Number(matchup.home_score) || 0
          const awayScore = Number(matchup.away_score) || 0
          const isFinal = matchup.status === 'final'
          const homeWon = isFinal && homeScore > awayScore
          const awayWon = isFinal && awayScore > homeScore
          const isTie = isFinal && homeScore === awayScore
          const isUserHomeTeam = currentUserId && homeTeam?.owner_user_id === currentUserId
          const isUserAwayTeam = currentUserId && awayTeam?.owner_user_id === currentUserId

          return (
            <div
              key={matchup.id}
              className={`p-4 border rounded-lg ${
                isUserHomeTeam || isUserAwayTeam
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Home Team */}
                <div className={`flex-1 flex items-center gap-3 ${
                  homeWon ? 'font-semibold' : ''
                }`}>
                  {homeTeam?.logo_url ? (
                    <Image
                      src={homeTeam.logo_url}
                      alt={homeTeam.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                      {homeTeam?.name?.charAt(0) || 'H'}
                    </div>
                  )}
                  <div>
                    <div className={`text-sm ${isUserHomeTeam ? 'font-semibold text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                      {homeTeam?.name || 'Home Team'}
                      {isUserHomeTeam && (
                        <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">(You)</span>
                      )}
                    </div>
                    {isFinal && (
                      <div className={`text-lg font-bold ${
                        homeWon
                          ? 'text-green-600 dark:text-green-400'
                          : isTie
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {homeScore.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* VS / Score */}
                <div className="px-4 text-center">
                  {isFinal ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Final
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      VS
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className={`flex-1 flex items-center gap-3 justify-end ${
                  awayWon ? 'font-semibold' : ''
                }`}>
                  <div className="text-right">
                    <div className={`text-sm ${isUserAwayTeam ? 'font-semibold text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                      {awayTeam?.name || 'Away Team'}
                      {isUserAwayTeam && (
                        <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">(You)</span>
                      )}
                    </div>
                    {isFinal && (
                      <div className={`text-lg font-bold ${
                        awayWon
                          ? 'text-green-600 dark:text-green-400'
                          : isTie
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {awayScore.toFixed(2)}
                      </div>
                    )}
                  </div>
                  {awayTeam?.logo_url ? (
                    <Image
                      src={awayTeam.logo_url}
                      alt={awayTeam.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                      {awayTeam?.name?.charAt(0) || 'A'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

