'use server'

import { createClient } from '@/lib/supabase/server'
import { AnalyticsEvents, type BaseEventProperties } from './events'

/**
 * Server-side event tracking
 * Logs events to Supabase analytics_events table
 */
export async function trackServerEvent(
  event: string,
  properties?: BaseEventProperties
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Insert event into analytics_events table
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: event,
        user_id: user?.id || null,
        properties: properties || {},
        league_id: properties?.league_id || null,
        team_id: properties?.team_id || null,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error tracking server event:', error)
    }
  } catch (error) {
    console.error('Error in trackServerEvent:', error)
  }
}

/**
 * Convenience functions for common events
 */
export async function trackLeagueCreated(leagueId: string, leagueName: string, leagueType: string, teamCount: number, userId?: string) {
  await trackServerEvent(AnalyticsEvents.LEAGUE_CREATED, {
    league_id: leagueId,
    league_name: leagueName,
    league_type: leagueType,
    team_count: teamCount,
    user_id: userId,
  })
}

export async function trackLeagueDeleted(leagueId: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.LEAGUE_DELETED, {
    league_id: leagueId,
    user_id: userId,
  })
}

export async function trackInviteSent(leagueId: string, inviteEmail: string, inviteMethod: 'email' | 'link', userId?: string) {
  await trackServerEvent(AnalyticsEvents.INVITE_SENT, {
    league_id: leagueId,
    invite_email: inviteEmail,
    invite_method: inviteMethod,
    user_id: userId,
  })
}

export async function trackInviteAccepted(leagueId: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.INVITE_ACCEPTED, {
    league_id: leagueId,
    user_id: userId,
  })
}

export async function trackDraftPickMade(leagueId: string, round: number, overallPick: number, playerId: string, playerName: string, playerPosition: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.DRAFT_PICK_MADE, {
    league_id: leagueId,
    round,
    overall_pick: overallPick,
    player_id: playerId,
    player_name: playerName,
    player_position: playerPosition,
    user_id: userId,
  })
}

export async function trackDraftStarted(leagueId: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.DRAFT_STARTED, {
    league_id: leagueId,
    user_id: userId,
  })
}

export async function trackDraftCompleted(leagueId: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.DRAFT_COMPLETED, {
    league_id: leagueId,
    user_id: userId,
  })
}

export async function trackDraftPaused(leagueId: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.DRAFT_PAUSED, {
    league_id: leagueId,
    user_id: userId,
  })
}

export async function trackDraftResumed(leagueId: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.DRAFT_RESUMED, {
    league_id: leagueId,
    user_id: userId,
  })
}

export async function trackDraftTimerExtended(leagueId: string, extensionSeconds: number, timeRemainingBefore?: number, userId?: string) {
  await trackServerEvent(AnalyticsEvents.DRAFT_TIMER_EXTENDED, {
    league_id: leagueId,
    extension_seconds: extensionSeconds,
    time_remaining_before: timeRemainingBefore,
    user_id: userId,
  })
}

export async function trackDraftQueueAdded(leagueId: string, teamId: string, playerId: string, queueLength: number, userId?: string) {
  await trackServerEvent(AnalyticsEvents.DRAFT_QUEUE_ADDED, {
    league_id: leagueId,
    team_id: teamId,
    player_id: playerId,
    queue_length: queueLength,
    user_id: userId,
  })
}

export async function trackDraftQueueRemoved(leagueId: string, teamId: string, playerId: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.DRAFT_QUEUE_REMOVED, {
    league_id: leagueId,
    team_id: teamId,
    player_id: playerId,
    user_id: userId,
  })
}

export async function trackDraftQueueReordered(leagueId: string, teamId: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.DRAFT_QUEUE_REORDERED, {
    league_id: leagueId,
    team_id: teamId,
    user_id: userId,
  })
}

export async function trackDraftAutoPickTriggered(leagueId: string, pickId: string, playerId: string, reason: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.DRAFT_AUTO_PICK_TRIGGERED, {
    league_id: leagueId,
    pick_id: pickId,
    player_id: playerId,
    reason,
    user_id: userId,
  })
}

export async function trackDraftPickFailed(leagueId: string, errorType: string, errorMessage: string, pickId?: string, playerId?: string, retryCount?: number, userId?: string) {
  await trackServerEvent(AnalyticsEvents.DRAFT_PICK_FAILED, {
    league_id: leagueId,
    error_type: errorType,
    error_message: errorMessage,
    pick_id: pickId,
    player_id: playerId,
    retry_count: retryCount,
    user_id: userId,
  })
}

export async function trackLineupChanged(leagueId: string, teamId: string, changesCount: number, positionsChanged: string[], userId?: string) {
  await trackServerEvent(AnalyticsEvents.LINEUP_CHANGED, {
    league_id: leagueId,
    team_id: teamId,
    changes_count: changesCount,
    positions_changed: positionsChanged,
    user_id: userId,
  })
}

export async function trackPlayerAdded(leagueId: string, teamId: string, playerId: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.PLAYER_ADDED, {
    league_id: leagueId,
    team_id: teamId,
    player_id: playerId,
    user_id: userId,
  })
}

export async function trackError(errorMessage: string, errorType: string, errorStack?: string, pagePath?: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.ERROR_OCCURRED, {
    error_message: errorMessage,
    error_type: errorType,
    error_stack: errorStack,
    page_path: pagePath,
    user_id: userId,
  })
}

