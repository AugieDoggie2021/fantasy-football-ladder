/**
 * Analytics Event Types
 * 
 * Centralized definitions for all analytics events tracked in the application
 */

export const AnalyticsEvents = {
  // User lifecycle
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',

  // League lifecycle
  LEAGUE_CREATED: 'league_created',
  LEAGUE_DELETED: 'league_deleted',
  LEAGUE_JOINED: 'league_joined',
  LEAGUE_LEFT: 'league_left',

  // Invites
  INVITE_SENT: 'invite_sent',
  INVITE_ACCEPTED: 'invite_accepted',
  INVITE_DECLINED: 'invite_declined',

  // Teams
  TEAM_CREATED: 'team_created',
  TEAM_UPDATED: 'team_updated',

  // Draft
  DRAFT_STARTED: 'draft_started',
  DRAFT_PICK_MADE: 'draft_pick_made',
  DRAFT_COMPLETED: 'draft_completed',

  // Roster & Lineup
  LINEUP_CHANGED: 'lineup_changed',
  PLAYER_ADDED: 'player_added',
  PLAYER_DROPPED: 'player_dropped',
  PLAYER_TRADED: 'player_traded',

  // Waiver wire
  WAIVER_CLAIM_SUBMITTED: 'waiver_claim_submitted',
  WAIVER_CLAIM_PROCESSED: 'waiver_claim_processed',

  // Views
  PAGE_VIEWED: 'page_viewed',
  MATCHUP_VIEWED: 'matchup_viewed',
  STANDINGS_VIEWED: 'standings_viewed',
  PLAYERS_VIEWED: 'players_viewed',
  PLAYER_SEARCHED: 'player_searched',

  // League operations
  LEAGUE_WEEK_COMPLETED: 'league_week_completed',
  SCORING_APPLIED: 'scoring_applied',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
} as const

export type AnalyticsEventType = typeof AnalyticsEvents[keyof typeof AnalyticsEvents]

export interface BaseEventProperties {
  user_id?: string
  league_id?: string
  team_id?: string
  timestamp?: string
  [key: string]: unknown
}

export interface LeagueCreatedProperties extends BaseEventProperties {
  league_name: string
  league_type: string
  team_count: number
}

export interface InviteSentProperties extends BaseEventProperties {
  invite_email: string
  invite_method: 'email' | 'link'
}

export interface DraftPickMadeProperties extends BaseEventProperties {
  round: number
  overall_pick: number
  player_id: string
  player_name: string
  player_position: string
}

export interface LineupChangedProperties extends BaseEventProperties {
  changes_count: number
  positions_changed: string[]
}

export interface PageViewedProperties extends BaseEventProperties {
  page_path: string
  page_title?: string
  referrer?: string
}

export interface ErrorOccurredProperties extends BaseEventProperties {
  error_message: string
  error_type: string
  error_stack?: string
  page_path?: string
}

