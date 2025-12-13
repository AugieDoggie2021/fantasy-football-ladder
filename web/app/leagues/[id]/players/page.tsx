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
import { PageEventTracker } from '@/components/analytics/page-event-tracker'
import { AnalyticsEvents } from '@/lib/analytics/events'

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

  const canAccessCommissioner = canAccessCommissionerTools(user.id, profile, league)

  if (league.status !== 'active') {
    redirect(`/leagues/${params.id}`)
  }

  const { data: userTeam } = await supabase
    .from('teams')
    .select('id, name')
    .eq('league_id', params.id)
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!userTeam) {
    redirect(`/leagues/${params.id}`)
  }

  const { data: currentWeek } = await supabase
    .from('league_weeks')
    .select('*')
    .eq('league_id', params.id)
    .eq('is_current', true)
    .single()

  const { data: allWeeks } = await supabase
    .from('league_weeks')
    .select('*')
    .eq('league_id', params.id)
    .order('week_number', { ascending: true })

  const { data: allPlayers } = await supabase
    .from('players')
    .select('*')
    .order('position', { ascending: true })
    .order('full_name', { ascending: true })

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

  const scoringConfig = parseScoringConfig(league.scoring_settings)

  const playerStatsMap = new Map<
    string,
    Map<
      string,
      {
        stats: PlayerWeekStats
        weekNumber: number
        weekStatus: string
        fantasyPoints: number
      }
    >
  >()

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

    const player = allPlayers?.find((p) => p.id === stat.player_id)
    const position = player?.position || 'QB'
    const fantasyPoints = calculatePlayerScoreWithConfig(stats, position, scoringConfig)

    playerStatsMap.get(stat.player_id)!.set(week.id, {
      stats,
      weekNumber: week.week_number,
      weekStatus: week.status,
      fantasyPoints,
    })
  })

  const playerAverages = new Map<
    string,
    {
      seasonAvg: number | null
      last4Avg: number | null
    }
  >()

  allPlayers?.forEach((player) => {
    const weekStats = playerStatsMap.get(player.id)
    if (!weekStats || weekStats.size === 0) {
      playerAverages.set(player.id, { seasonAvg: null, last4Avg: null })
      return
    }

    const allPoints = Array.from(weekStats.values()).map((w) => w.fantasyPoints)
    const seasonAvg = allPoints.length > 0 ? allPoints.reduce((sum, p) => sum + p, 0) / allPoints.length : null

    const last4 = Array.from(weekStats.values())
      .sort((a, b) => b.weekNumber - a.weekNumber)
      .slice(0, 4)
      .map((w) => w.fantasyPoints)
    const last4Avg = last4.length > 0 ? last4.reduce((sum, p) => sum + p, 0) / last4.length : null

    playerAverages.set(player.id, { seasonAvg, last4Avg })
  })

  const { data: leagueTeams } = await supabase
    .from('teams')
    .select('id, name')
    .eq('league_id', params.id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#0a1020] to-[#0b1220]">
      <PageEventTracker
        event={AnalyticsEvents.PLAYERS_VIEWED}
        properties={{
          league_id: params.id,
        }}
      />
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 transition-colors"
          >
            <HomeIcon size={20} />
            <span className="text-sm font-semibold">Back to Overview</span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-display font-semibold text-white">{league.name}</h1>
            <p className="text-sm text-slate-400">Players</p>
            <LeagueContextHeader
              seasonYear={league.seasons?.[0]?.year}
              promotionGroupName={league.promotion_groups?.name}
              leagueName={league.name}
              tier={league.tier}
              currentWeek={currentWeek?.week_number || null}
              showLeagueName={false}
            />
          </div>
        </div>

        <LeagueNavigation leagueId={params.id} isCommissioner={canAccessCommissioner} />

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
  )
}
