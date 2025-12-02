'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateRoundRobinSchedule } from '@/lib/schedule-helpers'

/**
 * Generate schedule for a league
 */
export async function generateScheduleForLeague(leagueId: string, totalWeeks: number = 14) {
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
    return { error: 'Only the league commissioner can generate schedules' }
  }

  // Check if schedule already exists
  const { data: existingWeeks } = await supabase
    .from('league_weeks')
    .select('id')
    .eq('league_id', leagueId)
    .limit(1)

  if (existingWeeks && existingWeeks.length > 0) {
    return { error: 'Schedule has already been generated for this league' }
  }

  // Fetch all teams in the league
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name')
    .eq('league_id', leagueId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (teamsError || !teams || teams.length < 2) {
    return { error: 'Need at least 2 teams to generate a schedule' }
  }

  // Generate schedule using helper
  const schedule = generateRoundRobinSchedule(teams, totalWeeks)

  // Create league_weeks
  const leagueWeeks = []
  for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
    const { data: week, error: weekError } = await supabase
      .from('league_weeks')
      .insert({
        league_id: leagueId,
        week_number: weekNum,
        status: 'upcoming',
        is_current: false,
      })
      .select()
      .single()

    if (weekError) {
      return { error: `Failed to create week ${weekNum}: ${weekError.message}` }
    }
    leagueWeeks.push(week)
  }

  // Create matchups for each week
  const allMatchups = []
  for (const scheduleWeek of schedule) {
    const leagueWeek = leagueWeeks.find(w => w.week_number === scheduleWeek.week)
    if (!leagueWeek) continue

    for (const matchup of scheduleWeek.matchups) {
      const { data: matchupData, error: matchupError } = await supabase
        .from('matchups')
        .insert({
          league_id: leagueId,
          league_week_id: leagueWeek.id,
          home_team_id: matchup.homeTeamId,
          away_team_id: matchup.awayTeamId,
          status: 'scheduled',
        })
        .select()
        .single()

      if (matchupError) {
        return { error: `Failed to create matchup: ${matchupError.message}` }
      }
      allMatchups.push(matchupData)
    }
  }

  revalidatePath(`/leagues/${leagueId}`)
  
  return { 
    data: {
      weeks: leagueWeeks.length,
      matchups: allMatchups.length,
    }
  }
}

