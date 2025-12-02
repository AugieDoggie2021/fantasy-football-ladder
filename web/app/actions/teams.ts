'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

