/**
 * Schedule Generation Helpers
 * 
 * Utilities for generating fantasy football schedules
 */

interface Team {
  id: string
  name: string
}

/**
 * Generate a simple round-robin schedule
 * For even number of teams: each team plays every other team once
 * For odd number: one team gets a bye each week
 */
export function generateRoundRobinSchedule(teams: Team[], totalWeeks: number = 14): Array<{
  week: number
  matchups: Array<{ homeTeamId: string; awayTeamId: string }>
}> {
  const schedule: Array<{
    week: number
    matchups: Array<{ homeTeamId: string; awayTeamId: string }>
  }> = []

  const teamCount = teams.length
  if (teamCount < 2) {
    return schedule
  }

  // Simple rotating schedule algorithm
  // For each week, rotate teams and pair them up
  for (let week = 1; week <= totalWeeks; week++) {
    const matchups: Array<{ homeTeamId: string; awayTeamId: string }> = []
    
    // Create a rotated array for this week
    const rotated = [...teams]
    const rotationOffset = (week - 1) % (teamCount - 1)
    
    // Rotate teams (first team stays fixed, others rotate)
    if (rotationOffset > 0) {
      const fixed = rotated[0]
      const rest = rotated.slice(1)
      const rotatedRest = [
        ...rest.slice(rotationOffset),
        ...rest.slice(0, rotationOffset)
      ]
      rotated.splice(0, rotated.length, fixed, ...rotatedRest)
    }

    // Pair up teams
    for (let i = 0; i < Math.floor(teamCount / 2); i++) {
      const homeIndex = i
      const awayIndex = teamCount - 1 - i
      
      matchups.push({
        homeTeamId: rotated[homeIndex].id,
        awayTeamId: rotated[awayIndex].id,
      })
    }

    schedule.push({ week, matchups })
  }

  return schedule
}

