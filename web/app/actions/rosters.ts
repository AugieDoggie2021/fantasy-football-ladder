'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Add a player to a team's roster
 */
export async function addPlayerToRoster(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const teamId = formData.get('team_id') as string
  const playerId = formData.get('player_id') as string
  const leagueId = formData.get('league_id') as string
  const slotType = (formData.get('slot_type') as string) || 'BENCH'

  if (!teamId || !playerId || !leagueId) {
    return { error: 'Team ID, player ID, and league ID are required' }
  }

  // Verify user owns the team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, owner_user_id')
    .eq('id', teamId)
    .single()

  if (teamError || !team || team.owner_user_id !== user.id) {
    return { error: 'You do not have permission to modify this team' }
  }

  // Check if player is already on a roster in this league
  const { data: existingRoster } = await supabase
    .from('rosters')
    .select('id')
    .eq('player_id', playerId)
    .eq('league_id', leagueId)
    .single()

  if (existingRoster) {
    return { error: 'This player is already on a roster in this league' }
  }

  // Add player to roster
  const { data: roster, error: rosterError } = await supabase
    .from('rosters')
    .insert({
      team_id: teamId,
      player_id: playerId,
      league_id: leagueId,
      slot_type: slotType,
      is_starter: slotType !== 'BENCH',
    })
    .select()
    .single()

  if (rosterError) {
    return { error: rosterError.message }
  }

  // Create transaction record
  await supabase
    .from('transactions')
    .insert({
      league_id: leagueId,
      team_id: teamId,
      type: 'add',
      player_in_id: playerId,
    })

  revalidatePath(`/leagues/${leagueId}`)
  revalidatePath(`/leagues/${leagueId}/players`)
  
  return { data: roster }
}

/**
 * Move a player between starter and bench, or change slot type
 */
export async function updateRosterSlot(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const rosterId = formData.get('roster_id') as string
  const slotType = formData.get('slot_type') as string
  const isStarter = formData.get('is_starter') === 'true'

  if (!rosterId || !slotType) {
    return { error: 'Roster ID and slot type are required' }
  }

  // Verify user owns the team
  const { data: roster, error: rosterError } = await supabase
    .from('rosters')
    .select(`
      id,
      team_id,
      teams!inner(owner_user_id)
    `)
    .eq('id', rosterId)
    .single()

  if (rosterError || !roster || (roster.teams as any).owner_user_id !== user.id) {
    return { error: 'You do not have permission to modify this roster' }
  }

  // Update roster slot
  const { data: updatedRoster, error: updateError } = await supabase
    .from('rosters')
    .update({
      slot_type: slotType,
      is_starter: isStarter,
    })
    .eq('id', rosterId)
    .select()
    .single()

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath(`/leagues/${updatedRoster.league_id}`)
  
  return { data: updatedRoster }
}

/**
 * Remove a player from a team's roster (drop player)
 */
export async function dropPlayerFromRoster(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const rosterId = formData.get('roster_id') as string

  if (!rosterId) {
    return { error: 'Roster ID is required' }
  }

  // Get roster info before deleting (for transaction and revalidation)
  const { data: roster, error: rosterError } = await supabase
    .from('rosters')
    .select(`
      id,
      team_id,
      player_id,
      league_id,
      teams!inner(owner_user_id)
    `)
    .eq('id', rosterId)
    .single()

  if (rosterError || !roster || (roster.teams as any).owner_user_id !== user.id) {
    return { error: 'You do not have permission to drop this player' }
  }

  // Delete roster entry
  const { error: deleteError } = await supabase
    .from('rosters')
    .delete()
    .eq('id', rosterId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // Create transaction record
  await supabase
    .from('transactions')
    .insert({
      league_id: roster.league_id,
      team_id: roster.team_id,
      type: 'drop',
      player_out_id: roster.player_id,
    })

  revalidatePath(`/leagues/${roster.league_id}`)
  revalidatePath(`/leagues/${roster.league_id}/players`)
  
  return { success: true }
}

