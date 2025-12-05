/**
 * Role and Permission Helpers
 * 
 * Provides functions to check user roles and permissions:
 * - Global Admin: users.is_admin = true
 * - League Commissioner: leagues.created_by_user_id = user.id
 * - Ladder Commissioner: promotion_groups.created_by_user_id = user.id
 */

import { createClient } from '@/lib/supabase/server'

export interface UserProfile {
  id: string
  display_name: string | null
  is_admin: boolean
}

export interface League {
  id: string
  created_by_user_id: string
  [key: string]: any
}

export interface PromotionGroup {
  id: string
  created_by_user_id: string
  [key: string]: any
}

/**
 * Get current user with their profile (including is_admin flag)
 */
export async function getCurrentUserWithProfile(): Promise<{
  user: { id: string; email?: string } | null
  profile: UserProfile | null
} | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch user profile from public.users table
  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, is_admin')
    .eq('id', user.id)
    .single()

  return {
    user,
    profile: profile || null,
  }
}

/**
 * Check if a user profile is a global admin
 */
export function isGlobalAdmin(profile: UserProfile | null): boolean {
  return profile?.is_admin === true
}

/**
 * Check if a user is the commissioner of a league
 */
export function isLeagueCommissioner(userId: string, league: League | null): boolean {
  if (!league) return false
  return league.created_by_user_id === userId
}

/**
 * Check if a user is the commissioner of a ladder (promotion group)
 */
export function isLadderCommissioner(userId: string, ladder: PromotionGroup | null): boolean {
  if (!ladder) return false
  return ladder.created_by_user_id === userId
}

/**
 * Check if user can create a league
 * - Global admins can always create leagues
 * - Ladder commissioners can create leagues in their ladders
 * - Any logged-in user can create a standalone league (they become commissioner)
 */
export function canCreateLeague(
  userId: string | null,
  profile: UserProfile | null,
  ladderId?: string | null
): boolean {
  if (!userId) return false
  
  // Global admins can always create leagues
  if (isGlobalAdmin(profile)) return true
  
  // If creating in a ladder, user must be ladder commissioner
  // (This check should be done separately by fetching the ladder)
  // For now, any logged-in user can create a standalone league
  return true
}

/**
 * Check if user can access commissioner tools for a league
 */
export function canAccessCommissionerTools(
  userId: string | null,
  profile: UserProfile | null,
  league: League | null
): boolean {
  if (!userId || !league) return false
  
  // Global admins can access commissioner tools
  if (isGlobalAdmin(profile)) return true
  
  // League commissioners can access commissioner tools
  return isLeagueCommissioner(userId, league)
}

