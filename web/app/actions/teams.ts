'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isGlobalAdmin } from '@/lib/auth-roles'

export async function createTeam(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const leagueId = formData.get('league_id') as string
  const name = formData.get('name') as string
  const logoUrl = formData.get('logo_url') as string || null

  if (!leagueId || !name) {
    return { error: 'League and team name are required' }
  }

  // Check if user already has a team in this league
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('league_id', leagueId)
    .eq('owner_user_id', user.id)
    .single()

  if (existingTeam) {
    return { error: 'You already have a team in this league' }
  }

  const { data, error } = await supabase
    .from('teams')
    .insert({
      league_id: leagueId,
      owner_user_id: user.id,
      name,
      logo_url: logoUrl || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/leagues/${leagueId}`)
  revalidatePath('/dashboard')
  
  return { data }
}

export async function createCommissionerTeam(leagueId: string, name = "Commissioner's Team") {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  const { data: league } = await supabase
    .from('leagues')
    .select('id, created_by_user_id, max_teams')
    .eq('id', leagueId)
    .single()

  if (!league) {
    return { error: 'League not found' }
  }

  const isCommissioner = league.created_by_user_id === user.id
  const isAdmin = isGlobalAdmin(profile as any)
  if (!isCommissioner && !isAdmin) {
    return { error: 'Only the commissioner can create this team' }
  }

  // Check if user already has a team
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('league_id', leagueId)
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (existingTeam) {
    return { error: 'You already have a team in this league' }
  }

  // Check capacity
  const { count: teamCount } = await supabase
    .from('teams')
    .select('id', { count: 'exact', head: true })
    .eq('league_id', leagueId)
    .eq('is_active', true)

  const currentCount = teamCount || 0
  if (currentCount >= league.max_teams) {
    return { error: 'League is full' }
  }

  const { error } = await supabase
    .from('teams')
    .insert({
      league_id: leagueId,
      owner_user_id: user.id,
      name,
      is_bot: false,
      is_active: true,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/leagues/${leagueId}`)
  revalidatePath('/dashboard')
  return { data: { created: true } }
}
