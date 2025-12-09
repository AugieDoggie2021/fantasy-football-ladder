'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUserWithProfile, isGlobalAdmin } from '@/lib/auth-roles'
import { trackLeagueCreated, trackLeagueDeleted } from '@/lib/analytics/server-track'

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
    // Check if we're in the current year and season might be too far along
    const currentYear = new Date().getFullYear()
    const { data: currentYearSeason } = await supabase
      .from('seasons')
      .select('id, year, status')
      .eq('year', currentYear)
      .order('status', { ascending: true })
      .limit(1)
      .maybeSingle()

    const nextYear = currentYear + 1
    const isTooLateInSeason = currentYearSeason && currentYearSeason.status === 'active'

    if (isTooLateInSeason) {
      return { 
        error: `We're already well into the ${currentYear} fantasy football season. It's too late to start a new league for this year, but we're looking forward to the ${nextYear} season! Check back soon to create your league.` 
      }
    }

    // Only show this error to admins/commissioners
    // Regular users should never hit this (they should be gated at the page level)
    if (isAdmin) {
      return { error: 'No active season is configured yet. Go to Season Configuration (Admin) to set the active season.' }
    }
    return { error: `There is no active season available for new leagues. ${currentYearSeason ? `The ${currentYear} season may have already started. ` : ''}We're looking forward to the ${nextYear} season! Check back soon.` }
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
      status: 'invites_open',
      scoring_settings: {},
      draft_type: 'snake',
      created_by_user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Track league creation (non-blocking - don't await)
  trackLeagueCreated(
    data.id,
    data.name,
    leagueType,
    maxTeams,
    user.id
  ).catch(err => {
    console.error('Error tracking league creation:', err)
    // Don't block the response if tracking fails
  })
  
  // Note: Funnel context is added in server-track.ts

  revalidatePath('/leagues')
  revalidatePath('/dashboard')
  if (finalPromotionGroupId) {
    revalidatePath(`/promotion-groups/${finalPromotionGroupId}`)
  }
  
  return { data }
}

/**
 * Delete a league (commissioner only)
 * This will cascade delete related records (teams, matchups, etc.) via foreign keys
 */
export async function deleteLeague(leagueId: string) {
  const supabase = await createClient()
  
  const userWithProfile = await getCurrentUserWithProfile()
  if (!userWithProfile?.user) {
    return { error: 'Not authenticated' }
  }

  const { user, profile } = userWithProfile
  const isAdmin = isGlobalAdmin(profile)

  // Verify user is the league commissioner
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, name, created_by_user_id')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    return { error: 'League not found' }
  }

  // Check if user is commissioner or global admin
  const isCommissioner = league.created_by_user_id === user.id
  
  if (!isCommissioner && !isAdmin) {
    return { error: 'Only league commissioners can delete leagues' }
  }

  // Delete the league (cascade will handle related records)
  const { error: deleteError, data: deleteResult } = await supabase
    .from('leagues')
    .delete()
    .eq('id', leagueId)
    .select()

  if (deleteError) {
    console.error('League deletion error:', deleteError)
    return { error: `Failed to delete league: ${deleteError.message}` }
  }

  // Verify the league was actually deleted
  // If RLS blocks the delete, Supabase might return success but not actually delete
  const { data: verifyLeague } = await supabase
    .from('leagues')
    .select('id')
    .eq('id', leagueId)
    .single()

  if (verifyLeague) {
    console.error('League still exists after delete attempt - RLS policy may be blocking deletion')
    return { error: 'Failed to delete league: Deletion was blocked. Please ensure you have the DELETE policy enabled for leagues.' }
  }

  // Track league deletion (non-blocking - don't await)
  trackLeagueDeleted(leagueId, user.id).catch(err => {
    console.error('Error tracking league deletion:', err)
  })

  revalidatePath('/dashboard', 'page')
  revalidatePath('/leagues', 'page')
  revalidatePath(`/leagues/${leagueId}`, 'page')
  
  return { success: true }
}

/**
 * Update league status
 */
export async function updateLeagueStatus(leagueId: string, status: 'invites_open' | 'draft' | 'active') {
  const supabase = await createClient()
  
  const userWithProfile = await getCurrentUserWithProfile()
  if (!userWithProfile?.user) {
    return { error: 'Not authenticated' }
  }

  const { user, profile } = userWithProfile
  const isAdmin = isGlobalAdmin(profile)

  // Verify user is the league commissioner
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    return { error: 'League not found' }
  }

  // Check if user is commissioner or global admin
  const isCommissioner = league.created_by_user_id === user.id
  
  if (!isCommissioner && !isAdmin) {
    return { error: 'Only league commissioners can update league status' }
  }

  // Update status
  const { error: updateError } = await supabase
    .from('leagues')
    .update({ status })
    .eq('id', leagueId)

  if (updateError) {
    return { error: `Failed to update league status: ${updateError.message}` }
  }

  revalidatePath(`/leagues/${leagueId}`)
  revalidatePath('/dashboard')
  
  return { success: true }
}

