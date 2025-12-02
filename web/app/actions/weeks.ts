'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Set a specific week as the current week for a league
 */
export async function setCurrentWeek(leagueId: string, weekNumber: number) {
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
    return { error: 'Only the league commissioner can set the current week' }
  }

  // Clear all current week flags for this league
  await supabase
    .from('league_weeks')
    .update({ is_current: false })
    .eq('league_id', leagueId)

  // Set the specified week as current
  const { data: week, error: weekError } = await supabase
    .from('league_weeks')
    .update({ 
      is_current: true,
      status: 'in_progress',
    })
    .eq('league_id', leagueId)
    .eq('week_number', weekNumber)
    .select()
    .single()

  if (weekError || !week) {
    return { error: `Week ${weekNumber} not found` }
  }

  revalidatePath(`/leagues/${leagueId}`)
  
  return { data: week }
}

/**
 * Advance to the next week for a league
 */
export async function advanceToNextWeek(leagueId: string) {
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
    return { error: 'Only the league commissioner can advance weeks' }
  }

  // Find current week
  const { data: currentWeek } = await supabase
    .from('league_weeks')
    .select('week_number')
    .eq('league_id', leagueId)
    .eq('is_current', true)
    .single()

  if (!currentWeek) {
    return { error: 'No current week found. Set a current week first.' }
  }

  // Mark current week as completed
  await supabase
    .from('league_weeks')
    .update({ 
      is_current: false,
      status: 'completed',
    })
    .eq('league_id', leagueId)
    .eq('week_number', currentWeek.week_number)

  // Find next week
  const { data: nextWeek, error: nextWeekError } = await supabase
    .from('league_weeks')
    .update({ 
      is_current: true,
      status: 'in_progress',
    })
    .eq('league_id', leagueId)
    .eq('week_number', currentWeek.week_number + 1)
    .select()
    .single()

  if (nextWeekError || !nextWeek) {
    return { error: 'No next week found. Schedule may not extend that far.' }
  }

  revalidatePath(`/leagues/${leagueId}`)
  
  return { data: nextWeek }
}

