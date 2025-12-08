'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateDraftPicks } from '@/lib/draft-helpers'
import { trackDraftStarted, trackDraftPickMade, trackDraftCompleted } from '@/lib/analytics/server-track'

/**
 * Helper function to get the next unpicked draft pick
 */
async function getNextDraftPick(leagueId: string) {
  const supabase = await createClient()
  const { data: nextPick } = await supabase
    .from('draft_picks')
    .select('id')
    .eq('league_id', leagueId)
    .is('player_id', null)
    .order('overall_pick', { ascending: true })
    .limit(1)
    .single()

  return nextPick
}

/**
 * Helper function to calculate pick_due_at timestamp
 */
function calculatePickDueAt(timerSeconds: number): string {
  const dueAt = new Date()
  dueAt.setSeconds(dueAt.getSeconds() + timerSeconds)
  return dueAt.toISOString()
}

/**
 * Generate draft picks for a league (snake draft)
 */
export async function generateDraftPicksForLeague(leagueId: string, rounds: number = 14) {
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
    return { error: 'Only the league commissioner can generate draft picks' }
  }

  // Check if draft picks already exist
  const { data: existingPicks } = await supabase
    .from('draft_picks')
    .select('id')
    .eq('league_id', leagueId)
    .limit(1)

  if (existingPicks && existingPicks.length > 0) {
    return { error: 'Draft picks have already been generated for this league' }
  }

  // Fetch all teams in the league
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name, draft_position')
    .eq('league_id', leagueId)
    .eq('is_active', true)
    .order('draft_position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (teamsError || !teams || teams.length === 0) {
    return { error: 'No teams found in this league' }
  }

  // Generate draft picks using helper
  const picks = generateDraftPicks(teams, rounds)

  // Insert draft picks
  const draftPicksToInsert = picks.map(pick => ({
    league_id: leagueId,
    round: pick.round,
    overall_pick: pick.overallPick,
    team_id: pick.teamId,
    player_id: null, // Will be filled when commissioner assigns players
  }))

  const { data: insertedPicks, error: insertError } = await supabase
    .from('draft_picks')
    .insert(draftPicksToInsert)
    .select()

  if (insertError) {
    return { error: insertError.message }
  }

  // Track draft started (non-blocking - don't await)
  trackDraftStarted(leagueId, user.id).catch(err => {
    console.error('Error tracking draft started:', err)
  })

  revalidatePath(`/leagues/${leagueId}/draft`)
  
  return { data: insertedPicks }
}

/**
 * Make a draft pick (team owner or commissioner)
 * This function allows team owners to make picks when it's their turn
 */
export async function makeDraftPick(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const draftPickId = formData.get('draft_pick_id') as string
  const playerId = formData.get('player_id') as string
  const leagueId = formData.get('league_id') as string

  if (!draftPickId || !playerId || !leagueId) {
    return { error: 'Draft pick ID, player ID, and league ID are required' }
  }

  // Get league info with draft status
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id, draft_status, current_pick_id, draft_settings')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    return { error: 'League not found' }
  }

  // Check if draft is in progress
  if (league.draft_status !== 'in_progress') {
    return { error: `Draft is not in progress. Current status: ${league.draft_status}` }
  }

  // Get draft pick info
  const { data: draftPick, error: pickError } = await supabase
    .from('draft_picks')
    .select(`
      *,
      teams (
        id,
        owner_user_id,
        name
      ),
      players (
        id,
        full_name,
        position
      )
    `)
    .eq('id', draftPickId)
    .eq('league_id', leagueId)
    .single()

  if (pickError || !draftPick) {
    return { error: 'Draft pick not found' }
  }

  // Check if pick has already been made
  if (draftPick.player_id) {
    return { error: 'This pick has already been made' }
  }

  // Check if this is the current pick (or allow commissioner to make any pick)
  const isCommissioner = league.created_by_user_id === user.id
  const isCurrentPick = league.current_pick_id === draftPickId

  if (!isCommissioner && !isCurrentPick) {
    return { error: 'It is not your turn to pick. Please wait for your turn.' }
  }

  // Get user's team in this league
  const { data: userTeam } = await supabase
    .from('teams')
    .select('id, owner_user_id')
    .eq('league_id', leagueId)
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .single()

  // Verify it's the user's turn (unless commissioner)
  if (!isCommissioner) {
    const pickTeam = draftPick.teams as { id: string; owner_user_id: string } | null
    if (!pickTeam || !userTeam || pickTeam.id !== userTeam.id) {
      return { error: 'This is not your pick. Please wait for your turn.' }
    }
  }

  // Check if player is already drafted in this league
  const { data: existingPick } = await supabase
    .from('draft_picks')
    .select('id')
    .eq('league_id', leagueId)
    .eq('player_id', playerId)
    .single()

  if (existingPick) {
    return { error: 'This player has already been drafted in this league' }
  }

  // Update draft pick with player
  const pickedAt = new Date().toISOString()
  const { data: updatedPick, error: updateError } = await supabase
    .from('draft_picks')
    .update({ 
      player_id: playerId,
      picked_at: pickedAt,
      pick_due_at: null, // Clear timer since pick is made
    })
    .eq('id', draftPickId)
    .select()
    .single()

  if (updateError) {
    return { error: updateError.message }
  }

  // Get player info for tracking
  const { data: player } = await supabase
    .from('players')
    .select('id, full_name, position')
    .eq('id', playerId)
    .single()

  // Create roster entry for the team (default to BENCH)
  const { error: rosterError } = await supabase
    .from('rosters')
    .insert({
      team_id: draftPick.team_id,
      player_id: playerId,
      league_id: leagueId,
      slot_type: 'BENCH',
      is_starter: false,
    })

  if (rosterError) {
    // Log error but don't fail - roster might already exist or there could be a constraint issue
    console.error('Error creating roster entry:', rosterError)
  }

  // Create transaction record
  await supabase
    .from('transactions')
    .insert({
      league_id: leagueId,
      team_id: draftPick.team_id,
      type: 'add',
      player_in_id: playerId,
      notes: `Drafted in round ${draftPick.round}, pick ${draftPick.overall_pick}`,
    })

  // Get next pick
  const nextPick = await getNextDraftPick(leagueId)

  // Update league with next pick (or null if draft is complete)
  const updateData: {
    current_pick_id?: string | null
    draft_status?: string
    draft_completed_at?: string
  } = {}

  if (nextPick) {
    // Set next pick as current and start timer
    updateData.current_pick_id = nextPick.id
    
    // Get timer settings
    const draftSettings = (league.draft_settings as { timer_seconds?: number }) || {}
    const timerSeconds = draftSettings.timer_seconds || 90
    const pickDueAt = calculatePickDueAt(timerSeconds)

    // Set timer for next pick
    await supabase
      .from('draft_picks')
      .update({ pick_due_at: pickDueAt })
      .eq('id', nextPick.id)
  } else {
    // Draft is complete
    updateData.current_pick_id = null
    updateData.draft_status = 'completed'
    updateData.draft_completed_at = pickedAt
  }

  // Update league
  await supabase
    .from('leagues')
    .update(updateData)
    .eq('id', leagueId)

  // Track draft pick made (non-blocking)
  if (player) {
    trackDraftPickMade(
      leagueId,
      draftPick.round,
      draftPick.overall_pick,
      playerId,
      player.full_name,
      player.position,
      user.id
    ).catch(err => {
      console.error('Error tracking draft pick:', err)
    })
  }

  // Track draft completed if finished (non-blocking)
  if (!nextPick) {
    trackDraftCompleted(leagueId, user.id).catch(err => {
      console.error('Error tracking draft completed:', err)
    })
  }

  revalidatePath(`/leagues/${leagueId}/draft`)
  revalidatePath(`/leagues/${leagueId}`)
  
  return { 
    data: updatedPick,
    next_pick_id: nextPick?.id || null,
    draft_complete: !nextPick,
  }
}

/**
 * @deprecated Use makeDraftPick instead
 * Kept for backward compatibility during migration
 */
export async function assignPlayerToDraftPick(formData: FormData) {
  return makeDraftPick(formData)
}

/**
 * Start the draft
 * Sets draft status to in_progress and activates the first pick
 */
export async function startDraft(leagueId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is league creator (commissioner)
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id, draft_status, draft_settings')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league || league.created_by_user_id !== user.id) {
    return { error: 'Only the league commissioner can start the draft' }
  }

  // Check if draft is already started
  if (league.draft_status === 'in_progress') {
    return { error: 'Draft is already in progress' }
  }

  if (league.draft_status === 'completed') {
    return { error: 'Draft has already been completed' }
  }

  // Get first draft pick
  const firstPick = await getNextDraftPick(leagueId)
  if (!firstPick) {
    return { error: 'No draft picks found. Please generate draft picks first.' }
  }

  // Get timer settings
  const draftSettings = (league.draft_settings as { timer_seconds?: number }) || {}
  const timerSeconds = draftSettings.timer_seconds || 90

  // Calculate pick due time
  const pickDueAt = calculatePickDueAt(timerSeconds)

  // Start the draft
  const { error: updateLeagueError } = await supabase
    .from('leagues')
    .update({
      draft_status: 'in_progress',
      draft_started_at: new Date().toISOString(),
      current_pick_id: firstPick.id,
    })
    .eq('id', leagueId)

  if (updateLeagueError) {
    return { error: updateLeagueError.message }
  }

  // Set timer for first pick
  const { error: updatePickError } = await supabase
    .from('draft_picks')
    .update({
      pick_due_at: pickDueAt,
    })
    .eq('id', firstPick.id)

  if (updatePickError) {
    console.error('Error setting pick timer:', updatePickError)
    // Don't fail - timer is optional
  }

  // Track draft started (non-blocking)
  trackDraftStarted(leagueId, user.id).catch(err => {
    console.error('Error tracking draft started:', err)
  })

  revalidatePath(`/leagues/${leagueId}/draft`)
  revalidatePath(`/leagues/${leagueId}`)

  return { data: { started: true, current_pick_id: firstPick.id } }
}

/**
 * Pause the draft
 * Sets draft status to paused and clears active timers
 */
export async function pauseDraft(leagueId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is league creator (commissioner)
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id, draft_status, current_pick_id')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league || league.created_by_user_id !== user.id) {
    return { error: 'Only the league commissioner can pause the draft' }
  }

  if (league.draft_status !== 'in_progress') {
    return { error: 'Draft is not currently in progress' }
  }

  // Clear timer for current pick
  if (league.current_pick_id) {
    await supabase
      .from('draft_picks')
      .update({ pick_due_at: null })
      .eq('id', league.current_pick_id)
  }

  // Pause the draft
  const { error: updateError } = await supabase
    .from('leagues')
    .update({
      draft_status: 'paused',
    })
    .eq('id', leagueId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath(`/leagues/${leagueId}/draft`)
  revalidatePath(`/leagues/${leagueId}`)

  return { data: { paused: true } }
}

/**
 * Resume the draft
 * Sets draft status to in_progress and reactivates the current pick timer
 */
export async function resumeDraft(leagueId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is league creator (commissioner)
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id, draft_status, current_pick_id, draft_settings')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league || league.created_by_user_id !== user.id) {
    return { error: 'Only the league commissioner can resume the draft' }
  }

  if (league.draft_status !== 'paused') {
    return { error: 'Draft is not currently paused' }
  }

  if (!league.current_pick_id) {
    return { error: 'No current pick found. Cannot resume draft.' }
  }

  // Get timer settings
  const draftSettings = (league.draft_settings as { timer_seconds?: number }) || {}
  const timerSeconds = draftSettings.timer_seconds || 90

  // Calculate pick due time
  const pickDueAt = calculatePickDueAt(timerSeconds)

  // Resume the draft
  const { error: updateLeagueError } = await supabase
    .from('leagues')
    .update({
      draft_status: 'in_progress',
    })
    .eq('id', leagueId)

  if (updateLeagueError) {
    return { error: updateLeagueError.message }
  }

  // Reactivate timer for current pick
  const { error: updatePickError } = await supabase
    .from('draft_picks')
    .update({
      pick_due_at: pickDueAt,
    })
    .eq('id', league.current_pick_id)

  if (updatePickError) {
    console.error('Error setting pick timer:', updatePickError)
    // Don't fail - timer is optional
  }

  revalidatePath(`/leagues/${leagueId}/draft`)
  revalidatePath(`/leagues/${leagueId}`)

  return { data: { resumed: true } }
}

/**
 * Complete the draft
 * Sets draft status to completed and finalizes all rosters
 */
export async function completeDraft(leagueId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is league creator (commissioner)
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id, draft_status')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league || league.created_by_user_id !== user.id) {
    return { error: 'Only the league commissioner can complete the draft' }
  }

  if (league.draft_status === 'completed') {
    return { error: 'Draft has already been completed' }
  }

  // Verify all picks are made
  const { data: remainingPicks } = await supabase
    .from('draft_picks')
    .select('id')
    .eq('league_id', leagueId)
    .is('player_id', null)
    .limit(1)

  if (remainingPicks && remainingPicks.length > 0) {
    return { error: 'Cannot complete draft. There are still unpicked players.' }
  }

  // Complete the draft
  const { error: updateError } = await supabase
    .from('leagues')
    .update({
      draft_status: 'completed',
      draft_completed_at: new Date().toISOString(),
      current_pick_id: null,
    })
    .eq('id', leagueId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Track draft completed (non-blocking)
  trackDraftCompleted(leagueId, user.id).catch(err => {
    console.error('Error tracking draft completed:', err)
  })

  revalidatePath(`/leagues/${leagueId}/draft`)
  revalidatePath(`/leagues/${leagueId}`)

  return { data: { completed: true } }
}

