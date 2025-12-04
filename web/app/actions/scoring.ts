'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculatePlayerScoreWithConfig } from '@/lib/scoring'
import type { PlayerWeekStats } from '@/lib/scoring'
import { parseScoringConfig } from '@/lib/scoring-config'

/**
 * Calculate and apply scores for a week (with dry-run support)
 */
export async function calculateAndApplyScoresForWeek(
  leagueId: string,
  leagueWeekId: string,
  options?: { dryRun?: boolean }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is league creator (commissioner) and fetch scoring config
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id, scoring_settings')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league || league.created_by_user_id !== user.id) {
    return { error: 'Only the league commissioner can calculate scores' }
  }

  // Parse scoring config
  const scoringConfig = parseScoringConfig(league.scoring_settings)

  // Fetch league week
  const { data: leagueWeek, error: weekError } = await supabase
    .from('league_weeks')
    .select('*')
    .eq('id', leagueWeekId)
    .eq('league_id', leagueId)
    .single()

  if (weekError || !leagueWeek) {
    return { error: 'League week not found' }
  }

  // Fetch all matchups for this week
  const { data: matchups, error: matchupsError } = await supabase
    .from('matchups')
    .select(`
      *,
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
    .eq('league_week_id', leagueWeekId)

  if (matchupsError || !matchups) {
    return { error: 'Failed to fetch matchups' }
  }

  // Fetch all player week stats for this league and week
  // Also fetch player positions for scoring calculation
  const { data: allStats, error: statsError } = await supabase
    .from('player_week_stats')
    .select(`
      *,
      players!inner (
        id,
        position
      )
    `)
    .eq('league_id', leagueId)
    .eq('league_week_id', leagueWeekId)

  if (statsError) {
    return { error: 'Failed to fetch player stats' }
  }

  // Create a map of player_id -> { stats, position }
  const statsMap = new Map<string, { stats: PlayerWeekStats; position: string }>()
  allStats?.forEach(stat => {
    const player = stat.players as any
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
      position: player?.position || 'QB',
    })
  })

  // Calculate scores for each matchup
  const calculatedScores: Array<{
    matchupId: string
    homeTeamId: string
    homeTeamName: string
    homeScore: number
    awayTeamId: string
    awayTeamName: string
    awayScore: number
  }> = []

  for (const matchup of matchups) {
    // Fetch home team's starting roster
    const { data: homeRoster } = await supabase
      .from('rosters')
      .select(`
        player_id,
        players!inner (
          id,
          position
        )
      `)
      .eq('team_id', matchup.home_team_id)
      .eq('league_id', leagueId)
      .eq('is_starter', true)

    // Fetch away team's starting roster
    const { data: awayRoster } = await supabase
      .from('rosters')
      .select(`
        player_id,
        players!inner (
          id,
          position
        )
      `)
      .eq('team_id', matchup.away_team_id)
      .eq('league_id', leagueId)
      .eq('is_starter', true)

    // Calculate home team score
    let homeScore = 0
    homeRoster?.forEach((rosterEntry: any) => {
      const statEntry = statsMap.get(rosterEntry.player_id)
      if (statEntry) {
        homeScore += calculatePlayerScoreWithConfig(
          statEntry.stats,
          statEntry.position,
          scoringConfig
        )
      }
    })

    // Calculate away team score
    let awayScore = 0
    awayRoster?.forEach((rosterEntry: any) => {
      const statEntry = statsMap.get(rosterEntry.player_id)
      if (statEntry) {
        awayScore += calculatePlayerScoreWithConfig(
          statEntry.stats,
          statEntry.position,
          scoringConfig
        )
      }
    })

    calculatedScores.push({
      matchupId: matchup.id,
      homeTeamId: matchup.home_team_id,
      homeTeamName: (matchup.home_team as any)?.name || 'Home Team',
      homeScore: Math.round(homeScore * 100) / 100,
      awayTeamId: matchup.away_team_id,
      awayTeamName: (matchup.away_team as any)?.name || 'Away Team',
      awayScore: Math.round(awayScore * 100) / 100,
    })

    // If not dry run, update matchup with scores
    if (!options?.dryRun) {
      await supabase
        .from('matchups')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: 'final',
        })
        .eq('id', matchup.id)
    }
  }

  // If not dry run, cache fantasy_points for all players in this week using batch update
  if (!options?.dryRun && allStats) {
    const updates: Array<{ id: string; fantasy_points: number }> = []
    
    for (const stat of allStats) {
      const statEntry = statsMap.get(stat.player_id)
      if (statEntry) {
        const fantasyPoints = calculatePlayerScoreWithConfig(
          statEntry.stats,
          statEntry.position,
          scoringConfig
        )
        updates.push({
          id: stat.id,
          fantasy_points: fantasyPoints,
        })
      }
    }

    // Use stored procedure for efficient batch update
    if (updates.length > 0) {
      const updatesJson = updates.map(u => ({
        id: u.id,
        fantasy_points: u.fantasy_points.toString(),
      }))
      
      const { data, error: rpcError } = await supabase.rpc('batch_update_fantasy_points', {
        updates: updatesJson as any, // Pass as JSONB array
      })

      if (rpcError) {
        console.error('Error batch updating fantasy_points:', rpcError)
        // Fallback to individual updates if RPC fails
        console.log(`Falling back to individual updates for ${updates.length} records`)
        for (const update of updates) {
          await supabase
            .from('player_week_stats')
            .update({ fantasy_points: update.fantasy_points })
            .eq('id', update.id)
        }
      } else {
        const updatedCount = data?.[0]?.updated_count || updates.length
        console.log(`Batch updated ${updatedCount} fantasy_points records`)
      }
    }
  }

  revalidatePath(`/leagues/${leagueId}`)
  
  return {
    data: {
      week: leagueWeek.week_number,
      matchups: calculatedScores,
      dryRun: options?.dryRun || false,
    }
  }
}

