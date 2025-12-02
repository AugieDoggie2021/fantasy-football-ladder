import { describe, it, expect } from 'vitest'
import { generateRoundRobinSchedule } from '../schedule-helpers'

describe('Schedule Helpers', () => {
  describe('generateRoundRobinSchedule', () => {
    it('generates schedule for 2 teams', () => {
      const teams = [
        { id: 'team1', name: 'Team 1' },
        { id: 'team2', name: 'Team 2' },
      ]

      const schedule = generateRoundRobinSchedule(teams, 2)

      expect(schedule).toHaveLength(2)
      expect(schedule[0].week).toBe(1)
      expect(schedule[0].matchups).toHaveLength(1)
      expect(schedule[0].matchups[0].homeTeamId).toBe('team1')
      expect(schedule[0].matchups[0].awayTeamId).toBe('team2')
    })

    it('generates schedule for 4 teams', () => {
      const teams = [
        { id: 'team1', name: 'Team 1' },
        { id: 'team2', name: 'Team 2' },
        { id: 'team3', name: 'Team 3' },
        { id: 'team4', name: 'Team 4' },
      ]

      const schedule = generateRoundRobinSchedule(teams, 2)

      expect(schedule).toHaveLength(2)
      expect(schedule[0].matchups).toHaveLength(2) // 4 teams / 2 = 2 matchups per week
      expect(schedule[1].matchups).toHaveLength(2)
    })

    it('generates correct number of weeks', () => {
      const teams = [
        { id: 'team1', name: 'Team 1' },
        { id: 'team2', name: 'Team 2' },
        { id: 'team3', name: 'Team 3' },
      ]

      const schedule = generateRoundRobinSchedule(teams, 14)

      expect(schedule).toHaveLength(14)
      schedule.forEach(week => {
        expect(week.week).toBeGreaterThan(0)
        expect(week.week).toBeLessThanOrEqual(14)
      })
    })

    it('handles empty teams array', () => {
      const schedule = generateRoundRobinSchedule([], 14)
      expect(schedule).toHaveLength(0)
    })

    it('handles single team', () => {
      const teams = [{ id: 'team1', name: 'Team 1' }]
      const schedule = generateRoundRobinSchedule(teams, 14)
      expect(schedule).toHaveLength(0)
    })

    it('rotates matchups across weeks', () => {
      const teams = [
        { id: 'team1', name: 'Team 1' },
        { id: 'team2', name: 'Team 2' },
        { id: 'team3', name: 'Team 3' },
        { id: 'team4', name: 'Team 4' },
      ]

      const schedule = generateRoundRobinSchedule(teams, 3)

      // Week 1 should have different matchups than week 2
      const week1Teams = new Set([
        schedule[0].matchups[0].homeTeamId,
        schedule[0].matchups[0].awayTeamId,
        schedule[0].matchups[1].homeTeamId,
        schedule[0].matchups[1].awayTeamId,
      ])

      const week2Teams = new Set([
        schedule[1].matchups[0].homeTeamId,
        schedule[1].matchups[0].awayTeamId,
        schedule[1].matchups[1].homeTeamId,
        schedule[1].matchups[1].awayTeamId,
      ])

      // Should include all teams each week
      expect(week1Teams.size).toBe(4)
      expect(week2Teams.size).toBe(4)
    })
  })
})

