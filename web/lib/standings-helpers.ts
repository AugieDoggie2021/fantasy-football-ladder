/**
 * Standings Computation Helpers
 * 
 * Utilities for calculating league standings from matchups
 */

export interface TeamStanding {
  teamId: string
  teamName: string
  wins: number
  losses: number
  ties: number
  pointsFor: number
  pointsAgainst: number
}

/**
 * Calculate standings for a league from completed matchups
 */
export function calculateStandings(
  matchups: Array<{
    home_team_id: string
    home_team_name?: string
    home_score: number
    away_team_id: string
    away_team_name?: string
    away_score: number
    status: string
  }>
): TeamStanding[] {
  const standingsMap = new Map<string, TeamStanding>()

  // Process each completed matchup
  const completedMatchups = matchups.filter(m => m.status === 'final')
  
  completedMatchups.forEach(matchup => {
    // Initialize or get home team standing
    if (!standingsMap.has(matchup.home_team_id)) {
      standingsMap.set(matchup.home_team_id, {
        teamId: matchup.home_team_id,
        teamName: matchup.home_team_name || 'Unknown Team',
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      })
    }
    
    // Initialize or get away team standing
    if (!standingsMap.has(matchup.away_team_id)) {
      standingsMap.set(matchup.away_team_id, {
        teamId: matchup.away_team_id,
        teamName: matchup.away_team_name || 'Unknown Team',
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      })
    }

    const homeStanding = standingsMap.get(matchup.home_team_id)!
    const awayStanding = standingsMap.get(matchup.away_team_id)!

    // Add points
    homeStanding.pointsFor += matchup.home_score
    homeStanding.pointsAgainst += matchup.away_score
    awayStanding.pointsFor += matchup.away_score
    awayStanding.pointsAgainst += matchup.home_score

    // Determine winner/loser/tie
    if (matchup.home_score > matchup.away_score) {
      homeStanding.wins += 1
      awayStanding.losses += 1
    } else if (matchup.away_score > matchup.home_score) {
      awayStanding.wins += 1
      homeStanding.losses += 1
    } else {
      homeStanding.ties += 1
      awayStanding.ties += 1
    }
  })

  // Convert to array and sort
  const standings = Array.from(standingsMap.values())
  
  // Sort by: wins (desc), then pointsFor (desc), then pointsAgainst (asc), then team name
  standings.sort((a, b) => {
    // First by wins
    if (b.wins !== a.wins) {
      return b.wins - a.wins
    }
    // Then by points for
    if (b.pointsFor !== a.pointsFor) {
      return b.pointsFor - a.pointsFor
    }
    // Then by points against (lower is better)
    if (a.pointsAgainst !== b.pointsAgainst) {
      return a.pointsAgainst - b.pointsAgainst
    }
    // Finally by team name
    return a.teamName.localeCompare(b.teamName)
  })

  return standings
}

