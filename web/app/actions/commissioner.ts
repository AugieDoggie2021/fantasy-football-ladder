'use server'

import { createLeague } from './leagues'
import { revalidatePath } from 'next/cache'

/**
 * Create a league as a commissioner
 * This is a wrapper around createLeague for the commissioner onboarding flow
 */
export async function createCommissionerLeague(formData: FormData) {
  // Reuse the existing createLeague action
  const result = await createLeague(formData)
  
  if (result.data) {
    revalidatePath('/commissioner/get-started')
    revalidatePath('/dashboard')
  }
  
  return result
}

