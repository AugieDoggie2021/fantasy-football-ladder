'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentLeagueWeek } from '@/lib/week-mapping'
import { triggerExternalWeekStatsSync } from './stats-ingestion'
import { calculateAndApplyScoresForWeek } from './scoring'

/**
 * Ingest external stats for the current league week
 * 
 * Determines the current league week, derives season/year/week mapping,
 * and calls the sync_external_week_stats edge function.
 */
export async function ingestStatsForCurrentWeek(leagueId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is league creator (commissioner)
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league || league.created_by_user_id !== user.id) {
    return { error: 'Only the league commissioner can ingest stats' }
  }

  // Get current league week
  const weekInfo = await getCurrentLeagueWeek(leagueId)
  if (weekInfo.error || !weekInfo.data) {
    return { error: weekInfo.error || 'No current week set for this league' }
  }

  const { seasonYear, nflWeek } = weekInfo.data

  // Call the edge function to sync stats
  try {
    const result = await triggerExternalWeekStatsSync(seasonYear, nflWeek, 'live')
    return { data: result }
  } catch (error: any) {
    return { error: error.message || 'Failed to ingest stats' }
  }
}

/**
 * Run a dry-run scoring calculation for the current league week
 */
export async function dryRunScoringForCurrentWeek(leagueId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is league creator (commissioner)
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league || league.created_by_user_id !== user.id) {
    return { error: 'Only the league commissioner can run scoring' }
  }

  // Get current league week
  const { data: currentWeek } = await supabase
    .from('league_weeks')
    .select('id')
    .eq('league_id', leagueId)
    .eq('is_current', true)
    .single()

  if (!currentWeek) {
    return { error: 'No current week set for this league' }
  }

  // Run dry-run scoring
  return await calculateAndApplyScoresForWeek(leagueId, currentWeek.id, { dryRun: true })
}

/**
 * Apply scoring for the current league week
 */
export async function applyScoringForCurrentWeek(leagueId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is league creator (commissioner)
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league || league.created_by_user_id !== user.id) {
    return { error: 'Only the league commissioner can apply scores' }
  }

  // Get current league week
  const { data: currentWeek } = await supabase
    .from('league_weeks')
    .select('id')
    .eq('league_id', leagueId)
    .eq('is_current', true)
    .single()

  if (!currentWeek) {
    return { error: 'No current week set for this league' }
  }

  // Apply scoring (not dry-run)
  return await calculateAndApplyScoresForWeek(leagueId, currentWeek.id, { dryRun: false })
}

