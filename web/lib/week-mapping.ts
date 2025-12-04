/**
 * Week Mapping Helper
 * 
 * Maps between league weeks and NFL weeks/season years.
 * Handles the relationship between:
 * - league_weeks (league-specific week numbers)
 * - NFL weeks (1-18) and season years
 */

import { createClient } from '@/lib/supabase/server'

export interface LeagueWeekInfo {
  leagueWeekId: string
  weekNumber: number // League-specific week number
  seasonYear: number // NFL season year from league's season
  nflWeek: number // NFL week (1-18), typically same as weekNumber but can differ
}

/**
 * Resolve league week from leagueId, seasonYear, and week
 * 
 * Strategy:
 * 1. Fetch the league to get its season_id
 * 2. Get the season year from seasons table
 * 3. Find or create the league_week for this league/week_number
 * 4. Return the league_week_id and mapping info
 * 
 * Note: For now, we assume league week_number maps 1:1 to NFL week.
 * In the future, this could be more sophisticated (e.g., bye weeks, playoffs).
 * 
 * @param leagueId - The league ID
 * @param seasonYear - NFL season year (optional, will be fetched from league if not provided)
 * @param week - NFL week number (1-18), also used as league week_number
 * @returns League week info including league_week_id
 */
export async function resolveLeagueWeek(
  leagueId: string,
  seasonYear?: number,
  week?: number
): Promise<{ data?: LeagueWeekInfo; error?: string }> {
  const supabase = await createClient()

  // Fetch league with season info
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select(`
      id,
      season_id,
      seasons (
        id,
        year
      )
    `)
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    return { error: 'League not found' }
  }

  const season = league.seasons as any
  if (!season) {
    return { error: 'League season not found' }
  }

  const resolvedSeasonYear = seasonYear || season.year
  const resolvedWeek = week || 1

  // Find existing league_week for this league and week_number
  const { data: leagueWeek, error: weekError } = await supabase
    .from('league_weeks')
    .select('id, week_number')
    .eq('league_id', leagueId)
    .eq('week_number', resolvedWeek)
    .single()

  if (weekError && weekError.code !== 'PGRST116') {
    // PGRST116 = not found, which is OK - we'll create it
    return { error: `Failed to fetch league week: ${weekError.message}` }
  }

  if (leagueWeek) {
    return {
      data: {
        leagueWeekId: leagueWeek.id,
        weekNumber: leagueWeek.week_number,
        seasonYear: resolvedSeasonYear,
        nflWeek: resolvedWeek, // For now, assume 1:1 mapping
      },
    }
  }

  // League week doesn't exist - create it
  // Note: In a production system, you might want to require explicit creation
  // For now, we'll create it on-demand
  const { data: newLeagueWeek, error: createError } = await supabase
    .from('league_weeks')
    .insert({
      league_id: leagueId,
      week_number: resolvedWeek,
      status: 'upcoming',
      is_current: false,
    })
    .select('id, week_number')
    .single()

  if (createError || !newLeagueWeek) {
    return { error: `Failed to create league week: ${createError?.message || 'Unknown error'}` }
  }

  return {
    data: {
      leagueWeekId: newLeagueWeek.id,
      weekNumber: newLeagueWeek.week_number,
      seasonYear: resolvedSeasonYear,
      nflWeek: resolvedWeek,
    },
  }
}

/**
 * Get the current league week for a league
 */
export async function getCurrentLeagueWeek(
  leagueId: string
): Promise<{ data?: LeagueWeekInfo; error?: string }> {
  const supabase = await createClient()

  // Fetch league with season
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select(`
      id,
      season_id,
      seasons (
        id,
        year
      )
    `)
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    return { error: 'League not found' }
  }

  const season = league.seasons as any
  if (!season) {
    return { error: 'League season not found' }
  }

  // Find current league week
  const { data: currentWeek, error: weekError } = await supabase
    .from('league_weeks')
    .select('id, week_number')
    .eq('league_id', leagueId)
    .eq('is_current', true)
    .single()

  if (weekError || !currentWeek) {
    return { error: 'No current week set for this league' }
  }

  return {
    data: {
      leagueWeekId: currentWeek.id,
      weekNumber: currentWeek.week_number,
      seasonYear: season.year,
      nflWeek: currentWeek.week_number, // For now, assume 1:1 mapping
    },
  }
}

