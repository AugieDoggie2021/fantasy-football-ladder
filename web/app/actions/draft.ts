'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateDraftPicks } from '@/lib/draft-helpers'
import { trackDraftStarted, trackDraftPickMade, trackDraftCompleted } from '@/lib/analytics/server-track'

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
 * Assign a player to a draft pick
 */
export async function assignPlayerToDraftPick(formData: FormData) {
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

  // Verify user is league creator (commissioner)
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league || league.created_by_user_id !== user.id) {
    return { error: 'Only the league commissioner can assign draft picks' }
  }

  // Get draft pick info with player details
  const { data: draftPick, error: pickError } = await supabase
    .from('draft_picks')
    .select(`
      *,
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
  const { data: updatedPick, error: updateError } = await supabase
    .from('draft_picks')
    .update({ player_id: playerId })
    .eq('id', draftPickId)
    .select()
    .single()

  if (updateError) {
    return { error: updateError.message }
  }

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

  // Track draft pick made (non-blocking - don't await)
  const player = draftPick.players as { id: string; full_name: string; position: string } | null
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

  // Check if draft is complete (all picks have players)
  const { data: remainingPicks } = await supabase
    .from('draft_picks')
    .select('id')
    .eq('league_id', leagueId)
    .is('player_id', null)
    .limit(1)

  if (!remainingPicks || remainingPicks.length === 0) {
    // Draft is complete (non-blocking - don't await)
    trackDraftCompleted(leagueId, user.id).catch(err => {
      console.error('Error tracking draft completed:', err)
    })
  }

  revalidatePath(`/leagues/${leagueId}/draft`)
  revalidatePath(`/leagues/${leagueId}`)
  
  return { data: updatedPick }
}

