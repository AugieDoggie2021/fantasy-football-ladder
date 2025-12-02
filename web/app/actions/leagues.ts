'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLeague(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const seasonId = formData.get('season_id') as string
  const name = formData.get('name') as string
  const promotionGroupId = formData.get('promotion_group_id') as string || null
  const tier = formData.get('tier') as string
  const maxTeams = parseInt(formData.get('max_teams') as string) || 10

  if (!seasonId || !name) {
    return { error: 'Season and name are required' }
  }

  const { data, error } = await supabase
    .from('leagues')
    .insert({
      season_id: seasonId,
      promotion_group_id: promotionGroupId || null,
      name,
      tier: tier ? parseInt(tier) : null,
      max_teams: maxTeams,
      status: 'preseason',
      scoring_settings: {},
      draft_type: 'snake',
      created_by_user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/leagues')
  revalidatePath('/dashboard')
  if (promotionGroupId) {
    revalidatePath(`/promotion-groups/${promotionGroupId}`)
  }
  
  return { data }
}

