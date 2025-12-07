'use server'

import { trackServerEvent } from '@/lib/analytics/server-track'
import { AnalyticsEvents } from '@/lib/analytics/events'

/**
 * Log a custom analytics event from the server
 */
export async function logAnalyticsEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  await trackServerEvent(event, properties)
}

/**
 * Log league-specific events
 */
export async function logLeagueWeekCompleted(leagueId: string, week: number, userId?: string) {
  await trackServerEvent(AnalyticsEvents.LEAGUE_WEEK_COMPLETED, {
    league_id: leagueId,
    week,
    user_id: userId,
  })
}

export async function logMatchupViewed(leagueId: string, matchupId: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.MATCHUP_VIEWED, {
    league_id: leagueId,
    matchup_id: matchupId,
    user_id: userId,
  })
}

export async function logStandingsViewed(leagueId: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.STANDINGS_VIEWED, {
    league_id: leagueId,
    user_id: userId,
  })
}

export async function logPlayersViewed(leagueId: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.PLAYERS_VIEWED, {
    league_id: leagueId,
    user_id: userId,
  })
}

export async function logPlayerSearched(leagueId: string, searchQuery: string, userId?: string) {
  await trackServerEvent(AnalyticsEvents.PLAYER_SEARCHED, {
    league_id: leagueId,
    search_query: searchQuery,
    user_id: userId,
  })
}

