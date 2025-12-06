import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getLeagueWeekPlayerScores } from '@/lib/league-scores'

/**
 * GET /api/leagues/[id]/scores/summary
 * 
 * Query parameters:
 * - seasonYear: NFL season year (e.g., 2024) - required
 * - week: NFL week number (1-18) - required
 * 
 * Returns JSON array of team score summaries with total fantasy points per team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const leagueId = params.id
  // Next.js 15: request.nextUrl is now async and must be awaited
  const nextUrl = await request.nextUrl
  const searchParams = nextUrl.searchParams
  const seasonYearParam = searchParams.get('seasonYear')
  const weekParam = searchParams.get('week')

  if (!seasonYearParam) {
    return NextResponse.json(
      { error: 'seasonYear query parameter is required' },
      { status: 400 }
    )
  }

  if (!weekParam) {
    return NextResponse.json(
      { error: 'week query parameter is required' },
      { status: 400 }
    )
  }

  const seasonYear = parseInt(seasonYearParam, 10)
  const week = parseInt(weekParam, 10)

  if (isNaN(seasonYear) || seasonYear < 2000 || seasonYear > 2100) {
    return NextResponse.json(
      { error: 'seasonYear must be a valid year' },
      { status: 400 }
    )
  }

  if (isNaN(week) || week < 1 || week > 18) {
    return NextResponse.json(
      { error: 'week must be between 1 and 18' },
      { status: 400 }
    )
  }

  // Get matchup info for this week to link teams to matchups
  const { data: leagueWeekInfo } = await supabase
    .from('league_weeks')
    .select('id, week_number')
    .eq('league_id', leagueId)
    .eq('week_number', week)
    .single()

  let matchupMap = new Map<string, string>() // team_id -> matchup_id
  if (leagueWeekInfo) {
    const { data: matchups } = await supabase
      .from('matchups')
      .select('id, home_team_id, away_team_id')
      .eq('league_id', leagueId)
      .eq('league_week_id', leagueWeekInfo.id)

    matchups?.forEach((m) => {
      matchupMap.set(m.home_team_id, m.id)
      matchupMap.set(m.away_team_id, m.id)
    })
  }

  // Fetch rosters to map player_id -> team_id
  const { data: rosters } = await supabase
    .from('rosters')
    .select('player_id, team_id, teams!inner (id, name)')
    .eq('league_id', leagueId)

  const playerToTeamMap = new Map<string, string>()
  const teamIdToNameMap = new Map<string, string>()
  rosters?.forEach((roster: any) => {
    playerToTeamMap.set(roster.player_id, roster.team_id)
    const team = roster.teams as any
    if (team) {
      teamIdToNameMap.set(team.id, team.name)
    }
  })

  // Get player scores
  const scoresResult = await getLeagueWeekPlayerScores({
    leagueId,
    seasonYear,
    week,
  })

  if (scoresResult.error) {
    return NextResponse.json(
      { error: scoresResult.error },
      { status: scoresResult.error.includes('Not authenticated') ? 401 : 500 }
    )
  }

  const playerScores = scoresResult.data || []

  // Aggregate scores by team (only count starters)
  const teamTotals = new Map<string, number>()
  playerScores.forEach((score) => {
    if (score.rosterSlot === 'starter') {
      const teamId = playerToTeamMap.get(score.playerId)
      if (teamId) {
        const current = teamTotals.get(teamId) || 0
        teamTotals.set(teamId, current + score.fantasyPoints)
      }
    }
  })

  // Build response - include all teams, even if they have 0 points
  const allTeamIds = new Set<string>()
  rosters?.forEach((roster: any) => {
    allTeamIds.add(roster.team_id)
  })

  const summaries = Array.from(allTeamIds).map((teamId) => ({
    teamId,
    teamName: teamIdToNameMap.get(teamId) || 'Unknown Team',
    totalFantasyPoints: Math.round((teamTotals.get(teamId) || 0) * 100) / 100,
    matchupId: matchupMap.get(teamId) || null,
  }))

  // Sort by total points descending
  summaries.sort((a, b) => b.totalFantasyPoints - a.totalFantasyPoints)

  return NextResponse.json(summaries)
}

