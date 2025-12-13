/**
 * Draft Helper Functions
 * 
 * Utilities for generating snake draft order and draft picks,
 * and checking draft permissions
 */

import { createClient } from '@/lib/supabase/server'

interface Team {
  id: string
  name: string
  draft_position?: number | null
}

const normalizeDraftStatus = (status?: string | null) => {
  if (!status) return 'pre_draft'
  if (status === 'scheduled') return 'pre_draft'
  if (status === 'in_progress') return 'live'
  return status
}

const isLiveStatus = (status?: string | null) => normalizeDraftStatus(status) === 'live'

/**
 * Generate snake draft order based on teams
 * For MVP: uses team creation order if draft_position is not set
 */
export function generateSnakeDraftOrder(teams: Team[], rounds: number = 14): number[][] {
  const sortedTeams = [...teams].sort((a, b) => {
    // Use draft_position if available, otherwise use creation order (implicit from array order)
    const posA = a.draft_position ?? 0
    const posB = b.draft_position ?? 0
    return posA - posB
  })

  const teamCount = sortedTeams.length
  const draftOrder: number[][] = []

  for (let round = 1; round <= rounds; round++) {
    const roundOrder: number[] = []
    
    if (round % 2 === 1) {
      // Odd rounds: 1, 2, 3, ..., n
      for (let i = 0; i < teamCount; i++) {
        roundOrder.push(i)
      }
    } else {
      // Even rounds: n, n-1, ..., 2, 1 (reversed)
      for (let i = teamCount - 1; i >= 0; i--) {
        roundOrder.push(i)
      }
    }
    
    draftOrder.push(roundOrder)
  }

  return draftOrder
}

/**
 * Generate overall pick numbers for snake draft
 * Returns array of { round, overallPick, teamIndex } objects
 */
export function generateDraftPicks(teams: Team[], rounds: number = 14): Array<{
  round: number
  overallPick: number
  teamIndex: number
  teamId: string
}> {
  const draftOrder = generateSnakeDraftOrder(teams, rounds)
  const picks: Array<{
    round: number
    overallPick: number
    teamIndex: number
    teamId: string
  }> = []

  let overallPick = 1

  draftOrder.forEach((roundOrder, roundIndex) => {
    const round = roundIndex + 1
    roundOrder.forEach(teamIndex => {
      picks.push({
        round,
        overallPick: overallPick++,
        teamIndex,
        teamId: teams[teamIndex].id,
      })
    })
  })

  return picks
}

// ============================================================================
// Draft Permission Helpers
// ============================================================================

/**
 * Check if a user is the commissioner of a league's draft
 */
export async function isDraftCommissioner(userId: string, leagueId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: league } = await supabase
    .from('leagues')
    .select('created_by_user_id')
    .eq('id', leagueId)
    .single()

  return league?.created_by_user_id === userId
}

/**
 * Get the user's team in a league
 * Returns the team if the user owns a team in the league, null otherwise
 */
export async function getUserTeamInLeague(
  userId: string,
  leagueId: string
): Promise<{ id: string; name: string; owner_user_id: string } | null> {
  const supabase = await createClient()
  
  const { data: team } = await supabase
    .from('teams')
    .select('id, name, owner_user_id')
    .eq('league_id', leagueId)
    .eq('owner_user_id', userId)
    .eq('is_active', true)
    .single()

  return team || null
}

/**
 * Check if a user can make a draft pick
 * Returns an object with canPick boolean and reason if false
 */
export async function canMakePick(
  userId: string,
  leagueId: string,
  draftPickId: string
): Promise<{
  canPick: boolean
  reason?: string
  isCommissioner?: boolean
  userTeamId?: string | null
}> {
  const supabase = await createClient()
  
  // Get league info
  const { data: league } = await supabase
    .from('leagues')
    .select('id, created_by_user_id, draft_status, current_pick_id')
    .eq('id', leagueId)
    .single()

  if (!league) {
    return { canPick: false, reason: 'League not found' }
  }

  // Check if user is commissioner
  const isCommissioner = league.created_by_user_id === userId

  // Check draft status
  if (!isLiveStatus(league.draft_status)) {
    return {
      canPick: false,
      reason: `Draft is not in progress. Current status: ${league.draft_status}`,
      isCommissioner,
    }
  }

  // Get draft pick info
  const { data: draftPick } = await supabase
    .from('draft_picks')
    .select(`
      *,
      teams (
        id,
        owner_user_id
      )
    `)
    .eq('id', draftPickId)
    .eq('league_id', leagueId)
    .single()

  if (!draftPick) {
    return { canPick: false, reason: 'Draft pick not found', isCommissioner }
  }

  // Check if pick has already been made
  if (draftPick.player_id) {
    return { canPick: false, reason: 'This pick has already been made', isCommissioner }
  }

  // Commissioner can make any pick
  if (isCommissioner) {
    return { canPick: true, isCommissioner: true }
  }

  // Check if this is the current pick
  const isCurrentPick = league.current_pick_id === draftPickId
  if (!isCurrentPick) {
    return {
      canPick: false,
      reason: 'It is not your turn to pick. Please wait for your turn.',
      isCommissioner: false,
    }
  }

  // Get user's team
  const userTeam = await getUserTeamInLeague(userId, leagueId)
  if (!userTeam) {
    return { canPick: false, reason: 'You do not have a team in this league', isCommissioner: false }
  }

  // Check if it's the user's team's pick
  const pickTeam = draftPick.teams as { id: string; owner_user_id: string } | null
  if (!pickTeam || pickTeam.id !== userTeam.id) {
    return {
      canPick: false,
      reason: 'This is not your pick. Please wait for your turn.',
      isCommissioner: false,
      userTeamId: userTeam.id,
    }
  }

  return {
    canPick: true,
    isCommissioner: false,
    userTeamId: userTeam.id,
  }
}
