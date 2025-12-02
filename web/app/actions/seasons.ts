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

