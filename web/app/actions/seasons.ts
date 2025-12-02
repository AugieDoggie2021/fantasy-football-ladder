'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSeason(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const year = parseInt(formData.get('year') as string)
  const status = (formData.get('status') as string) || 'preseason'

  if (!year || isNaN(year)) {
    return { error: 'Year is required and must be a number' }
  }

  const { data, error } = await supabase
    .from('seasons')
    .insert({
      year,
      status,
      created_by_user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/seasons')
  revalidatePath('/dashboard')
  
  return { data }
}

/**
 * Mark season as complete for a promotion group (and optionally all leagues in it)
 */
export async function completeSeasonForPromotionGroup(promotionGroupId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is promotion group creator
  const { data: promotionGroup } = await supabase
    .from('promotion_groups')
    .select('id, season_id, created_by_user_id')
    .eq('id', promotionGroupId)
    .single()

  if (!promotionGroup || promotionGroup.created_by_user_id !== user.id) {
    return { error: 'Only the promotion group creator can complete seasons' }
  }

  // Update season status
  const { error: seasonError } = await supabase
    .from('seasons')
    .update({ status: 'complete' })
    .eq('id', promotionGroup.season_id)

  if (seasonError) {
    return { error: seasonError.message }
  }

  // Update all leagues in this promotion group to complete
  const { error: leaguesError } = await supabase
    .from('leagues')
    .update({ status: 'complete' })
    .eq('promotion_group_id', promotionGroupId)

  if (leaguesError) {
    return { error: leaguesError.message }
  }

  revalidatePath(`/promotion-groups/${promotionGroupId}`)
  
  return { success: true }
}
