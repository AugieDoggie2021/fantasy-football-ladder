'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateDraftPicks } from '@/lib/draft-helpers'
import { 
  trackDraftStarted, 
  trackDraftPickMade, 
  trackDraftCompleted,
  trackDraftPaused,
  trackDraftResumed,
  trackDraftTimerExtended,
  trackDraftQueueAdded,
  trackDraftQueueRemoved,
  trackDraftQueueReordered,
  trackDraftAutoPickTriggered,
  trackDraftPickFailed,
} from '@/lib/analytics/server-track'
import { trackServerError } from '@/lib/error-monitoring'
import { validateDraftPickInputs, validateDraftStatus } from '@/lib/draft-validation'
import { checkDraftPickRateLimit } from '@/lib/draft-rate-limit'
import { logDraftAction, getRequestMetadata } from '@/lib/draft-audit'
import { headers } from 'next/headers'

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
  const headersList = await headers()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const draftPickId = formData.get('draft_pick_id') as string
  const playerId = formData.get('player_id') as string
  const leagueId = formData.get('league_id') as string

  // Comprehensive input validation
  const validation = validateDraftPickInputs(draftPickId, playerId, leagueId)
  if (!validation.valid) {
    await logDraftAction('pick_failed', leagueId, user.id, {
      draftPickId,
      playerId,
      metadata: {
        error: validation.error,
        validationErrors: [validation.error || 'Validation failed'],
        ...getRequestMetadata(headersList),
      },
    })
    return { error: validation.error }
  }

  // Rate limiting
  const rateLimit = await checkDraftPickRateLimit(user.id, leagueId)
  if (!rateLimit.allowed) {
    await logDraftAction('pick_failed', leagueId, user.id, {
      draftPickId,
      playerId,
      metadata: {
        error: rateLimit.error,
        rateLimited: true,
        retryAfter: rateLimit.retryAfter,
        ...getRequestMetadata(headersList),
      },
    })
    return { error: rateLimit.error }
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

  // Double-check that the pick hasn't been made by another user (concurrent pick protection)
  const { data: currentPickState } = await supabase
    .from('draft_picks')
    .select('player_id, team_id')
    .eq('id', draftPickId)
    .single()

  if (currentPickState?.player_id) {
    return { error: 'This pick has already been made by another user. Please refresh the page.' }
  }

  // Verify the current pick hasn't changed (race condition protection)
  if (league.current_pick_id !== draftPickId && !isCommissioner) {
    return { error: 'The draft has progressed. This pick is no longer available.' }
  }

  // Update draft pick with player (with optimistic locking)
  const pickedAt = new Date().toISOString()
  const { data: updatedPick, error: updateError } = await supabase
    .from('draft_picks')
    .update({ 
      player_id: playerId,
      picked_at: pickedAt,
      pick_due_at: null, // Clear timer since pick is made
    })
    .eq('id', draftPickId)
    .is('player_id', null) // Only update if player_id is still null (prevent concurrent picks)
    .select()
    .single()

  if (updateError) {
    // Check if error is due to concurrent pick (row not found because it was already updated)
    if (updateError.code === 'PGRST116' || !updatedPick) {
      await logDraftAction('pick_failed', leagueId, user.id, {
        draftPickId,
        playerId,
        metadata: {
          error: 'Concurrent pick detected - pick was already made',
          concurrentPick: true,
          ...getRequestMetadata(headersList),
        },
      })
      return { error: 'This pick was already made by another user. Please refresh the page.' }
    }
    await logDraftAction('pick_failed', leagueId, user.id, {
      draftPickId,
      playerId,
      metadata: {
        error: updateError.message,
        databaseError: true,
        ...getRequestMetadata(headersList),
      },
    })
    return { error: `Failed to make pick: ${updateError.message}` }
  }

  if (!updatedPick) {
    await logDraftAction('pick_failed', leagueId, user.id, {
      draftPickId,
      playerId,
      metadata: {
        error: 'Pick was already made',
        ...getRequestMetadata(headersList),
      },
    })
    return { error: 'This pick was already made. Please refresh the page.' }
  }

  // Log successful pick
  await logDraftAction('pick_made', leagueId, user.id, {
    draftPickId,
    playerId,
    teamId: draftPick.team_id,
    metadata: {
      round: draftPick.round,
      overallPick: draftPick.overall_pick,
      ...getRequestMetadata(headersList),
    },
  })

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
    // Draft is complete - finalize everything
    updateData.current_pick_id = null
    updateData.draft_status = 'completed'
    updateData.draft_completed_at = pickedAt
    
    // Finalize draft (validate all picks, ensure rosters are complete)
    await finalizeDraft(leagueId, user.id)
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

  // Track draft paused (non-blocking)
  trackDraftPaused(leagueId, user.id).catch(err => {
    console.error('Error tracking draft paused:', err)
  })

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

  // Track draft resumed (non-blocking)
  trackDraftResumed(leagueId, user.id).catch(err => {
    console.error('Error tracking draft resumed:', err)
  })

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

  // Finalize draft (validate picks, ensure rosters are complete)
  await finalizeDraft(leagueId, user.id)

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

  // Track draft completed (non-blocking - already done in finalizeDraft, but keep for safety)
  trackDraftCompleted(leagueId, user.id).catch(err => {
    console.error('Error tracking draft completed:', err)
  })

  revalidatePath(`/leagues/${leagueId}/draft`)
  revalidatePath(`/leagues/${leagueId}`)

  return { data: { completed: true } }
}

/**
 * Process auto-pick for an expired draft pick
 * This function is called when a pick timer expires
 * It will:
 * 1. Check the team's draft queue for available players
 * 2. Pick the highest priority available player
 * 3. Fallback to random available player if auto-pick is enabled and queue is empty
 * 4. Skip the pick if auto-pick is disabled
 */
export async function processAutoPick(draftPickId: string, leagueId: string) {
  const supabase = await createClient()
  
  // Get the draft pick with team info
  const { data: draftPick, error: pickError } = await supabase
    .from('draft_picks')
    .select(`
      *,
      teams (
        id,
        owner_user_id,
        name
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

  // Check if timer has actually expired
  if (draftPick.pick_due_at) {
    const dueAt = new Date(draftPick.pick_due_at)
    const now = new Date()
    if (dueAt > now) {
      return { error: 'Pick timer has not expired yet' }
    }
  }

  // Get league settings
  const { data: league } = await supabase
    .from('leagues')
    .select('draft_settings, draft_status')
    .eq('id', leagueId)
    .single()

  if (!league || league.draft_status !== 'in_progress') {
    return { error: 'Draft is not in progress' }
  }

  const draftSettings = (league.draft_settings as { 
    auto_pick_enabled?: boolean
    timer_seconds?: number
  }) || {}
  const autoPickEnabled = draftSettings.auto_pick_enabled || false

  // Get team's draft queue, ordered by priority (highest first)
  const { data: queueItems } = await supabase
    .from('draft_queues')
    .select(`
      *,
      players (
        id,
        full_name,
        position
      )
    `)
    .eq('team_id', draftPick.team_id)
    .eq('league_id', leagueId)
    .order('priority', { ascending: false })

  // Get all already drafted players in this league
  const { data: draftedPicks } = await supabase
    .from('draft_picks')
    .select('player_id')
    .eq('league_id', leagueId)
    .not('player_id', 'is', null)

  const draftedPlayerIds = new Set(
    (draftedPicks || []).map(p => p.player_id).filter(Boolean)
  )

  // Find first available player from queue
  let selectedPlayerId: string | null = null

  if (queueItems && queueItems.length > 0) {
    for (const queueItem of queueItems) {
      const playerId = queueItem.player_id
      if (playerId && !draftedPlayerIds.has(playerId)) {
        selectedPlayerId = playerId
        break
      }
    }
  }

  // If no player found in queue and auto-pick is enabled, pick random available player
  if (!selectedPlayerId && autoPickEnabled) {
    // Get all available players (not drafted)
    let availablePlayersQuery = supabase
      .from('players')
      .select('id')
      .limit(100) // Limit to avoid huge queries

    // If there are drafted players, exclude them
    if (draftedPlayerIds.size > 0) {
      availablePlayersQuery = availablePlayersQuery.not('id', 'in', `(${Array.from(draftedPlayerIds).join(',')})`)
    }

    const { data: availablePlayers } = await availablePlayersQuery

    if (availablePlayers && availablePlayers.length > 0) {
      // Pick random player
      const randomIndex = Math.floor(Math.random() * availablePlayers.length)
      selectedPlayerId = availablePlayers[randomIndex].id
    }
  }

  // If still no player selected, skip the pick (don't auto-pick)
  if (!selectedPlayerId) {
    // Just advance to next pick without selecting a player
    // This allows the commissioner to manually assign later
    const nextPick = await getNextDraftPick(leagueId)
    
    const updateData: {
      current_pick_id?: string | null
      draft_status?: string
      draft_completed_at?: string
    } = {}

    if (nextPick) {
      updateData.current_pick_id = nextPick.id
      const timerSeconds = draftSettings.timer_seconds || 90
      const pickDueAt = calculatePickDueAt(timerSeconds)
      
      await supabase
        .from('draft_picks')
        .update({ pick_due_at: pickDueAt })
        .eq('id', nextPick.id)
    } else {
      updateData.current_pick_id = null
      updateData.draft_status = 'completed'
      updateData.draft_completed_at = new Date().toISOString()
    }

    await supabase
      .from('leagues')
      .update(updateData)
      .eq('id', leagueId)

    revalidatePath(`/leagues/${leagueId}/draft`)
    revalidatePath(`/leagues/${leagueId}`)

    return { 
      data: { 
        skipped: true, 
        reason: 'No available players in queue and auto-pick is disabled or no players available',
        next_pick_id: nextPick?.id || null,
      } 
    }
  }

  // Make the pick using the makeDraftPick logic
  const formData = new FormData()
  formData.append('draft_pick_id', draftPickId)
  formData.append('player_id', selectedPlayerId)
  formData.append('league_id', leagueId)

  // Call makeDraftPick but bypass user validation (this is system-initiated)
  // We'll need to use service role or create a system version
  const result = await makeDraftPickSystem(draftPickId, selectedPlayerId, leagueId)

  return result
}

/**
 * System version of makeDraftPick that bypasses user validation
 * Used for auto-picks and timer expiration
 */
async function makeDraftPickSystem(
  draftPickId: string,
  playerId: string,
  leagueId: string
) {
  const supabase = await createClient()
  
  // Get league info with draft status
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, draft_status, current_pick_id, draft_settings')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    return { error: 'League not found' }
  }

  if (league.draft_status !== 'in_progress') {
    return { error: `Draft is not in progress. Current status: ${league.draft_status}` }
  }

  // Get draft pick info
  const { data: draftPick, error: pickError } = await supabase
    .from('draft_picks')
    .select('*, teams(id, owner_user_id, name)')
    .eq('id', draftPickId)
    .eq('league_id', leagueId)
    .single()

  if (pickError || !draftPick) {
    return { error: 'Draft pick not found' }
  }

  if (draftPick.player_id) {
    return { error: 'This pick has already been made' }
  }

  // Check if player is already drafted
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
      pick_due_at: null,
    })
    .eq('id', draftPickId)
    .select()
    .single()

  if (updateError) {
    return { error: updateError.message }
  }

  // Get player info
  const { data: player } = await supabase
    .from('players')
    .select('id, full_name, position')
    .eq('id', playerId)
    .single()

  // Create roster entry
  await supabase
    .from('rosters')
    .insert({
      team_id: draftPick.team_id,
      player_id: playerId,
      league_id: leagueId,
      slot_type: 'BENCH',
      is_starter: false,
    })

  // Create transaction record
  await supabase
    .from('transactions')
    .insert({
      league_id: leagueId,
      team_id: draftPick.team_id,
      type: 'add',
      player_in_id: playerId,
      notes: `Auto-drafted in round ${draftPick.round}, pick ${draftPick.overall_pick}`,
    })

  // Get next pick
  const nextPick = await getNextDraftPick(leagueId)

  // Update league with next pick
  const updateData: {
    current_pick_id?: string | null
    draft_status?: string
    draft_completed_at?: string
  } = {}

  if (nextPick) {
    updateData.current_pick_id = nextPick.id
    const draftSettings = (league.draft_settings as { timer_seconds?: number }) || {}
    const timerSeconds = draftSettings.timer_seconds || 90
    const pickDueAt = calculatePickDueAt(timerSeconds)

    await supabase
      .from('draft_picks')
      .update({ pick_due_at: pickDueAt })
      .eq('id', nextPick.id)
  } else {
    // Draft is complete - finalize everything
    updateData.current_pick_id = null
    updateData.draft_status = 'completed'
    updateData.draft_completed_at = pickedAt
    
    // Finalize draft (validate all picks, ensure rosters are complete)
    await finalizeDraft(leagueId, user.id)
  }

  await supabase
    .from('leagues')
    .update(updateData)
    .eq('id', leagueId)

  // Track auto-pick (non-blocking)
  if (player) {
    trackDraftPickMade(
      leagueId,
      draftPick.round,
      draftPick.overall_pick,
      playerId,
      player.full_name,
      player.position,
      null, // System-initiated, no user
    ).catch(err => {
      console.error('Error tracking auto-pick:', err)
    })
  }

  if (!nextPick) {
    trackDraftCompleted(leagueId, null).catch(err => {
      console.error('Error tracking draft completed:', err)
    })
  }

  revalidatePath(`/leagues/${leagueId}/draft`)
  revalidatePath(`/leagues/${leagueId}`)

  return { 
    data: updatedPick,
    next_pick_id: nextPick?.id || null,
    draft_complete: !nextPick,
    auto_picked: true,
  }
}

/**
 * Check for expired picks and process auto-picks
 * This should be called periodically (e.g., every 5-10 seconds) via API route or edge function
 */
export async function checkAndProcessExpiredPicks() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Find all expired picks in in_progress drafts
  const { data: expiredPicks, error } = await supabase
    .from('draft_picks')
    .select(`
      id,
      league_id,
      pick_due_at,
      leagues!inner (
        id,
        draft_status
      )
    `)
    .not('pick_due_at', 'is', null)
    .lt('pick_due_at', now)
    .is('player_id', null)
    .eq('leagues.draft_status', 'in_progress')

  if (error) {
    console.error('Error finding expired picks:', error)
    return { error: error.message }
  }

  if (!expiredPicks || expiredPicks.length === 0) {
    return { data: { processed: 0, message: 'No expired picks found' } }
  }

  // Process each expired pick
  const results = []
  for (const pick of expiredPicks) {
    try {
      const result = await processAutoPick(pick.id, pick.league_id)
      results.push({ pick_id: pick.id, result })
    } catch (err: any) {
      results.push({ pick_id: pick.id, error: err.message })
    }
  }

  return { 
    data: { 
      processed: expiredPicks.length,
      results,
    } 
  }
}

// ============================================================================
// Draft Queue Server Actions
// ============================================================================

/**
 * Add a player to a team's draft queue
 */
export async function addPlayerToQueue(
  leagueId: string,
  teamId: string,
  playerId: string,
  priority?: number
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user owns the team
  const { data: team } = await supabase
    .from('teams')
    .select('id, owner_user_id, league_id')
    .eq('id', teamId)
    .eq('league_id', leagueId)
    .single()

  if (!team || team.owner_user_id !== user.id) {
    return { error: 'You do not own this team' }
  }

  // Check if player is already in queue
  const { data: existingQueueItem } = await supabase
    .from('draft_queues')
    .select('id')
    .eq('team_id', teamId)
    .eq('league_id', leagueId)
    .eq('player_id', playerId)
    .single()

  if (existingQueueItem) {
    // Update priority if provided
    if (priority !== undefined) {
      const { error: updateError } = await supabase
        .from('draft_queues')
        .update({ priority })
        .eq('id', existingQueueItem.id)

      if (updateError) {
        return { error: updateError.message }
      }

      return { data: { updated: true, queue_item_id: existingQueueItem.id } }
    }

    return { error: 'Player is already in your draft queue' }
  }

  // Get current max priority for this team to set default
  const { data: maxPriorityItem } = await supabase
    .from('draft_queues')
    .select('priority')
    .eq('team_id', teamId)
    .eq('league_id', leagueId)
    .order('priority', { ascending: false })
    .limit(1)
    .single()

  const defaultPriority = priority !== undefined 
    ? priority 
    : (maxPriorityItem?.priority || 0) + 1

  // Add player to queue
  const { data: queueItem, error: insertError } = await supabase
    .from('draft_queues')
    .insert({
      team_id: teamId,
      league_id: leagueId,
      player_id: playerId,
      priority: defaultPriority,
    })
    .select()
    .single()

  if (insertError) {
    return { error: insertError.message }
  }

  // Get queue length for tracking
  const { count: queueLength } = await supabase
    .from('draft_queues')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)
    .eq('league_id', leagueId)

  // Track queue added (non-blocking)
  trackDraftQueueAdded(leagueId, teamId, playerId, queueLength || 0, user.id).catch(err => {
    console.error('Error tracking queue added:', err)
  })

  revalidatePath(`/leagues/${leagueId}/draft`)

  return { data: queueItem }
}

/**
 * Remove a player from a team's draft queue
 */
export async function removePlayerFromQueue(
  leagueId: string,
  teamId: string,
  playerId: string
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user owns the team
  const { data: team } = await supabase
    .from('teams')
    .select('id, owner_user_id, league_id')
    .eq('id', teamId)
    .eq('league_id', leagueId)
    .single()

  if (!team || team.owner_user_id !== user.id) {
    return { error: 'You do not own this team' }
  }

  // Remove player from queue
  const { error: deleteError } = await supabase
    .from('draft_queues')
    .delete()
    .eq('team_id', teamId)
    .eq('league_id', leagueId)
    .eq('player_id', playerId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // Track queue removed (non-blocking)
  trackDraftQueueRemoved(leagueId, teamId, playerId, user.id).catch(err => {
    console.error('Error tracking queue removed:', err)
  })

  revalidatePath(`/leagues/${leagueId}/draft`)

  return { data: { removed: true } }
}

/**
 * Reorder a team's draft queue
 * Updates priorities for multiple queue items
 */
export async function reorderQueue(
  leagueId: string,
  teamId: string,
  queueItemIds: string[] // Array of queue item IDs in desired order (highest priority first)
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user owns the team
  const { data: team } = await supabase
    .from('teams')
    .select('id, owner_user_id, league_id')
    .eq('id', teamId)
    .eq('league_id', leagueId)
    .single()

  if (!team || team.owner_user_id !== user.id) {
    return { error: 'You do not own this team' }
  }

  // Verify all queue items belong to this team
  const { data: queueItems } = await supabase
    .from('draft_queues')
    .select('id')
    .eq('team_id', teamId)
    .eq('league_id', leagueId)
    .in('id', queueItemIds)

  if (!queueItems || queueItems.length !== queueItemIds.length) {
    return { error: 'Some queue items do not belong to this team' }
  }

  // Update priorities (reverse order: first in array = highest priority)
  const updates = queueItemIds.map((itemId, index) => {
    const priority = queueItemIds.length - index // Highest priority = highest number
    return supabase
      .from('draft_queues')
      .update({ priority })
      .eq('id', itemId)
      .eq('team_id', teamId)
      .eq('league_id', leagueId)
  })

  const results = await Promise.all(updates)
  const errors = results.filter(r => r.error)

  if (errors.length > 0) {
    return { error: `Failed to update ${errors.length} queue items` }
  }

  // Track queue reordered (non-blocking)
  trackDraftQueueReordered(leagueId, teamId, user.id).catch(err => {
    console.error('Error tracking queue reordered:', err)
  })

  revalidatePath(`/leagues/${leagueId}/draft`)

  return { data: { reordered: true } }
}

/**
 * Get a team's draft queue
 */
export async function getTeamQueue(leagueId: string, teamId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user owns the team or is league commissioner
  const { data: team } = await supabase
    .from('teams')
    .select('id, owner_user_id, league_id, leagues!inner(created_by_user_id)')
    .eq('id', teamId)
    .eq('league_id', leagueId)
    .single()

  if (!team) {
    return { error: 'Team not found' }
  }

  const league = team.leagues as { created_by_user_id: string } | null
  const isOwner = team.owner_user_id === user.id
  const isCommissioner = league?.created_by_user_id === user.id

  if (!isOwner && !isCommissioner) {
    return { error: 'You do not have permission to view this queue' }
  }

  // Get queue items with player info, ordered by priority
  const { data: queueItems, error } = await supabase
    .from('draft_queues')
    .select(`
      id,
      player_id,
      priority,
      created_at,
      players (
        id,
        full_name,
        position,
        nfl_team,
        bye_week
      )
    `)
    .eq('team_id', teamId)
    .eq('league_id', leagueId)
    .order('priority', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  // Check which players are already drafted
  const { data: draftedPicks } = await supabase
    .from('draft_picks')
    .select('player_id')
    .eq('league_id', leagueId)
    .not('player_id', 'is', null)

  const draftedPlayerIds = new Set(
    (draftedPicks || []).map(p => p.player_id).filter(Boolean)
  )

  // Mark which players are still available
  const queueWithAvailability = (queueItems || []).map(item => ({
    ...item,
    is_available: !draftedPlayerIds.has(item.player_id),
  }))

  return { data: queueWithAvailability }
}

// ============================================================================
// Draft State Helper Functions
// ============================================================================

/**
 * Get current draft state with comprehensive information
 * Returns current pick, next picks preview, draft status, timer info, and team summaries
 */
export async function getCurrentDraftState(leagueId: string) {
  const supabase = await createClient()
  
  // Get league info with draft status
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select(`
      id,
      name,
      draft_status,
      draft_started_at,
      draft_completed_at,
      current_pick_id,
      draft_settings,
      created_by_user_id
    `)
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    return { error: 'League not found' }
  }

  // Get current pick details
  let currentPick = null
  if (league.current_pick_id) {
    const { data: pick } = await supabase
      .from('draft_picks')
      .select(`
        *,
        teams (
          id,
          name,
          owner_user_id
        ),
        players (
          id,
          full_name,
          position,
          nfl_team
        )
      `)
      .eq('id', league.current_pick_id)
      .single()

    if (pick) {
      // Calculate time remaining if timer is active
      let timeRemainingSeconds: number | null = null
      if (pick.pick_due_at && league.draft_status === 'in_progress') {
        const dueAt = new Date(pick.pick_due_at)
        const now = new Date()
        const remaining = Math.max(0, Math.floor((dueAt.getTime() - now.getTime()) / 1000))
        timeRemainingSeconds = remaining
      }

      currentPick = {
        ...pick,
        time_remaining_seconds: timeRemainingSeconds,
        is_expired: timeRemainingSeconds !== null && timeRemainingSeconds === 0,
      }
    }
  }

  // Get next picks preview (next 3-5 picks)
  const { data: nextPicks } = await supabase
    .from('draft_picks')
    .select(`
      id,
      round,
      overall_pick,
      team_id,
      player_id,
      pick_due_at,
      teams (
        id,
        name
      ),
      players (
        id,
        full_name,
        position
      )
    `)
    .eq('league_id', leagueId)
    .is('player_id', null)
    .order('overall_pick', { ascending: true })
    .limit(5)

  // Get team summaries (picks made per team)
  const { data: allPicks } = await supabase
    .from('draft_picks')
    .select(`
      team_id,
      player_id,
      teams (
        id,
        name
      )
    `)
    .eq('league_id', leagueId)

  const teamSummaries: Record<string, {
    team_id: string
    team_name: string
    picks_made: number
    total_picks: number
  }> = {}

  if (allPicks) {
    allPicks.forEach(pick => {
      const teamId = pick.team_id
      const team = pick.teams as { id: string; name: string } | null
      
      if (!teamSummaries[teamId]) {
        teamSummaries[teamId] = {
          team_id: teamId,
          team_name: team?.name || 'Unknown Team',
          picks_made: 0,
          total_picks: 0,
        }
      }
      
      teamSummaries[teamId].total_picks++
      if (pick.player_id) {
        teamSummaries[teamId].picks_made++
      }
    })
  }

  const draftSettings = (league.draft_settings as {
    timer_seconds?: number
    auto_pick_enabled?: boolean
    rounds?: number
  }) || {}

  return {
    data: {
      league_id: leagueId,
      league_name: league.name,
      draft_status: league.draft_status,
      draft_started_at: league.draft_started_at,
      draft_completed_at: league.draft_completed_at,
      current_pick: currentPick,
      next_picks: nextPicks || [],
      draft_settings: {
        timer_seconds: draftSettings.timer_seconds || 90,
        auto_pick_enabled: draftSettings.auto_pick_enabled || false,
        rounds: draftSettings.rounds || 14,
      },
      team_summaries: Object.values(teamSummaries),
    },
  }
}

/**
 * Get draft progress information
 * Returns picks made/total, round progress, team pick counts, estimated time remaining
 */
export async function getDraftProgress(leagueId: string) {
  const supabase = await createClient()
  
  // Get all draft picks
  const { data: allPicks, error: picksError } = await supabase
    .from('draft_picks')
    .select('round, overall_pick, player_id, team_id')
    .eq('league_id', leagueId)
    .order('overall_pick', { ascending: true })

  if (picksError || !allPicks) {
    return { error: 'Failed to fetch draft picks' }
  }

  const totalPicks = allPicks.length
  const picksMade = allPicks.filter(p => p.player_id).length
  const picksRemaining = totalPicks - picksMade

  // Calculate round progress
  const maxRound = Math.max(...allPicks.map(p => p.round), 0)
  const picksByRound: Record<number, { total: number; made: number }> = {}
  
  allPicks.forEach(pick => {
    if (!picksByRound[pick.round]) {
      picksByRound[pick.round] = { total: 0, made: 0 }
    }
    picksByRound[pick.round].total++
    if (pick.player_id) {
      picksByRound[pick.round].made++
    }
  })

  // Find current round (first round with unpicked picks)
  let currentRound = 1
  for (let round = 1; round <= maxRound; round++) {
    const roundData = picksByRound[round]
    if (roundData && roundData.made < roundData.total) {
      currentRound = round
      break
    }
  }

  const currentRoundData = picksByRound[currentRound] || { total: 0, made: 0 }
  const currentRoundProgress = currentRoundData.total > 0
    ? Math.round((currentRoundData.made / currentRoundData.total) * 100)
    : 0

  // Get league settings for time estimation
  const { data: league } = await supabase
    .from('leagues')
    .select('draft_settings, draft_started_at, draft_status')
    .eq('id', leagueId)
    .single()

  const draftSettings = (league?.draft_settings as { timer_seconds?: number }) || {}
  const timerSeconds = draftSettings.timer_seconds || 90

  // Estimate time remaining (based on average pick time or timer)
  let estimatedTimeRemainingSeconds: number | null = null
  if (league?.draft_started_at && league.draft_status === 'in_progress' && picksMade > 0) {
    const startedAt = new Date(league.draft_started_at)
    const now = new Date()
    const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)
    const averageTimePerPick = elapsedSeconds / picksMade
    estimatedTimeRemainingSeconds = Math.round(averageTimePerPick * picksRemaining)
  } else if (picksRemaining > 0) {
    // If draft hasn't started, estimate based on timer
    estimatedTimeRemainingSeconds = picksRemaining * timerSeconds
  }

  // Get team pick counts
  const teamPickCounts: Record<string, number> = {}
  allPicks.forEach(pick => {
    if (pick.player_id) {
      teamPickCounts[pick.team_id] = (teamPickCounts[pick.team_id] || 0) + 1
    }
  })

  return {
    data: {
      picks_made: picksMade,
      picks_remaining: picksRemaining,
      total_picks: totalPicks,
      progress_percentage: totalPicks > 0 ? Math.round((picksMade / totalPicks) * 100) : 0,
      current_round: currentRound,
      total_rounds: maxRound,
      current_round_progress: currentRoundProgress,
      current_round_picks_made: currentRoundData.made,
      current_round_total_picks: currentRoundData.total,
      picks_by_round: picksByRound,
      team_pick_counts: teamPickCounts,
      estimated_time_remaining_seconds: estimatedTimeRemainingSeconds,
    },
  }
}

/**
 * Update draft settings
 * Allows commissioner to configure timer, auto-pick, and rounds
 */
export async function updateDraftSettings(
  leagueId: string,
  settings: {
    timer_seconds?: number
    auto_pick_enabled?: boolean
    rounds?: number
  }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is league creator (commissioner)
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id, draft_settings')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league || league.created_by_user_id !== user.id) {
    return { error: 'Only the league commissioner can update draft settings' }
  }

  // Merge with existing settings
  const currentSettings = (league.draft_settings as {
    timer_seconds?: number
    auto_pick_enabled?: boolean
    rounds?: number
  }) || {}

  const updatedSettings = {
    ...currentSettings,
    ...settings,
  }

  // Validate settings
  if (updatedSettings.timer_seconds !== undefined) {
    if (updatedSettings.timer_seconds < 10 || updatedSettings.timer_seconds > 600) {
      return { error: 'Timer must be between 10 and 600 seconds' }
    }
  }

  if (updatedSettings.rounds !== undefined) {
    if (updatedSettings.rounds < 1 || updatedSettings.rounds > 20) {
      return { error: 'Rounds must be between 1 and 20' }
    }
  }

  // Update league settings
  const { error: updateError } = await supabase
    .from('leagues')
    .update({ draft_settings: updatedSettings })
    .eq('id', leagueId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath(`/leagues/${leagueId}/draft`)
  revalidatePath(`/leagues/${leagueId}`)

  return { data: { settings: updatedSettings } }
}

/**
 * Extend the timer for the current pick
 * Adds additional time to the pick_due_at timestamp
 */
export async function extendTimer(leagueId: string, additionalSeconds: number = 30) {
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
    return { error: 'Only the league commissioner can extend the timer' }
  }

  if (league.draft_status !== 'in_progress') {
    return { error: 'Draft is not currently in progress' }
  }

  if (!league.current_pick_id) {
    return { error: 'No current pick found' }
  }

  // Get current pick
  const { data: currentPick, error: pickError } = await supabase
    .from('draft_picks')
    .select('id, pick_due_at')
    .eq('id', league.current_pick_id)
    .single()

  if (pickError || !currentPick) {
    return { error: 'Current pick not found' }
  }

  if (currentPick.player_id) {
    return { error: 'This pick has already been made' }
  }

  // Calculate new due time
  const currentDueAt = currentPick.pick_due_at 
    ? new Date(currentPick.pick_due_at)
    : new Date()
  
  const newDueAt = new Date(currentDueAt.getTime() + additionalSeconds * 1000)

  // Update pick with extended timer
  const { error: updateError } = await supabase
    .from('draft_picks')
    .update({ pick_due_at: newDueAt.toISOString() })
    .eq('id', league.current_pick_id)

  if (updateError) {
    return { error: updateError.message }
  }

  // Track timer extended (non-blocking)
  const timeRemainingBefore = currentPick.pick_due_at 
    ? Math.max(0, Math.floor((new Date(currentPick.pick_due_at).getTime() - new Date().getTime()) / 1000))
    : undefined
  trackDraftTimerExtended(leagueId, additionalSeconds, timeRemainingBefore, user.id).catch(err => {
    console.error('Error tracking timer extended:', err)
  })

  revalidatePath(`/leagues/${leagueId}/draft`)
  revalidatePath(`/leagues/${leagueId}`)

  return { data: { extended: true, new_due_at: newDueAt.toISOString() } }
}

/**
 * Finalize a completed draft
 * Validates all picks are made, ensures rosters are complete, and finalizes the draft
 */
async function finalizeDraft(leagueId: string, userId: string | null) {
  const supabase = await createClient()
  
  // Verify all picks are made
  const { data: allPicks, error: picksError } = await supabase
    .from('draft_picks')
    .select('id, player_id, team_id')
    .eq('league_id', leagueId)

  if (picksError) {
    console.error('Error fetching draft picks during finalization:', picksError)
    return
  }

  // Check for any unpicked slots
  const unpickedPicks = allPicks?.filter(p => !p.player_id) || []
  if (unpickedPicks.length > 0) {
    console.warn(`Draft completion attempted but ${unpickedPicks.length} picks are still unpicked`)
    // Don't throw error - allow manual completion if needed
  }

  // Ensure all drafted players have roster entries
  const draftedPicks = allPicks?.filter(p => p.player_id) || []
  for (const pick of draftedPicks) {
    if (!pick.player_id || !pick.team_id) continue

    // Check if roster entry exists
    const { data: existingRoster } = await supabase
      .from('rosters')
      .select('id')
      .eq('league_id', leagueId)
      .eq('team_id', pick.team_id)
      .eq('player_id', pick.player_id)
      .single()

    // Create roster entry if it doesn't exist (default to BENCH)
    if (!existingRoster) {
      await supabase
        .from('rosters')
        .insert({
          team_id: pick.team_id,
          player_id: pick.player_id,
          league_id: leagueId,
          slot_type: 'BENCH',
          is_starter: false,
        })
    }
  }

  // Track draft completion (non-blocking, only if userId provided)
  if (userId) {
    trackDraftCompleted(leagueId, userId).catch(err => {
      console.error('Error tracking draft completed:', err)
    })
  }
}

