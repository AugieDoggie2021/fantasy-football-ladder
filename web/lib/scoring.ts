/**
 * Scoring Helper Functions
 * 
 * MVP: Standard Yahoo-style scoring preset
 * 
 * Scoring Rules:
 * - Passing: 1 pt per 25 yards, 4 pts per TD, -2 per INT
 * - Rushing: 1 pt per 10 yards, 6 pts per TD
 * - Receiving: 1 pt per 10 yards, 6 pts per TD, 1 pt per reception (PPR)
 * - Kicking: Use kicking_points as aggregated points
 * - Defense: Use defense_points as aggregated points
 */

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
 */
export function calculatePlayerScore(stats: PlayerWeekStats, position: string): number {
  let score = 0

  // Passing stats (QB)
  if (stats.passing_yards !== undefined) {
    score += Math.floor(stats.passing_yards / 25) // 1 pt per 25 yards
  }
  if (stats.passing_tds !== undefined) {
    score += stats.passing_tds * 4 // 4 pts per passing TD
  }
  if (stats.interceptions !== undefined) {
    score += stats.interceptions * -2 // -2 pts per interception
  }

  // Rushing stats (RB, WR, TE, QB)
  if (stats.rushing_yards !== undefined) {
    score += Math.floor(stats.rushing_yards / 10) // 1 pt per 10 yards
  }
  if (stats.rushing_tds !== undefined) {
    score += stats.rushing_tds * 6 // 6 pts per rushing TD
  }

  // Receiving stats (WR, TE, RB)
  if (stats.receiving_yards !== undefined) {
    score += Math.floor(stats.receiving_yards / 10) // 1 pt per 10 yards
  }
  if (stats.receiving_tds !== undefined) {
    score += stats.receiving_tds * 6 // 6 pts per receiving TD
  }
  if (stats.receptions !== undefined) {
    score += stats.receptions * 1 // 1 pt per reception (PPR)
  }

  // Kicking (K)
  if (stats.kicking_points !== undefined) {
    score += stats.kicking_points // Use aggregated points
  }

  // Defense (DEF)
  if (stats.defense_points !== undefined) {
    score += stats.defense_points // Use aggregated points
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

