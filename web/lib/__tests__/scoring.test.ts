import { describe, it, expect } from 'vitest'
import { calculatePlayerScore, type PlayerWeekStats } from '../scoring'

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
})

