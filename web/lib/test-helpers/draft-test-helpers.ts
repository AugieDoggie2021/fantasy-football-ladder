/**
 * Draft System Test Helpers
 * Utilities for testing draft functionality
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface TestDraftSetup {
  leagueId: string
  teamIds: string[]
  userIds: string[]
  draftPickIds: string[]
}

/**
 * Create a test league with teams for draft testing
 */
export async function createTestDraftLeague(
  commissionerUserId: string,
  teamCount: number = 4,
  seasonYear: number = new Date().getFullYear()
): Promise<{ leagueId: string; teamIds: string[] }> {
  const supabase = await createClient()

  // Create test league
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .insert({
      name: `Test Draft League ${Date.now()}`,
      created_by_user_id: commissionerUserId,
      draft_status: 'scheduled',
      draft_settings: {
        timer_seconds: 90,
        auto_pick_enabled: true,
        rounds: 14,
      },
    })
    .select()
    .single()

  if (leagueError || !league) {
    throw new Error(`Failed to create test league: ${leagueError?.message}`)
  }

  // Get or create season
  let { data: season } = await supabase
    .from('seasons')
    .select('id')
    .eq('year', seasonYear)
    .single()

  if (!season) {
    const { data: newSeason, error: seasonError } = await supabase
      .from('seasons')
      .insert({ year: seasonYear })
      .select()
      .single()

    if (seasonError || !newSeason) {
      throw new Error(`Failed to create season: ${seasonError?.message}`)
    }
    season = newSeason
  }

  // Link league to season
  await supabase
    .from('league_seasons')
    .insert({
      league_id: league.id,
      season_id: season.id,
    })

  // Create test teams
  const teamIds: string[] = []
  // Use service role client for admin operations (creating users)
  const adminClient = createServiceRoleClient()
  
  for (let i = 0; i < teamCount; i++) {
    // Create test user for each team using admin client
    const { data: user, error: userError } = await adminClient.auth.admin.createUser({
      email: `test-team-${i}-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      email_confirm: true,
    })

    if (userError || !user.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`)
    }

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: `Test Team ${i + 1}`,
        league_id: league.id,
        owner_user_id: user.user.id,
        draft_position: i + 1,
        is_active: true,
      })
      .select()
      .single()

    if (teamError || !team) {
      throw new Error(`Failed to create test team: ${teamError?.message}`)
    }

    teamIds.push(team.id)
  }

  return { leagueId: league.id, teamIds }
}

/**
 * Generate draft picks for a test league
 */
export async function generateTestDraftPicks(
  leagueId: string,
  rounds: number = 14
): Promise<string[]> {
  const supabase = await createClient()

  // Get teams
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, draft_position')
    .eq('league_id', leagueId)
    .eq('is_active', true)
    .order('draft_position', { ascending: true })

  if (teamsError || !teams || teams.length === 0) {
    throw new Error(`Failed to get teams: ${teamsError?.message}`)
  }

  const teamCount = teams.length
  const draftPickIds: string[] = []

  // Generate snake draft order
  for (let round = 1; round <= rounds; round++) {
    const isOddRound = round % 2 === 1
    const teamOrder = isOddRound
      ? teams
      : [...teams].reverse()

    for (let pickInRound = 0; pickInRound < teamCount; pickInRound++) {
      const overallPick = (round - 1) * teamCount + pickInRound + 1
      const team = teamOrder[pickInRound]

      const { data: draftPick, error: pickError } = await supabase
        .from('draft_picks')
        .insert({
          league_id: leagueId,
          team_id: team.id,
          round,
          overall_pick: overallPick,
        })
        .select()
        .single()

      if (pickError || !draftPick) {
        throw new Error(`Failed to create draft pick: ${pickError?.message}`)
      }

      draftPickIds.push(draftPick.id)
    }
  }

  return draftPickIds
}

/**
 * Reset a test draft to initial state
 */
export async function resetTestDraft(leagueId: string): Promise<void> {
  const supabase = await createClient()

  // Clear all picks
  await supabase
    .from('draft_picks')
    .update({ player_id: null, picked_at: null, pick_due_at: null })
    .eq('league_id', leagueId)

  // Clear queues
  await supabase
    .from('draft_queues')
    .delete()
    .eq('league_id', leagueId)

  // Reset league status
  await supabase
    .from('leagues')
    .update({
      draft_status: 'scheduled',
      draft_started_at: null,
      draft_completed_at: null,
      current_pick_id: null,
    })
    .eq('id', leagueId)

  // Clear rosters (optional - may want to keep for testing)
  // await supabase
  //   .from('rosters')
  //   .delete()
  //   .eq('league_id', leagueId)
}

/**
 * Get draft state for testing
 */
export async function getTestDraftState(leagueId: string) {
  const supabase = await createClient()

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', leagueId)
    .single()

  const { data: picks } = await supabase
    .from('draft_picks')
    .select('*')
    .eq('league_id', leagueId)
    .order('overall_pick', { ascending: true })

  const { data: queues } = await supabase
    .from('draft_queues')
    .select('*')
    .eq('league_id', leagueId)

  return {
    league,
    picks: picks || [],
    queues: queues || [],
  }
}

/**
 * Make a test pick (bypasses validation for testing)
 */
export async function makeTestPick(
  draftPickId: string,
  playerId: string,
  leagueId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get draft pick
  const { data: pick } = await supabase
    .from('draft_picks')
    .select('*')
    .eq('id', draftPickId)
    .single()

  if (!pick || pick.player_id) {
    return { success: false, error: 'Pick not found or already made' }
  }

  // Make the pick
  const { error: updateError } = await supabase
    .from('draft_picks')
    .update({
      player_id: playerId,
      picked_at: new Date().toISOString(),
      pick_due_at: null,
    })
    .eq('id', draftPickId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Create roster entry
  await supabase
    .from('rosters')
    .insert({
      team_id: pick.team_id,
      player_id: playerId,
      league_id: leagueId,
      slot_type: 'BENCH',
      is_starter: false,
    })

  return { success: true }
}

/**
 * Verify draft completion
 */
export async function verifyDraftComplete(leagueId: string): Promise<{
  complete: boolean
  missingPicks: number
  errors: string[]
}> {
  const supabase = await createClient()

  const { data: picks } = await supabase
    .from('draft_picks')
    .select('id, player_id')
    .eq('league_id', leagueId)

  const missingPicks = picks?.filter(p => !p.player_id).length || 0
  const errors: string[] = []

  // Check all picks are made
  if (missingPicks > 0) {
    errors.push(`${missingPicks} picks are still missing players`)
  }

  // Check for duplicate players
  const playerIds = picks?.filter(p => p.player_id).map(p => p.player_id) || []
  const uniquePlayerIds = new Set(playerIds)
  if (playerIds.length !== uniquePlayerIds.size) {
    errors.push('Duplicate players found in draft')
  }

  // Check rosters
  const { data: teams } = await supabase
    .from('teams')
    .select('id')
    .eq('league_id', leagueId)
    .eq('is_active', true)

  for (const team of teams || []) {
    const { count } = await supabase
      .from('rosters')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id)
      .eq('league_id', leagueId)

    const expectedCount = picks?.filter(p => p.team_id === team.id && p.player_id).length || 0
    if (count !== expectedCount) {
      errors.push(`Team ${team.id} has ${count} roster entries but should have ${expectedCount}`)
    }
  }

  return {
    complete: missingPicks === 0 && errors.length === 0,
    missingPicks,
    errors,
  }
}

