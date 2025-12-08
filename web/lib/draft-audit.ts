/**
 * Draft audit logging utilities
 * Logs all draft actions for security, debugging, and compliance
 */

import { createClient } from '@/lib/supabase/server'

export type DraftAuditActionType =
  | 'pick_made'
  | 'pick_attempted'
  | 'pick_failed'
  | 'draft_started'
  | 'draft_paused'
  | 'draft_resumed'
  | 'draft_completed'
  | 'timer_extended'
  | 'queue_added'
  | 'queue_removed'
  | 'queue_reordered'
  | 'auto_pick_triggered'

interface AuditLogMetadata {
  error?: string
  retryCount?: number
  validationErrors?: string[]
  ipAddress?: string
  userAgent?: string
  [key: string]: any
}

/**
 * Log a draft action to the audit log
 */
export async function logDraftAction(
  actionType: DraftAuditActionType,
  leagueId: string,
  userId: string,
  options?: {
    draftPickId?: string
    playerId?: string
    teamId?: string
    metadata?: AuditLogMetadata
  }
): Promise<void> {
  const supabase = await createClient()
  
  try {
    await supabase
      .from('draft_audit_log')
      .insert({
        league_id: leagueId,
        user_id: userId,
        action_type: actionType,
        draft_pick_id: options?.draftPickId || null,
        player_id: options?.playerId || null,
        team_id: options?.teamId || null,
        metadata: options?.metadata || null,
        ip_address: options?.metadata?.ipAddress || null,
        user_agent: options?.metadata?.userAgent || null,
      })
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('Failed to log draft action:', error)
  }
}

/**
 * Get request metadata from headers (for audit logging)
 */
export function getRequestMetadata(headers?: Headers): {
  ipAddress?: string
  userAgent?: string
} {
  if (!headers) return {}
  
  return {
    ipAddress: headers.get('x-forwarded-for')?.split(',')[0] || 
               headers.get('x-real-ip') || 
               undefined,
    userAgent: headers.get('user-agent') || undefined,
  }
}

