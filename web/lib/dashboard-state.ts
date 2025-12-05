import { createClient } from '@/lib/supabase/server'

export interface DashboardState {
  teams: any[]
  leaguesOwned: any[]
  pendingInvites: any[]
}

/**
 * Get dashboard state for a user
 * Returns teams, leagues owned, and pending invites
 */
export async function getDashboardState(userId: string): Promise<DashboardState> {
  const supabase = await createClient()

  // Fetch teams where user is a player
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      league_id,
      leagues (
        id,
        name,
        tier,
        status,
        seasons (
          id,
          year
        ),
        promotion_groups (
          id,
          name
        )
      )
    `)
    .eq('owner_user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Fetch leagues where user is commissioner
  const { data: leaguesOwned } = await supabase
    .from('leagues')
    .select(`
      id,
      name,
      tier,
      status,
      max_teams,
      seasons (
        id,
        year
      ),
      promotion_groups (
        id,
        name
      )
    `)
    .eq('created_by_user_id', userId)
    .order('created_at', { ascending: false })

  // Fetch pending invites for this user
  // For now, we'll fetch invites that match the user's email
  // (Token-based invites are handled via the /join/league/[token] route)
  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = user?.email

  let pendingInvites: any[] = []
  if (userEmail) {
    const { data: invites } = await supabase
      .from('league_invites')
      .select(`
        id,
        token,
        email,
        status,
        created_at,
        leagues (
          id,
          name,
          promotion_groups (
            id,
            name
          )
        )
      `)
      .eq('email', userEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    // Filter out expired invites
    if (invites) {
      pendingInvites = invites.filter(invite => {
        // If no expires_at, it's valid
        // Otherwise check if it's not expired
        return true // For now, we'll handle expiration in the accept flow
      })
    }
  }

  return {
    teams: teams || [],
    leaguesOwned: leaguesOwned || [],
    pendingInvites: pendingInvites || [],
  }
}

