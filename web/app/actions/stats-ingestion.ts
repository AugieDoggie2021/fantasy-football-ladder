'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Trigger external players sync
 * 
 * Calls the sync_external_players edge function to fetch and sync all players
 * from the external stats provider (SportsData.io).
 * 
 * Only available in dev environment or for admin users.
 */
export async function triggerExternalPlayersSync() {
  const env = process.env.NEXT_PUBLIC_APP_ENV || 'dev'
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user is admin (if users table has is_admin column)
  let isAdmin = false
  if (env !== 'dev') {
    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    isAdmin = userProfile?.is_admin === true
  }

  // Only allow in dev or if user is admin
  if (env !== 'dev' && !isAdmin) {
    throw new Error('External players sync is only available in dev environment or for admin users')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const functionUrl = `${supabaseUrl}/functions/v1/sync_external_players`
  const ingestionSecret = process.env.INGESTION_SHARED_SECRET

  if (!ingestionSecret) {
    throw new Error('INGESTION_SHARED_SECRET not configured')
  }

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-INGESTION-KEY': ingestionSecret,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `Failed to sync external players: ${response.status}`)
    }

    return data
  } catch (error: any) {
    throw new Error(error.message || 'Failed to call sync external players function')
  }
}

/**
 * Trigger external week stats sync
 * 
 * Calls the sync_external_week_stats edge function to fetch and sync weekly player stats
 * from the external stats provider (SportsData.io) for a given season and week.
 * 
 * Only available in dev environment or for admin users.
 * 
 * @param seasonYear - The NFL season year (e.g., 2024)
 * @param week - The NFL week number (1-18)
 * @param mode - Optional mode: 'live' or 'replay' (for future API replay support)
 */
export async function triggerExternalWeekStatsSync(
  seasonYear: number,
  week: number,
  mode: 'live' | 'replay' = 'live'
) {
  const env = process.env.NEXT_PUBLIC_APP_ENV || 'dev'
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user is admin (if users table has is_admin column)
  let isAdmin = false
  if (env !== 'dev') {
    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    isAdmin = userProfile?.is_admin === true
  }

  // Only allow in dev or if user is admin
  if (env !== 'dev' && !isAdmin) {
    throw new Error('External week stats sync is only available in dev environment or for admin users')
  }

  if (!seasonYear || !week) {
    throw new Error('seasonYear and week are required')
  }

  if (week < 1 || week > 18) {
    throw new Error('week must be between 1 and 18')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const functionUrl = `${supabaseUrl}/functions/v1/sync_external_week_stats`
  const ingestionSecret = process.env.INGESTION_SHARED_SECRET

  if (!ingestionSecret) {
    throw new Error('INGESTION_SHARED_SECRET not configured')
  }

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-INGESTION-KEY': ingestionSecret,
      },
      body: JSON.stringify({
        seasonYear,
        week,
        mode,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `Failed to sync external week stats: ${response.status}`)
    }

    return data
  } catch (error: any) {
    throw new Error(error.message || 'Failed to call sync external week stats function')
  }
}

