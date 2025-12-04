'use server'

import { createClient } from '@/lib/supabase/server'
import { calculatePlayerScore } from '@/lib/scoring'
import type { PlayerWeekStats } from '@/lib/scoring'
import type { PlayerScoreEntry } from '@/types/player-scores'

// Re-export for convenience
export type { PlayerScoreEntry } from '@/types/player-scores'

/**
 * Get player scores for a league, season, and week
 * 
 * @param leagueId - The league ID
 * @param seasonYear - The NFL season year (e.g., 2024)
 * @param week - The NFL week number (1-18)
 * @returns Array of player score entries for all rostered players in the league
 */
export async function getPlayerScoresForWeek(
  leagueId: string,
  seasonYear: number,
  week: number
): Promise<{ data?: PlayerScoreEntry[]; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user has access to this league (RLS should handle this, but we check anyway)
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    return { error: 'League not found or access denied' }
  }

  // Fetch all rostered players for this league
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
      ),
      teams!inner (
        id,
        name
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

  // Fetch player week stats for this season/week
  // Use season_year and nfl_week since stats may not be linked to league_week_id yet
  const { data: stats, error: statsError } = await supabase
    .from('player_week_stats')
    .select('*')
    .eq('season_year', seasonYear)
    .eq('nfl_week', week)
    .in('player_id', playerIds)

  if (statsError) {
    return { error: `Failed to fetch player stats: ${statsError.message}` }
  }

  // Create a map of player_id -> stats
  const statsMap = new Map<string, any>()
  stats?.forEach(stat => {
    statsMap.set(stat.player_id, {
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
    })
  })

  // Build the result array
  const playerScores: PlayerScoreEntry[] = rosters.map((roster: any) => {
    const player = roster.players
    const team = roster.teams
    const stats = statsMap.get(roster.player_id) || {
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

    const fantasyPoints = calculatePlayerScore(stats, player.position)

    return {
      player_id: player.id,
      player_name: player.full_name,
      player_position: player.position,
      nfl_team: player.nfl_team,
      team_id: team.id,
      team_name: team.name,
      is_starter: roster.is_starter,
      slot_type: roster.slot_type,
      stats,
      fantasy_points: fantasyPoints,
    }
  })

  return { data: playerScores }
}

