/**
 * Draft Helper Functions
 * 
 * Utilities for generating snake draft order and draft picks
 */

interface Team {
  id: string
  name: string
  draft_position?: number | null
}

/**
 * Generate snake draft order based on teams
 * For MVP: uses team creation order if draft_position is not set
 */
export function generateSnakeDraftOrder(teams: Team[], rounds: number = 14): number[][] {
  const sortedTeams = [...teams].sort((a, b) => {
    // Use draft_position if available, otherwise use creation order (implicit from array order)
    const posA = a.draft_position ?? 0
    const posB = b.draft_position ?? 0
    return posA - posB
  })

  const teamCount = sortedTeams.length
  const draftOrder: number[][] = []

  for (let round = 1; round <= rounds; round++) {
    const roundOrder: number[] = []
    
    if (round % 2 === 1) {
      // Odd rounds: 1, 2, 3, ..., n
      for (let i = 0; i < teamCount; i++) {
        roundOrder.push(i)
      }
    } else {
      // Even rounds: n, n-1, ..., 2, 1 (reversed)
      for (let i = teamCount - 1; i >= 0; i--) {
        roundOrder.push(i)
      }
    }
    
    draftOrder.push(roundOrder)
  }

  return draftOrder
}

/**
 * Generate overall pick numbers for snake draft
 * Returns array of { round, overallPick, teamIndex } objects
 */
export function generateDraftPicks(teams: Team[], rounds: number = 14): Array<{
  round: number
  overallPick: number
  teamIndex: number
  teamId: string
}> {
  const draftOrder = generateSnakeDraftOrder(teams, rounds)
  const picks: Array<{
    round: number
    overallPick: number
    teamIndex: number
    teamId: string
  }> = []

  let overallPick = 1

  draftOrder.forEach((roundOrder, roundIndex) => {
    const round = roundIndex + 1
    roundOrder.forEach(teamIndex => {
      picks.push({
        round,
        overallPick: overallPick++,
        teamIndex,
        teamId: teams[teamIndex].id,
      })
    })
  })

  return picks
}

