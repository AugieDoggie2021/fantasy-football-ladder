import { createClient } from '@/lib/supabase/server'
import { calculateStandings } from '@/lib/standings-helpers'

interface LeagueStandingsProps {
  leagueId: string
  currentUserId?: string
}

export async function LeagueStandings({ leagueId, currentUserId }: LeagueStandingsProps) {
  const supabase = await createClient()
  
  // Get current user if not provided
  if (!currentUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    currentUserId = user?.id
  }

  // Fetch all completed matchups for this league
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
        name
      ),
      away_team:teams!matchups_away_team_id_fkey (
        id,
        name
      )
    `)
    .eq('league_id', leagueId)
    .eq('status', 'final')

  if (!matchups || matchups.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No completed matchups yet. Standings will appear once scores are finalized.
      </div>
    )
  }

  // Transform matchups for standings calculation
  const transformedMatchups = matchups.map(m => ({
    home_team_id: m.home_team_id,
    home_team_name: (m.home_team as any)?.name || 'Unknown Team',
    home_score: Number(m.home_score) || 0,
    away_team_id: m.away_team_id,
    away_team_name: (m.away_team as any)?.name || 'Unknown Team',
    away_score: Number(m.away_score) || 0,
    status: m.status,
  }))

  const standings = calculateStandings(transformedMatchups)

  // Also fetch all teams to ensure we show all teams (even with 0-0 records)
  const { data: allTeams } = await supabase
    .from('teams')
    .select('id, name, logo_url, owner_user_id')
    .eq('league_id', leagueId)
    .eq('is_active', true)
  
  // Create a map of team data for easy lookup
  const teamDataMap = new Map(
    allTeams?.map(t => [t.id, { name: t.name, logo_url: t.logo_url, owner_user_id: t.owner_user_id }]) || []
  )

  // Add teams with no matchups yet
  const allTeamIds = new Set(standings.map(s => s.teamId))
  allTeams?.forEach(team => {
    if (!allTeamIds.has(team.id)) {
      standings.push({
        teamId: team.id,
        teamName: team.name,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      })
    }
  })

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Team
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              W
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              L
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              T
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              PF
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              PA
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Diff
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {standings.map((standing, index) => {
            const pointDiff = standing.pointsFor - standing.pointsAgainst
            const teamData = teamDataMap.get(standing.teamId)
            const isUserTeam = currentUserId && teamData?.owner_user_id === currentUserId
            const isTop3 = index < 3
            
            return (
              <tr
                key={standing.teamId}
                className={`
                  ${isTop3 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                  ${isUserTeam ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' : ''}
                `}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {index + 1}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    {teamData?.logo_url ? (
                      <img
                        src={teamData.logo_url}
                        alt={teamData.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                        {teamData?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <span className={isUserTeam ? 'font-semibold' : ''}>
                      {standing.teamName}
                      {isUserTeam && (
                        <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">(You)</span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                  {standing.wins}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                  {standing.losses}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                  {standing.ties}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                  {standing.pointsFor.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                  {standing.pointsAgainst.toFixed(2)}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${
                  pointDiff > 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : pointDiff < 0 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {pointDiff > 0 ? '+' : ''}{pointDiff.toFixed(2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

