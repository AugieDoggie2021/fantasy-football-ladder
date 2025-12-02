import { describe, it, expect } from 'vitest'
import { calculateStandings } from '../standings-helpers'

describe('Standings Helpers', () => {
  describe('calculateStandings', () => {
    it('calculates standings from matchups correctly', () => {
      const matchups = [
        {
          home_team_id: 'team1',
          home_team_name: 'Team 1',
          home_score: 100,
          away_team_id: 'team2',
          away_team_name: 'Team 2',
          away_score: 90,
          status: 'final',
        },
        {
          home_team_id: 'team1',
          home_team_name: 'Team 1',
          home_score: 110,
          away_team_id: 'team3',
          away_team_name: 'Team 3',
          away_score: 95,
          status: 'final',
        },
        {
          home_team_id: 'team2',
          home_team_name: 'Team 2',
          home_score: 105,
          away_team_id: 'team3',
          away_team_name: 'Team 3',
          away_score: 85,
          status: 'final',
        },
      ]

      const standings = calculateStandings(matchups)

      expect(standings).toHaveLength(3)

      const team1 = standings.find(s => s.teamId === 'team1')
      expect(team1?.wins).toBe(2)
      expect(team1?.losses).toBe(0)
      expect(team1?.pointsFor).toBe(210)
      expect(team1?.pointsAgainst).toBe(185)

      const team2 = standings.find(s => s.teamId === 'team2')
      expect(team2?.wins).toBe(1)
      expect(team2?.losses).toBe(1)
      expect(team2?.pointsFor).toBe(195)
      expect(team2?.pointsAgainst).toBe(185)

      const team3 = standings.find(s => s.teamId === 'team3')
      expect(team3?.wins).toBe(0)
      expect(team3?.losses).toBe(2)
      expect(team3?.pointsFor).toBe(180)
      expect(team3?.pointsAgainst).toBe(215)
    })

    it('handles ties correctly', () => {
      const matchups = [
        {
          home_team_id: 'team1',
          home_team_name: 'Team 1',
          home_score: 100,
          away_team_id: 'team2',
          away_team_name: 'Team 2',
          away_score: 100,
          status: 'final',
        },
      ]

      const standings = calculateStandings(matchups)

      expect(standings[0].ties).toBe(1)
      expect(standings[1].ties).toBe(1)
      expect(standings[0].wins).toBe(0)
      expect(standings[0].losses).toBe(0)
    })

    it('sorts by wins first', () => {
      const matchups = [
        {
          home_team_id: 'team1',
          home_team_name: 'Team 1',
          home_score: 100,
          away_team_id: 'team2',
          away_team_name: 'Team 2',
          away_score: 90,
          status: 'final',
        },
        {
          home_team_id: 'team3',
          home_team_name: 'Team 3',
          home_score: 110,
          away_team_id: 'team2',
          away_team_name: 'Team 2',
          away_score: 80,
          status: 'final',
        },
      ]

      const standings = calculateStandings(matchups)

      // Team 3 should be first (2 wins), then Team 1 (1 win), then Team 2 (0 wins)
      expect(standings[0].teamId).toBe('team3')
      expect(standings[1].teamId).toBe('team1')
      expect(standings[2].teamId).toBe('team2')
    })

    it('sorts by points for when wins are equal', () => {
      const matchups = [
        {
          home_team_id: 'team1',
          home_team_name: 'Team 1',
          home_score: 100,
          away_team_id: 'team2',
          away_team_name: 'Team 2',
          away_score: 90,
          status: 'final',
        },
        {
          home_team_id: 'team3',
          home_team_name: 'Team 3',
          home_score: 120,
          away_team_id: 'team4',
          away_team_name: 'Team 4',
          away_score: 80,
          status: 'final',
        },
      ]

      const standings = calculateStandings(matchups)

      // Both Team 1 and Team 3 have 1 win, but Team 3 has more points for
      const team1Index = standings.findIndex(s => s.teamId === 'team1')
      const team3Index = standings.findIndex(s => s.teamId === 'team3')
      expect(team3Index).toBeLessThan(team1Index)
    })

    it('ignores non-final matchups', () => {
      const matchups = [
        {
          home_team_id: 'team1',
          home_team_name: 'Team 1',
          home_score: 100,
          away_team_id: 'team2',
          away_team_name: 'Team 2',
          away_score: 90,
          status: 'final',
        },
        {
          home_team_id: 'team3',
          home_team_name: 'Team 3',
          home_score: 110,
          away_team_id: 'team4',
          away_team_name: 'Team 4',
          away_score: 95,
          status: 'scheduled', // Not final, should be ignored
        },
      ]

      const standings = calculateStandings(matchups)

      // Only teams 1 and 2 should appear
      expect(standings).toHaveLength(2)
      expect(standings.find(s => s.teamId === 'team3')).toBeUndefined()
    })

    it('handles empty matchups', () => {
      const standings = calculateStandings([])
      expect(standings).toHaveLength(0)
    })
  })
})

