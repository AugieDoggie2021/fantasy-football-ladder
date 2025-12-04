import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getLeagueWeekPlayerScores, type LeagueWeekPlayerScore } from '../league-scores'
import { createClient } from '@/lib/supabase/server'

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock auth
const mockUser = { id: 'user-123' }

describe('League Scores API', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Create a mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      in: vi.fn(() => mockSupabase),
      single: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
    }

    // Set up the mock
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('getLeagueWeekPlayerScores', () => {
    it('returns player scores for a league week', async () => {
      const leagueId = 'league-123'
      const seasonYear = 2024
      const week = 1

      // Mock league lookup
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: leagueId },
                  error: null,
                }),
              })),
            })),
          }
        }
        if (table === 'league_weeks') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: [{ id: 'week-1', week_number: 1 }],
                  error: null,
                }),
              })),
            })),
          }
        }
        if (table === 'rosters') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    player_id: 'player-1',
                    team_id: 'team-1',
                    is_starter: true,
                    slot_type: 'QB',
                    players: {
                      id: 'player-1',
                      full_name: 'Patrick Mahomes',
                      position: 'QB',
                      nfl_team: 'KC',
                    },
                  },
                  {
                    player_id: 'player-2',
                    team_id: 'team-1',
                    is_starter: false,
                    slot_type: 'BENCH',
                    players: {
                      id: 'player-2',
                      full_name: 'Josh Allen',
                      position: 'QB',
                      nfl_team: 'BUF',
                    },
                  },
                ],
                error: null,
              }),
            })),
          }
        }
        if (table === 'player_week_stats') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn().mockResolvedValue({
                    data: [
                      {
                        player_id: 'player-1',
                        season_year: seasonYear,
                        nfl_week: week,
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
                      },
                      // player-2 has no stats (did not play)
                    ],
                    error: null,
                  }),
                })),
              })),
            })),
          }
        }
        return mockSupabase
      })

      const result = await getLeagueWeekPlayerScores({
        leagueId,
        seasonYear,
        week,
      })

      expect(result.error).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(result.data?.length).toBe(2)

      // Check first player (starter with stats)
      const player1 = result.data?.find(p => p.playerId === 'player-1')
      expect(player1).toBeDefined()
      expect(player1?.playerName).toBe('Patrick Mahomes')
      expect(player1?.position).toBe('QB')
      expect(player1?.teamAbbrev).toBe('KC')
      expect(player1?.rosterSlot).toBe('starter')
      expect(player1?.fantasyPoints).toBe(24) // 12 (300/25) + 12 (3*4) - 2 (1*INT) + 2 (20/10) = 24
      expect(player1?.stats.passingYards).toBe(300)
      expect(player1?.stats.passingTds).toBe(3)
      expect(player1?.stats.interceptions).toBe(1)

      // Check second player (bench, no stats)
      const player2 = result.data?.find(p => p.playerId === 'player-2')
      expect(player2).toBeDefined()
      expect(player2?.playerName).toBe('Josh Allen')
      expect(player2?.rosterSlot).toBe('bench')
      expect(player2?.fantasyPoints).toBe(0) // No stats = 0 points
      expect(player2?.stats.passingYards).toBeUndefined()
    })

    it('handles empty roster', async () => {
      const leagueId = 'league-123'
      const seasonYear = 2024
      const week = 1

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: leagueId },
                  error: null,
                }),
              })),
            })),
          }
        }
        if (table === 'league_weeks') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              })),
            })),
          }
        }
        if (table === 'rosters') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          }
        }
        return mockSupabase
      })

      const result = await getLeagueWeekPlayerScores({
        leagueId,
        seasonYear,
        week,
      })

      expect(result.error).toBeUndefined()
      expect(result.data).toBeDefined()
      expect(result.data?.length).toBe(0)
    })

    it('returns error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await getLeagueWeekPlayerScores({
        leagueId: 'league-123',
        seasonYear: 2024,
        week: 1,
      })

      expect(result.error).toBe('Not authenticated')
      expect(result.data).toBeUndefined()
    })

    it('returns error when league not found', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'leagues') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              })),
            })),
          }
        }
        return mockSupabase
      })

      const result = await getLeagueWeekPlayerScores({
        leagueId: 'invalid-league',
        seasonYear: 2024,
        week: 1,
      })

      expect(result.error).toBe('League not found or access denied')
      expect(result.data).toBeUndefined()
    })
  })
})

