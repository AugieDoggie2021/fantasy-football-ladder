'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isGlobalAdmin } from '@/lib/auth-roles'
import { isTestTeamsEnabled } from './feature-flags'
import { randomUUID } from 'crypto'

interface FillLeagueWithTestTeamsParams {
  leagueId: string
  requestedTeamCount?: number
  currentUserId: string
}

export async function fillLeagueWithTestTeams({
  leagueId,
  requestedTeamCount,
  currentUserId,
}: FillLeagueWithTestTeamsParams) {
  if (!isTestTeamsEnabled()) {
    return { error: 'Feature disabled' }
  }

  const supabase = await createClient()

  // Fetch current user profile for admin check
  const { data: profileResult } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', currentUserId)
    .maybeSingle()

  // Fetch league for max teams and commissioner
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, name, max_teams, created_by_user_id')
    .eq('id', leagueId)
    .maybeSingle()

  if (leagueError || !league) {
    return { error: 'League not found' }
  }

  const isCommissioner = league.created_by_user_id === currentUserId
  const isAdmin = isGlobalAdmin(profileResult as any)

  if (!isCommissioner && !isAdmin) {
    return { error: 'Only commissioners or admins can create test teams' }
  }

  // Clamp target count
  const targetCount = Math.max(
    2,
    Math.min(requestedTeamCount || league.max_teams, league.max_teams),
  )

  // Fetch existing teams
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, name, is_bot, owner_user_id')
    .eq('league_id', leagueId)

  if (teamsError) {
    return { error: teamsError.message || 'Failed to load teams' }
  }

  const existingRealTeams = (teams || []).filter((t) => !t.is_bot)
  const existingBotTeams = (teams || []).filter((t) => t.is_bot)
  const existingCount = (teams || []).length

  if (existingCount >= targetCount) {
    return {
      created: 0,
      totalTeams: existingCount,
      message: 'League already has target number of teams',
    }
  }

  const missing = targetCount - existingCount

  // Determine next numeric suffix for "Test Team X"
  const existingIndexes = (teams || [])
    .map((t) => {
      const match = /^Test Team (\d+)$/.exec(t.name || '')
      return match ? parseInt(match[1], 10) : null
    })
    .filter((n): n is number => n !== null)

  let nextIndex = existingIndexes.length > 0 ? Math.max(...existingIndexes) + 1 : 1

  const now = new Date().toISOString()
  const rows = Array.from({ length: missing }).map(() => {
    const name = `Test Team ${nextIndex++}`
    return {
      id: randomUUID(),
      league_id: leagueId,
      owner_user_id: null,
      name,
      is_bot: true,
      bot_note: `Created via test tool at ${now} by ${currentUserId}`,
      is_active: true,
      created_at: now,
    }
  })

  const { error: insertError } = await supabase.from('teams').insert(rows)
  if (insertError) {
    return { error: insertError.message || 'Failed to create test teams' }
  }

  revalidatePath(`/leagues/${leagueId}`)
  revalidatePath('/dashboard')

  return {
    created: missing,
    totalTeams: targetCount,
    message: `Created ${missing} test team(s)`,
  }
}
