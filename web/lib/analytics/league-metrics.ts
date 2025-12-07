'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Calculate and store league engagement metrics
 */
export async function calculateLeagueMetrics(leagueId: string, date: Date = new Date()) {
  const supabase = await createClient()
  const metricDate = date.toISOString().split('T')[0] // YYYY-MM-DD format

  // Get all teams in the league
  const { data: teams } = await supabase
    .from('teams')
    .select('id, owner_user_id')
    .eq('league_id', leagueId)
    .eq('is_active', true)

  if (!teams || teams.length === 0) {
    return { error: 'No teams found in league' }
  }

  const teamIds = teams.map(t => t.id)
  const managerIds = teams.map(t => t.owner_user_id)

  // Calculate daily active managers (managers who viewed league pages today)
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const { data: dailyEvents } = await supabase
    .from('analytics_events')
    .select('user_id')
    .eq('league_id', leagueId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())
    .in('event_type', ['page_viewed', 'matchup_viewed', 'standings_viewed', 'players_viewed'])

  const dailyActiveManagers = new Set(
    dailyEvents?.map(e => e.user_id).filter(Boolean) || []
  ).size

  // Calculate weekly active managers (last 7 days)
  const weekAgo = new Date(date)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: weeklyEvents } = await supabase
    .from('analytics_events')
    .select('user_id')
    .eq('league_id', leagueId)
    .gte('created_at', weekAgo.toISOString())
    .lte('created_at', endOfDay.toISOString())
    .in('event_type', ['page_viewed', 'matchup_viewed', 'standings_viewed', 'players_viewed'])

  const weeklyActiveManagers = new Set(
    weeklyEvents?.map(e => e.user_id).filter(Boolean) || []
  ).size

  // Count lineup changes today
  const { count: lineupChangesCount } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', leagueId)
    .eq('event_type', 'lineup_changed')
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())

  // Calculate invite acceptance rate
  const { data: invites } = await supabase
    .from('league_invites')
    .select('status')
    .eq('league_id', leagueId)

  const totalInvites = invites?.length || 0
  const acceptedInvites = invites?.filter(i => i.status === 'accepted').length || 0
  const inviteAcceptanceRate = totalInvites > 0 
    ? (acceptedInvites / totalInvites) * 100 
    : null

  // Calculate team participation rate (teams with activity in last 7 days)
  const { data: teamActivity } = await supabase
    .from('analytics_events')
    .select('team_id')
    .eq('league_id', leagueId)
    .gte('created_at', weekAgo.toISOString())
    .not('team_id', 'is', null)

  const activeTeams = new Set(
    teamActivity?.map(e => e.team_id).filter(Boolean) || []
  ).size
  const teamParticipationRate = teams.length > 0 
    ? (activeTeams / teams.length) * 100 
    : null

  // Get draft completion time (if draft is completed)
  let draftCompletionTime: number | null = null
  const { data: draftEvents } = await supabase
    .from('analytics_events')
    .select('created_at')
    .eq('league_id', leagueId)
    .in('event_type', ['draft_started', 'draft_completed'])
    .order('created_at', { ascending: true })

  if (draftEvents && draftEvents.length >= 2) {
    const draftStarted = draftEvents.find(e => e.event_type === 'draft_started')
    const draftCompleted = draftEvents.find(e => e.event_type === 'draft_completed')
    if (draftStarted && draftCompleted) {
      const startTime = new Date(draftStarted.created_at).getTime()
      const endTime = new Date(draftCompleted.created_at).getTime()
      draftCompletionTime = Math.round((endTime - startTime) / 1000 / 60) // minutes
    }
  }

  // Upsert metrics
  const { error } = await supabase
    .from('analytics_league_metrics')
    .upsert({
      league_id: leagueId,
      metric_date: metricDate,
      daily_active_managers: dailyActiveManagers,
      weekly_active_managers: weeklyActiveManagers,
      lineup_changes_count: lineupChangesCount || 0,
      draft_completion_time_minutes: draftCompletionTime,
      invite_acceptance_rate: inviteAcceptanceRate,
      team_participation_rate: teamParticipationRate,
    }, {
      onConflict: 'league_id,metric_date'
    })

  if (error) {
    console.error('Error calculating league metrics:', error)
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Get league metrics for a date range
 */
export async function getLeagueMetrics(
  leagueId: string,
  startDate: Date,
  endDate: Date
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('analytics_league_metrics')
    .select('*')
    .eq('league_id', leagueId)
    .gte('metric_date', startDate.toISOString().split('T')[0])
    .lte('metric_date', endDate.toISOString().split('T')[0])
    .order('metric_date', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

