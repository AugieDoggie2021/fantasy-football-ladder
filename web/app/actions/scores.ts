'use server'

import { getLeagueWeekPlayerScores, type LeagueWeekPlayerScore } from '@/lib/league-scores'

/**
 * Server action to get league week player scores
 * 
 * @param args - League ID, season year, and week number
 * @returns Array of player score entries
 */
export async function getLeagueWeekPlayerScoresAction(args: {
  leagueId: string
  seasonYear: number
  week: number
}): Promise<{ data?: LeagueWeekPlayerScore[]; error?: string }> {
  return getLeagueWeekPlayerScores(args)
}

// Re-export type for convenience
export type { LeagueWeekPlayerScore } from '@/lib/league-scores'

