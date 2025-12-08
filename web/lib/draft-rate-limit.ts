/**
 * Draft rate limiting utilities
 * Prevents abuse by limiting the frequency of draft actions
 */

import { createClient } from '@/lib/supabase/server'

interface RateLimitResult {
  allowed: boolean
  retryAfter?: number // seconds until next attempt is allowed
  error?: string
}

/**
 * Check rate limit for draft pick actions
 * Limits: 1 pick per 2 seconds per user per league
 */
export async function checkDraftPickRateLimit(
  userId: string,
  leagueId: string
): Promise<RateLimitResult> {
  const supabase = await createClient()
  
  // Check recent picks by this user in this league
  const twoSecondsAgo = new Date(Date.now() - 2000).toISOString()
  
  const { data: recentPicks, error } = await supabase
    .from('draft_audit_log')
    .select('created_at')
    .eq('user_id', userId)
    .eq('league_id', leagueId)
    .eq('action_type', 'pick_made')
    .gte('created_at', twoSecondsAgo)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    // If audit log query fails, allow the action but log the error
    console.error('Rate limit check failed:', error)
    return { allowed: true }
  }

  if (recentPicks && recentPicks.length > 0) {
    const lastPickTime = new Date(recentPicks[0].created_at).getTime()
    const timeSinceLastPick = Date.now() - lastPickTime
    const retryAfter = Math.ceil((2000 - timeSinceLastPick) / 1000)
    
    return {
      allowed: false,
      retryAfter,
      error: `Please wait ${retryAfter} second${retryAfter !== 1 ? 's' : ''} before making another pick.`
    }
  }

  return { allowed: true }
}

/**
 * Check rate limit for queue operations
 * Limits: 10 operations per minute per user per league
 */
export async function checkQueueOperationRateLimit(
  userId: string,
  leagueId: string
): Promise<RateLimitResult> {
  const supabase = await createClient()
  
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
  
  const { data: recentOps, error } = await supabase
    .from('draft_audit_log')
    .select('created_at')
    .eq('user_id', userId)
    .eq('league_id', leagueId)
    .in('action_type', ['queue_added', 'queue_removed', 'queue_reordered'])
    .gte('created_at', oneMinuteAgo)

  if (error) {
    console.error('Queue rate limit check failed:', error)
    return { allowed: true }
  }

  if (recentOps && recentOps.length >= 10) {
    const oldestOpTime = new Date(recentOps[recentOps.length - 1].created_at).getTime()
    const timeSinceOldest = Date.now() - oldestOpTime
    const retryAfter = Math.ceil((60000 - timeSinceOldest) / 1000)
    
    return {
      allowed: false,
      retryAfter,
      error: `Too many queue operations. Please wait ${retryAfter} second${retryAfter !== 1 ? 's' : ''}.`
    }
  }

  return { allowed: true }
}

/**
 * Check rate limit for draft control actions (start, pause, resume, complete)
 * Limits: 1 action per 5 seconds per user per league
 */
export async function checkDraftControlRateLimit(
  userId: string,
  leagueId: string
): Promise<RateLimitResult> {
  const supabase = await createClient()
  
  const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
  
  const { data: recentActions, error } = await supabase
    .from('draft_audit_log')
    .select('created_at')
    .eq('user_id', userId)
    .eq('league_id', leagueId)
    .in('action_type', ['draft_started', 'draft_paused', 'draft_resumed', 'draft_completed'])
    .gte('created_at', fiveSecondsAgo)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Draft control rate limit check failed:', error)
    return { allowed: true }
  }

  if (recentActions && recentActions.length > 0) {
    const lastActionTime = new Date(recentActions[0].created_at).getTime()
    const timeSinceLastAction = Date.now() - lastActionTime
    const retryAfter = Math.ceil((5000 - timeSinceLastAction) / 1000)
    
    return {
      allowed: false,
      retryAfter,
      error: `Please wait ${retryAfter} second${retryAfter !== 1 ? 's' : ''} before performing another draft control action.`
    }
  }

  return { allowed: true }
}

