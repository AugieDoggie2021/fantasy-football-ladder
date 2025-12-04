import { describe, it, expect } from 'vitest'
import { calculatePlayerScore, calculatePlayerScoreWithConfig, type PlayerWeekStats } from '../scoring'
import { DEFAULT_SCORING_CONFIG, parseScoringConfig, validateScoringConfig, type ScoringConfig } from '../scoring-config'

describe('Scoring Helper', () => {
  describe('calculatePlayerScore', () => {
    it('calculates QB score correctly', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 300,
        passing_tds: 3,
        interceptions: 1,
        rushing_yards: 20,
        rushing_tds: 0,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        kicking_points: 0,
        defense_points: 0,
      }

      // Math.floor(300 / 25) = 12 pts, 3 * 4 = 12 pts, 1 * -2 = -2 pts, Math.floor(20 / 10) = 2 pts
      // Total: 12 + 12 - 2 + 2 = 24
      const score = calculatePlayerScore(stats, 'QB')
      expect(score).toBe(24)
    })

    it('calculates RB score correctly with PPR', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 0,
        passing_tds: 0,
        interceptions: 0,
        rushing_yards: 100,
        rushing_tds: 1,
        receiving_yards: 50,
        receiving_tds: 1,
        receptions: 5,
        kicking_points: 0,
        defense_points: 0,
      }

      // Rushing: Math.floor(100 / 10) = 10 pts, 1 * 6 = 6 pts
      // Receiving: Math.floor(50 / 10) = 5 pts, 1 * 6 = 6 pts, 5 * 1 = 5 pts (PPR)
      // Total: 10 + 6 + 5 + 6 + 5 = 32
      const score = calculatePlayerScore(stats, 'RB')
      expect(score).toBe(32)
    })

    it('calculates WR score correctly with PPR', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 0,
        passing_tds: 0,
        interceptions: 0,
        rushing_yards: 0,
        rushing_tds: 0,
        receiving_yards: 120,
        receiving_tds: 2,
        receptions: 8,
        kicking_points: 0,
        defense_points: 0,
      }

      // Receiving: Math.floor(120 / 10) = 12 pts, 2 * 6 = 12 pts, 8 * 1 = 8 pts (PPR)
      // Total: 12 + 12 + 8 = 32
      const score = calculatePlayerScore(stats, 'WR')
      expect(score).toBe(32)
    })

    it('calculates TE score correctly with PPR', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 0,
        passing_tds: 0,
        interceptions: 0,
        rushing_yards: 0,
        rushing_tds: 0,
        receiving_yards: 80,
        receiving_tds: 1,
        receptions: 6,
        kicking_points: 0,
        defense_points: 0,
      }

      // Receiving: Math.floor(80 / 10) = 8 pts, 1 * 6 = 6 pts, 6 * 1 = 6 pts (PPR)
      // Total: 8 + 6 + 6 = 20
      const score = calculatePlayerScore(stats, 'TE')
      expect(score).toBe(20)
    })

    it('calculates K score correctly', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 0,
        passing_tds: 0,
        interceptions: 0,
        rushing_yards: 0,
        rushing_tds: 0,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        kicking_points: 12,
        defense_points: 0,
      }

      const score = calculatePlayerScore(stats, 'K')
      expect(score).toBe(12)
    })

    it('calculates DEF score correctly', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 0,
        passing_tds: 0,
        interceptions: 0,
        rushing_yards: 0,
        rushing_tds: 0,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        kicking_points: 0,
        defense_points: 15,
      }

      const score = calculatePlayerScore(stats, 'DEF')
      expect(score).toBe(15)
    })

    it('handles zero stats', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 0,
        passing_tds: 0,
        interceptions: 0,
        rushing_yards: 0,
        rushing_tds: 0,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        kicking_points: 0,
        defense_points: 0,
      }

      const score = calculatePlayerScore(stats, 'RB')
      expect(score).toBe(0)
    })

    it('rounds to 2 decimal places', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 255, // Math.floor(255 / 25) = 10
        passing_tds: 0,
        interceptions: 0,
        rushing_yards: 0,
        rushing_tds: 0,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        kicking_points: 0,
        defense_points: 0,
      }

      const score = calculatePlayerScore(stats, 'QB')
      expect(score).toBe(10)
    })
  })

  describe('calculatePlayerScoreWithConfig - Bonus Points', () => {
    it('applies rushing yardage bonus when threshold is met', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 0,
        passing_tds: 0,
        interceptions: 0,
        rushing_yards: 100, // Meets threshold
        rushing_tds: 1,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        kicking_points: 0,
        defense_points: 0,
      }

      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        rushingYardageBonus: {
          enabled: true,
          threshold: 100,
          bonusPoints: 3,
        },
      }

      // Base: Math.floor(100 / 10) = 10, 1 * 6 = 6, Total: 16
      // Bonus: +3
      // Expected: 19
      const score = calculatePlayerScoreWithConfig(stats, 'RB', config)
      expect(score).toBe(19)
    })

    it('does not apply rushing yardage bonus when threshold is not met', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 0,
        passing_tds: 0,
        interceptions: 0,
        rushing_yards: 99, // Below threshold
        rushing_tds: 1,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        kicking_points: 0,
        defense_points: 0,
      }

      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        rushingYardageBonus: {
          enabled: true,
          threshold: 100,
          bonusPoints: 3,
        },
      }

      // Base: Math.floor(99 / 10) = 9, 1 * 6 = 6, Total: 15
      // No bonus
      const score = calculatePlayerScoreWithConfig(stats, 'RB', config)
      expect(score).toBe(15)
    })

    it('applies receiving yardage bonus when threshold is met', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 0,
        passing_tds: 0,
        interceptions: 0,
        rushing_yards: 0,
        rushing_tds: 0,
        receiving_yards: 100, // Meets threshold
        receiving_tds: 1,
        receptions: 5,
        kicking_points: 0,
        defense_points: 0,
      }

      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        receivingYardageBonus: {
          enabled: true,
          threshold: 100,
          bonusPoints: 3,
        },
      }

      // Base: Math.floor(100 / 10) = 10, 1 * 6 = 6, 5 * 1 = 5, Total: 21
      // Bonus: +3
      // Expected: 24
      const score = calculatePlayerScoreWithConfig(stats, 'WR', config)
      expect(score).toBe(24)
    })

    it('applies passing yardage bonus when threshold is met', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 300, // Meets threshold
        passing_tds: 2,
        interceptions: 0,
        rushing_yards: 0,
        rushing_tds: 0,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        kicking_points: 0,
        defense_points: 0,
      }

      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        passingYardageBonus: {
          enabled: true,
          threshold: 300,
          bonusPoints: 3,
        },
      }

      // Base: Math.floor(300 / 25) = 12, 2 * 4 = 8, Total: 20
      // Bonus: +3
      // Expected: 23
      const score = calculatePlayerScoreWithConfig(stats, 'QB', config)
      expect(score).toBe(23)
    })

    it('does not apply bonus when disabled', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 0,
        passing_tds: 0,
        interceptions: 0,
        rushing_yards: 150, // Would meet threshold if enabled
        rushing_tds: 1,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        kicking_points: 0,
        defense_points: 0,
      }

      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        rushingYardageBonus: {
          enabled: false, // Disabled
          threshold: 100,
          bonusPoints: 3,
        },
      }

      // Base: Math.floor(150 / 10) = 15, 1 * 6 = 6, Total: 21
      // No bonus (disabled)
      const score = calculatePlayerScoreWithConfig(stats, 'RB', config)
      expect(score).toBe(21)
    })

    it('applies multiple bonuses when multiple thresholds are met', () => {
      const stats: PlayerWeekStats = {
        passing_yards: 0,
        passing_tds: 0,
        interceptions: 0,
        rushing_yards: 120, // Meets rushing threshold
        rushing_tds: 1,
        receiving_yards: 100, // Meets receiving threshold
        receiving_tds: 1,
        receptions: 8,
        kicking_points: 0,
        defense_points: 0,
      }

      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        rushingYardageBonus: {
          enabled: true,
          threshold: 100,
          bonusPoints: 3,
        },
        receivingYardageBonus: {
          enabled: true,
          threshold: 100,
          bonusPoints: 3,
        },
      }

      // Base: Math.floor(120 / 10) = 12, 1 * 6 = 6, Math.floor(100 / 10) = 10, 1 * 6 = 6, 8 * 1 = 8
      // Base Total: 12 + 6 + 10 + 6 + 8 = 42
      // Bonuses: +3 (rushing) + 3 (receiving) = +6
      // Expected: 48
      const score = calculatePlayerScoreWithConfig(stats, 'RB', config)
      expect(score).toBe(48)
    })
  })
})

describe('Scoring Config', () => {
  describe('parseScoringConfig', () => {
    it('returns default config for null input', () => {
      const config = parseScoringConfig(null)
      expect(config).toEqual(DEFAULT_SCORING_CONFIG)
    })

    it('returns default config for invalid input', () => {
      const config = parseScoringConfig('invalid')
      expect(config).toEqual(DEFAULT_SCORING_CONFIG)
    })

    it('parses valid config with custom values', () => {
      const input = {
        passingYardsPerPoint: 30,
        passingTdPoints: 5,
        receptionPoints: 0.5,
      }
      const config = parseScoringConfig(input)
      expect(config.passingYardsPerPoint).toBe(30)
      expect(config.passingTdPoints).toBe(5)
      expect(config.receptionPoints).toBe(0.5)
      expect(config.rushingYardsPerPoint).toBe(DEFAULT_SCORING_CONFIG.rushingYardsPerPoint)
    })

    it('parses bonus configs when present', () => {
      const input = {
        rushingYardageBonus: {
          enabled: true,
          threshold: 150,
          bonusPoints: 5,
        },
      }
      const config = parseScoringConfig(input)
      expect(config.rushingYardageBonus?.enabled).toBe(true)
      expect(config.rushingYardageBonus?.threshold).toBe(150)
      expect(config.rushingYardageBonus?.bonusPoints).toBe(5)
    })

    it('uses default bonus configs when not present', () => {
      const input = {}
      const config = parseScoringConfig(input)
      expect(config.rushingYardageBonus).toEqual(DEFAULT_SCORING_CONFIG.rushingYardageBonus)
      expect(config.receivingYardageBonus).toEqual(DEFAULT_SCORING_CONFIG.receivingYardageBonus)
      expect(config.passingYardageBonus).toEqual(DEFAULT_SCORING_CONFIG.passingYardageBonus)
    })
  })

  describe('validateScoringConfig', () => {
    it('returns no errors for valid default config', () => {
      const errors = validateScoringConfig(DEFAULT_SCORING_CONFIG)
      expect(errors).toEqual([])
    })

    it('returns error for zero passing yards per point', () => {
      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        passingYardsPerPoint: 0,
      }
      const errors = validateScoringConfig(config)
      expect(errors).toContain('Passing yards per point must be greater than 0')
    })

    it('returns error for negative passing TD points', () => {
      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        passingTdPoints: -1,
      }
      const errors = validateScoringConfig(config)
      expect(errors).toContain('Passing TD points cannot be negative')
    })

    it('returns error for negative reception points', () => {
      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        receptionPoints: -1,
      }
      const errors = validateScoringConfig(config)
      expect(errors).toContain('Reception points cannot be negative')
    })

    it('returns error for enabled bonus with zero threshold', () => {
      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        rushingYardageBonus: {
          enabled: true,
          threshold: 0,
          bonusPoints: 3,
        },
      }
      const errors = validateScoringConfig(config)
      expect(errors).toContain('Rushing yardage bonus threshold must be greater than 0')
    })

    it('returns error for enabled bonus with negative bonus points', () => {
      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        receivingYardageBonus: {
          enabled: true,
          threshold: 100,
          bonusPoints: -1,
        },
      }
      const errors = validateScoringConfig(config)
      expect(errors).toContain('Receiving yardage bonus points cannot be negative')
    })

    it('does not validate disabled bonuses', () => {
      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        rushingYardageBonus: {
          enabled: false,
          threshold: 0, // Invalid but disabled, so should not error
          bonusPoints: -1, // Invalid but disabled, so should not error
        },
      }
      const errors = validateScoringConfig(config)
      expect(errors).toEqual([])
    })

    it('returns multiple errors for multiple invalid fields', () => {
      const config: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        passingYardsPerPoint: 0,
        rushingTdPoints: -1,
        receptionPoints: -2,
      }
      const errors = validateScoringConfig(config)
      expect(errors.length).toBeGreaterThan(1)
      expect(errors).toContain('Passing yards per point must be greater than 0')
      expect(errors).toContain('Rushing TD points cannot be negative')
      expect(errors).toContain('Reception points cannot be negative')
    })
  })
})

