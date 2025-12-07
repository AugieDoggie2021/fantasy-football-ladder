import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { PlayersTable } from '@/components/players-table'
import { HomeIcon } from '@/components/icons'
import { getCurrentUserWithProfile, canAccessCommissionerTools } from '@/lib/auth-roles'
import { LeagueContextHeader } from '@/components/league-context-header'
import { LeagueNavigation } from '@/components/league-navigation'
import { parseScoringConfig } from '@/lib/scoring-config'
import { calculatePlayerScoreWithConfig } from '@/lib/scoring'
import type { PlayerWeekStats } from '@/lib/scoring'

export default async function LeaguePlayersPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const userWithProfile = await getCurrentUserWithProfile()

  if (!userWithProfile?.user) {
    redirect('/login')
  }

  const { user, profile } = userWithProfile

  // Fetch league info
  const { data: league } = await supabase
    .from('leagues')
    .select(`
      *,
      seasons (
        id,
        year
      ),
      promotion_groups (
        id,
        name
      )
    `)
    .eq('id', params.id)
    .single()

  if (!league) {
    notFound()
  }

  // Check if user can access commissioner tools
  const canAccessCommissioner = canAccessCommissionerTools(user.id, profile, league)

  // Redirect if league is not active
  if (league.status !== 'active') {
    redirect(`/leagues/${params.id}`)
  }

  // Check if user has a team in this league
  const { data: userTeam } = await supabase
    .from('teams')
    .select('id, name')
    .eq('league_id', params.id)
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!userTeam) {
    // Redirect to league page if user doesn't have a team
    redirect(`/leagues/${params.id}`)
  }

  // Fetch current week
  const { data: currentWeek } = await supabase
    .from('league_weeks')
    .select('*')
    .eq('league_id', params.id)
    .eq('is_current', true)
    .single()

  // Fetch all weeks for this league (for week selector)
  const { data: allWeeks } = await supabase
    .from('league_weeks')
    .select('*')
    .eq('league_id', params.id)
    .order('week_number', { ascending: true })

  // Fetch all players
  const { data: allPlayers } = await supabase
    .from('players')
    .select('*')
    .order('position', { ascending: true })
    .order('full_name', { ascending: true })

  // Fetch all rosters in this league to determine ownership
  const { data: leagueRosters } = await supabase
    .from('rosters')
    .select(`
      player_id,
      teams!inner(
        id,
        name,
        owner_user_id
      )
    `)
    .eq('league_id', params.id)

  // Create a map of player_id to team ownership info
  const playerOwnershipMap = new Map<string, { teamId: string; teamName: string; isMyTeam: boolean }>()
  
  leagueRosters?.forEach((roster: any) => {
    const team = roster.teams
    if (team) {
      playerOwnershipMap.set(roster.player_id, {
        teamId: team.id,
        teamName: team.name,
        isMyTeam: team.owner_user_id === user.id,
      })
    }
  })

  // Fetch all player week stats for this league
  const { data: allPlayerStats } = await supabase
    .from('player_week_stats')
    .select(`
      *,
      league_weeks!inner (
        id,
        week_number,
        status,
        is_current
      )
    `)
    .eq('league_id', params.id)

  // Get league scoring config
  const scoringConfig = parseScoringConfig(league.scoring_settings)

  // Process stats data into a more usable format
  // Map: playerId -> weekId -> stats
  const playerStatsMap = new Map<string, Map<string, {
    stats: PlayerWeekStats
    weekNumber: number
    weekStatus: string
    fantasyPoints: number
  }>>()

  allPlayerStats?.forEach((stat: any) => {
    const week = stat.league_weeks as any
    if (!playerStatsMap.has(stat.player_id)) {
      playerStatsMap.set(stat.player_id, new Map())
    }
    
    const stats: PlayerWeekStats = {
      passing_yards: stat.passing_yards || 0,
      passing_tds: stat.passing_tds || 0,
      interceptions: stat.interceptions || 0,
      rushing_yards: stat.rushing_yards || 0,
      rushing_tds: stat.rushing_tds || 0,
      receiving_yards: stat.receiving_yards || 0,
      receiving_tds: stat.receiving_tds || 0,
      receptions: stat.receptions || 0,
      kicking_points: stat.kicking_points || 0,
      defense_points: stat.defense_points || 0,
    }

    // Get player position for scoring calculation
    const player = allPlayers?.find(p => p.id === stat.player_id)
    const position = player?.position || 'QB'
    const fantasyPoints = calculatePlayerScoreWithConfig(stats, position, scoringConfig)

    playerStatsMap.get(stat.player_id)!.set(week.id, {
      stats,
      weekNumber: week.week_number,
      weekStatus: week.status,
      fantasyPoints,
    })
  })

  // Calculate season averages and last 4 averages for each player
  const playerAverages = new Map<string, {
    seasonAvg: number | null
    last4Avg: number | null
  }>()

  allPlayers?.forEach(player => {
    const weekStats = playerStatsMap.get(player.id)
    if (!weekStats || weekStats.size === 0) {
      playerAverages.set(player.id, { seasonAvg: null, last4Avg: null })
      return
    }

    // Calculate season average
    const allPoints = Array.from(weekStats.values()).map(w => w.fantasyPoints)
    const seasonAvg = allPoints.length > 0 
      ? allPoints.reduce((sum, p) => sum + p, 0) / allPoints.length 
      : null

    // Calculate last 4 average
    const sortedWeeks = Array.from(weekStats.values())
      .sort((a, b) => b.weekNumber - a.weekNumber)
      .slice(0, 4)
    const last4Points = sortedWeeks.map(w => w.fantasyPoints)
    const last4Avg = last4Points.length > 0
      ? last4Points.reduce((sum, p) => sum + p, 0) / last4Points.length
      : null

    playerAverages.set(player.id, { seasonAvg, last4Avg })
  })

  // Fetch all teams in league for filter dropdown
  const { data: leagueTeams } = await supabase
    .from('teams')
    .select('id, name')
    .eq('league_id', params.id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
            >
              <HomeIcon size={20} />
              <span>← Back to Overview</span>
            </Link>
            
            <LeagueContextHeader
              seasonYear={league.seasons?.[0]?.year}
              promotionGroupName={league.promotion_groups?.name}
              leagueName={league.name}
              tier={league.tier}
              currentWeek={currentWeek?.week_number || null}
            />
            
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Players
              </h1>
            </div>

            <LeagueNavigation leagueId={params.id} isCommissioner={canAccessCommissioner} />
          </div>

          <PlayersTable
            players={allPlayers || []}
            playerOwnershipMap={playerOwnershipMap}
            playerStatsMap={playerStatsMap}
            playerAverages={playerAverages}
            currentWeek={currentWeek}
            allWeeks={allWeeks || []}
            leagueTeams={leagueTeams || []}
            userTeamId={userTeam.id}
            userId={user.id}
            leagueId={params.id}
            scoringConfig={scoringConfig}
          />
        </div>
      </div>
    </div>
  )
}

