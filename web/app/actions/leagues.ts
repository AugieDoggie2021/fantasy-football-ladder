'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithProfile, isGlobalAdmin } from '@/lib/auth-roles'

/**
 * Create a new league
 * 
 * Season is now inferred from the active season (status = 'active' or most recent 'preseason').
 * Users no longer select a season - this is handled automatically.
 */
export async function createLeague(formData: FormData) {
  const supabase = await createClient()
  
  const userWithProfile = await getCurrentUserWithProfile()
  if (!userWithProfile?.user) {
    return { error: 'Not authenticated' }
  }

  const { user, profile } = userWithProfile
  const isAdmin = isGlobalAdmin(profile)

  // Infer active season - look for status 'active' first, then 'preseason', then most recent
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id, year, status')
    .or('status.eq.active,status.eq.preseason')
    .order('status', { ascending: true }) // 'active' comes before 'preseason' alphabetically
    .order('year', { ascending: false })
    .limit(1)
    .single()

  if (!activeSeason) {
    // Only show this error to admins/commissioners
    // Regular users should never hit this (they should be gated at the page level)
    if (isAdmin) {
      return { error: 'No active season is configured yet. Go to Season Configuration (Admin) to set the active season.' }
    }
    return { error: 'You don\'t have permission to create a league. Ask your commissioner to set one up.' }
  }

  const seasonId = activeSeason.id
  const name = formData.get('name') as string
  const leagueType = formData.get('league_type') as string // 'standalone' or 'ladder'
  const promotionGroupId = leagueType === 'ladder' ? (formData.get('promotion_group_id') as string || null) : null
  const newLadderName = formData.get('new_ladder_name') as string
  const tier = formData.get('tier') as string
  const maxTeams = parseInt(formData.get('max_teams') as string) || 10

  if (!name) {
    return { error: 'League name is required' }
  }

  // If creating a new ladder, create it first
  let finalPromotionGroupId = promotionGroupId
  if (leagueType === 'ladder' && newLadderName && !promotionGroupId) {
    const { data: newLadder, error: ladderError } = await supabase
      .from('promotion_groups')
      .insert({
        name: newLadderName,
        season_id: seasonId,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (ladderError) {
      return { error: `Failed to create ladder: ${ladderError.message}` }
    }
    finalPromotionGroupId = newLadder.id
  }

  const { data, error } = await supabase
    .from('leagues')
    .insert({
      season_id: seasonId,
      promotion_group_id: finalPromotionGroupId || null,
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
  if (finalPromotionGroupId) {
    revalidatePath(`/promotion-groups/${finalPromotionGroupId}`)
  }
  
  return { data }
}

