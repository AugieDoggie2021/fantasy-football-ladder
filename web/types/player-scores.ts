import type { PlayerWeekStats } from '@/lib/scoring'

/**
 * Player score entry for a rostered player
 * 
 * This type represents a single player's fantasy score for a given week,
 * including their raw stats, computed fantasy points, and roster information.
 */
export interface PlayerScoreEntry {
  /** UUID of the player */
  player_id: string
  
  /** Full name of the player (e.g., "Patrick Mahomes") */
  player_name: string
  
  /** Player position (QB, RB, WR, TE, K, DEF) */
  player_position: string
  
  /** NFL team abbreviation (e.g., "KC") or null if not set */
  nfl_team: string | null
  
  /** UUID of the fantasy team that owns this player */
  team_id: string
  
  /** Name of the fantasy team */
  team_name: string
  
  /** Whether this player is in the starting lineup */
  is_starter: boolean
  
  /** Slot type (QB, RB, WR, TE, FLEX, K, DEF, BENCH) */
  slot_type: string
  
  /** Raw statistics for the week */
  stats: PlayerWeekStats
  
  /** Computed fantasy points based on scoring rules */
  fantasy_points: number
}

/**
 * Response type for player scores API
 */
export type PlayerScoresResponse = PlayerScoreEntry[]


