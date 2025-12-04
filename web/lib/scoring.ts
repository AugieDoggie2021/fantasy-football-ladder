/**
 * Scoring Helper Functions
 * 
 * MVP: Standard Yahoo-style scoring preset
 * 
 * Scoring Rules (default):
 * - Passing: 1 pt per 25 yards, 4 pts per TD, -2 per INT
 * - Rushing: 1 pt per 10 yards, 6 pts per TD
 * - Receiving: 1 pt per 10 yards, 6 pts per TD, 1 pt per reception (PPR)
 * - Kicking: Use kicking_points as aggregated points
 * - Defense: Use defense_points as aggregated points
 */

import type { ScoringConfig } from './scoring-config'
import { DEFAULT_SCORING_CONFIG } from './scoring-config'

export interface PlayerWeekStats {
  passing_yards: number
  passing_tds: number
  interceptions: number
  rushing_yards: number
  rushing_tds: number
  receiving_yards: number
  receiving_tds: number
  receptions: number
  kicking_points: number
  defense_points: number
}

/**
 * Calculate fantasy score for a player based on their week stats
 * Uses default scoring configuration
 * 
 * @deprecated Use calculatePlayerScoreWithConfig for custom scoring
 */
export function calculatePlayerScore(stats: PlayerWeekStats, position: string): number {
  return calculatePlayerScoreWithConfig(stats, position, DEFAULT_SCORING_CONFIG)
}

/**
 * Calculate fantasy score for a player based on their week stats and scoring config
 */
export function calculatePlayerScoreWithConfig(
  stats: PlayerWeekStats,
  position: string,
  config: ScoringConfig
): number {
  let score = 0

  // Passing stats (QB)
  if (stats.passing_yards !== undefined) {
    score += Math.floor(stats.passing_yards / config.passingYardsPerPoint)
  }
  if (stats.passing_tds !== undefined) {
    score += stats.passing_tds * config.passingTdPoints
  }
  if (stats.interceptions !== undefined) {
    score += stats.interceptions * config.interceptionPoints
  }

  // Rushing stats (RB, WR, TE, QB)
  if (stats.rushing_yards !== undefined) {
    score += Math.floor(stats.rushing_yards / config.rushingYardsPerPoint)
  }
  if (stats.rushing_tds !== undefined) {
    score += stats.rushing_tds * config.rushingTdPoints
  }

  // Receiving stats (WR, TE, RB)
  if (stats.receiving_yards !== undefined) {
    score += Math.floor(stats.receiving_yards / config.receivingYardsPerPoint)
  }
  if (stats.receiving_tds !== undefined) {
    score += stats.receiving_tds * config.receivingTdPoints
  }
  if (stats.receptions !== undefined) {
    score += stats.receptions * config.receptionPoints
  }

  // Kicking (K) - use aggregated points as-is
  if (stats.kicking_points !== undefined) {
    score += stats.kicking_points
  }

  // Defense (DEF) - use aggregated points as-is
  if (stats.defense_points !== undefined) {
    score += stats.defense_points
  }

  // Apply yardage bonuses
  // Rushing yardage bonus
  if (config.rushingYardageBonus?.enabled && stats.rushing_yards !== undefined) {
    if (stats.rushing_yards >= config.rushingYardageBonus.threshold) {
      score += config.rushingYardageBonus.bonusPoints
    }
  }

  // Receiving yardage bonus
  if (config.receivingYardageBonus?.enabled && stats.receiving_yards !== undefined) {
    if (stats.receiving_yards >= config.receivingYardageBonus.threshold) {
      score += config.receivingYardageBonus.bonusPoints
    }
  }

  // Passing yardage bonus
  if (config.passingYardageBonus?.enabled && stats.passing_yards !== undefined) {
    if (stats.passing_yards >= config.passingYardageBonus.threshold) {
      score += config.passingYardageBonus.bonusPoints
    }
  }

  return Math.round(score * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate team score for a given week
 * Sums up fantasy scores for all starting roster players
 */
export function calculateTeamScore(
  rosterPlayers: Array<{ player_id: string; position: string; is_starter: boolean }>,
  playerStats: Map<string, PlayerWeekStats>
): number {
  let totalScore = 0

  rosterPlayers
    .filter(rp => rp.is_starter) // Only count starters
    .forEach(rp => {
      const stats = playerStats.get(rp.player_id)
      if (stats) {
        totalScore += calculatePlayerScore(stats, rp.position)
      }
    })

  return Math.round(totalScore * 100) / 100 // Round to 2 decimal places
}

