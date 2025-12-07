import { createClient } from '@/lib/supabase/server'
import { calculatePlayerScoreWithConfig } from '@/lib/scoring'
import { parseScoringConfig } from '@/lib/scoring-config'
import type { PlayerWeekStats } from '@/lib/scoring'

/**
 * Get player week stats for a specific week
 */
export async function getPlayerWeekStats(
  playerId: string,
  leagueWeekId: string
): Promise<PlayerWeekStats | null> {
  const supabase = await createClient()
  
  const { data: stats } = await supabase
    .from('player_week_stats')
    .select('*')
    .eq('player_id', playerId)
    .eq('league_week_id', leagueWeekId)
    .single()

  if (!stats) {
    return null
  }

  return {
    passing_yards: stats.passing_yards || 0,
    passing_tds: stats.passing_tds || 0,
    interceptions: stats.interceptions || 0,
    rushing_yards: stats.rushing_yards || 0,
    rushing_tds: stats.rushing_tds || 0,
    receiving_yards: stats.receiving_yards || 0,
    receiving_tds: stats.receiving_tds || 0,
    receptions: stats.receptions || 0,
    kicking_points: stats.kicking_points || 0,
    defense_points: stats.defense_points || 0,
  }
}

/**
 * Calculate average fantasy points for a player over the season
 */
export async function calculateSeasonAverage(
  playerId: string,
  leagueId: string
): Promise<number | null> {
  const supabase = await createClient()

  // Get league scoring config
  const { data: league } = await supabase
    .from('leagues')
    .select('scoring_settings')
    .eq('id', leagueId)
    .single()

  if (!league) {
    return null
  }

  const scoringConfig = parseScoringConfig(league.scoring_settings)

  // Get player position
  const { data: player } = await supabase
    .from('players')
    .select('position')
    .eq('id', playerId)
    .single()

  if (!player) {
    return null
  }

  // Get all stats for this player in this league
  const { data: allStats } = await supabase
    .from('player_week_stats')
    .select('*')
    .eq('player_id', playerId)
    .eq('league_id', leagueId)

  if (!allStats || allStats.length === 0) {
    return null
  }

  // Calculate fantasy points for each week and average
  const points = allStats.map(stat => {
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
    return calculatePlayerScoreWithConfig(stats, player.position, scoringConfig)
  })

  const total = points.reduce((sum, p) => sum + p, 0)
  return total / points.length
}

/**
 * Calculate average fantasy points for a player over the last 4 games
 */
export async function calculateLast4Average(
  playerId: string,
  leagueId: string
): Promise<number | null> {
  const supabase = await createClient()

  // Get league scoring config
  const { data: league } = await supabase
    .from('leagues')
    .select('scoring_settings')
    .eq('id', leagueId)
    .single()

  if (!league) {
    return null
  }

  const scoringConfig = parseScoringConfig(league.scoring_settings)

  // Get player position
  const { data: player } = await supabase
    .from('players')
    .select('position')
    .eq('id', playerId)
    .single()

  if (!player) {
    return null
  }

  // Get all stats for this player in this league, ordered by week (most recent first)
  const { data: allStats } = await supabase
    .from('player_week_stats')
    .select(`
      *,
      league_weeks!inner (
        week_number,
        status
      )
    `)
    .eq('player_id', playerId)
    .eq('league_id', leagueId)
    .order('league_weeks(week_number)', { ascending: false })
    .limit(4)

  if (!allStats || allStats.length === 0) {
    return null
  }

  // Calculate fantasy points for each week and average
  const points = allStats.map(stat => {
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
    return calculatePlayerScoreWithConfig(stats, player.position, scoringConfig)
  })

  const total = points.reduce((sum, p) => sum + p, 0)
  return total / points.length
}

/**
 * Check if a player is available (not on any roster in the league)
 */
export async function isPlayerAvailable(
  playerId: string,
  leagueId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data: roster } = await supabase
    .from('rosters')
    .select('id')
    .eq('player_id', playerId)
    .eq('league_id', leagueId)
    .limit(1)
    .single()

  return !roster
}

/**
 * Get team that owns a player in a league
 */
export async function getPlayerOwnership(
  playerId: string,
  leagueId: string
): Promise<{ teamId: string; teamName: string; ownerUserId: string } | null> {
  const supabase = await createClient()

  const { data: roster } = await supabase
    .from('rosters')
    .select(`
      team_id,
      teams!inner (
        id,
        name,
        owner_user_id
      )
    `)
    .eq('player_id', playerId)
    .eq('league_id', leagueId)
    .single()

  if (!roster || !roster.teams) {
    return null
  }

  const team = roster.teams as any
  return {
    teamId: team.id,
    teamName: team.name,
    ownerUserId: team.owner_user_id,
  }
}

