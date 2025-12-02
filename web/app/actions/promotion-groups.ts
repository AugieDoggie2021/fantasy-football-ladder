'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPromotionGroup(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const seasonId = formData.get('season_id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!seasonId || !name) {
    return { error: 'Season and name are required' }
  }

  const { data, error } = await supabase
    .from('promotion_groups')
    .insert({
      season_id: seasonId,
      name,
      description: description || null,
      created_by_user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/promotion-groups')
  revalidatePath('/dashboard')
  
  return { data }
}

