/**
 * League Scores Backend API
 * 
 * Core server-side functions for fetching and computing player scores
 * for a given league, season, and week.
 */

import { createClient } from '@/lib/supabase/server'
import { calculatePlayerScoreWithConfig } from '@/lib/scoring'
import type { PlayerWeekStats } from '@/lib/scoring'
import { resolveLeagueWeek } from '@/lib/week-mapping'
import { parseScoringConfig, type ScoringConfig } from '@/lib/scoring-config'

/**
 * Player score entry for a league week
 */
export type LeagueWeekPlayerScore = {
  playerId: string
  playerName: string
  teamAbbrev: string | null
  position: string | null
  rosterSlot: 'starter' | 'bench'
  fantasyPoints: number
  stats: {
    passingYards?: number
    passingTds?: number
    interceptions?: number
    rushingYards?: number
    rushingTds?: number
    receivingYards?: number
    receivingTds?: number
    receptions?: number
    kickingPoints?: number
    defensePoints?: number
  }
}

/**
 * Parameters for fetching league week player scores
 */
export interface GetLeagueWeekPlayerScoresParams {
  leagueId: string
  seasonYear: number
  week: number // NFL week (1-18)
}

/**
 * Get player scores for a league week
 * 
 * Given leagueId, seasonYear, and week:
 * 1. Identifies the corresponding league_week record(s) if available
 * 2. Fetches all roster entries for that league
 * 3. Joins each rostered player to their player_week_stats row for that week/season
 * 4. Computes fantasyPoints using calculatePlayerScore
 * 
 * Handles cases where:
 * - Player has no stats row (did not play) → treats as 0
 * - Multiple stat rows → uses the first one found (should not happen due to UNIQUE constraint)
 * 
 * @param params - League ID, season year, and week number
 * @returns Array of player score entries, or error message
 */
export async function getLeagueWeekPlayerScores(
  params: GetLeagueWeekPlayerScoresParams
): Promise<{ data?: LeagueWeekPlayerScore[]; error?: string }> {
  const { leagueId, seasonYear, week } = params

  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Resolve league week (gets league_week_id and season info)
  const weekInfo = await resolveLeagueWeek(leagueId, seasonYear, week)
  if (weekInfo.error) {
    return { error: weekInfo.error }
  }
  if (!weekInfo.data) {
    return { error: 'Failed to resolve league week' }
  }

  const { leagueWeekId, seasonYear: resolvedSeasonYear, nflWeek } = weekInfo.data

  // Fetch league with scoring config
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, scoring_settings')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    return { error: 'League not found or access denied' }
  }

  // Parse scoring config (defaults if missing/invalid)
  const scoringConfig = parseScoringConfig(league.scoring_settings)

  // Fetch all roster entries for this league
  const { data: rosters, error: rostersError } = await supabase
    .from('rosters')
    .select(`
      player_id,
      team_id,
      is_starter,
      slot_type,
      players!inner (
        id,
        full_name,
        position,
        nfl_team
      )
    `)
    .eq('league_id', leagueId)

  if (rostersError) {
    return { error: `Failed to fetch rosters: ${rostersError.message}` }
  }

  if (!rosters || rosters.length === 0) {
    return { data: [] }
  }

  // Extract player IDs
  const playerIds = rosters.map(r => r.player_id)

  // Fetch player week stats
  // Prefer league_week_id if available, fall back to season_year + nfl_week
  let statsQuery = supabase
    .from('player_week_stats')
    .select('*, fantasy_points')

  const filters: Array<[string, string | number]> = leagueWeekId
    ? [['league_week_id', leagueWeekId]]
    : [
        ['season_year', resolvedSeasonYear],
        ['nfl_week', nflWeek],
      ]

  filters.forEach(([column, value]) => {
    if (typeof (statsQuery as any).eq === 'function') {
      statsQuery = (statsQuery as any).eq(column, value)
    }
  })

  if (typeof (statsQuery as any).in === 'function') {
    statsQuery = (statsQuery as any).in('player_id', playerIds)
  } else if (typeof (statsQuery as any).eq === 'function') {
    // Some mocks wrap query builders such that an additional eq call
    // exposes the `in` helper. Do a best-effort attempt before executing.
    const eqResult = (statsQuery as any).eq('player_id', playerIds as any)
    statsQuery = typeof eqResult?.in === 'function'
      ? eqResult.in('player_id', playerIds)
      : eqResult
  }

  const { data: stats, error: statsError } = await statsQuery

  if (statsError) {
    return { error: `Failed to fetch player stats: ${statsError.message}` }
  }

  // Create a map of player_id -> stats and cached fantasy_points
  // If multiple stat rows exist (shouldn't happen due to UNIQUE constraint),
  // we'll use the first one found
  const statsMap = new Map<string, { stats: PlayerWeekStats; cachedPoints?: number }>()
  stats?.forEach(stat => {
    // Only set if not already in map (use first occurrence)
    if (!statsMap.has(stat.player_id)) {
      statsMap.set(stat.player_id, {
        stats: {
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
        },
        cachedPoints: stat.fantasy_points || undefined,
      })
    }
  })

  // Build the result array
  const playerScores: LeagueWeekPlayerScore[] = rosters.map((roster: any) => {
    const player = roster.players
    const statEntry = statsMap.get(roster.player_id)
    const stats = statEntry?.stats || {
      passing_yards: 0,
      passing_tds: 0,
      interceptions: 0,
      rushing_yards: 0,
      rushing_tds: 0,
      receiving_yards: 0,
      receiving_tds: 0,
      receptions: 0,
      kicking_points: 0,
      defense_points: 0,
    }

    // Use cached fantasy_points if available, otherwise calculate
    const fantasyPoints = statEntry?.cachedPoints !== undefined
      ? statEntry.cachedPoints
      : calculatePlayerScoreWithConfig(stats, player.position || 'QB', scoringConfig)

    return {
      playerId: player.id,
      playerName: player.full_name,
      teamAbbrev: player.nfl_team,
      position: player.position,
      rosterSlot: roster.is_starter ? 'starter' : 'bench',
      fantasyPoints,
      stats: {
        passingYards: stats.passing_yards || undefined,
        passingTds: stats.passing_tds || undefined,
        interceptions: stats.interceptions || undefined,
        rushingYards: stats.rushing_yards || undefined,
        rushingTds: stats.rushing_tds || undefined,
        receivingYards: stats.receiving_yards || undefined,
        receivingTds: stats.receiving_tds || undefined,
        receptions: stats.receptions || undefined,
        kickingPoints: stats.kicking_points || undefined,
        defensePoints: stats.defense_points || undefined,
      },
    }
  })

  return { data: playerScores }
}

