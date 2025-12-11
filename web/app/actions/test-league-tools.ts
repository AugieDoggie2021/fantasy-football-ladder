'use server'

import { fillLeagueWithTestTeams } from '@/lib/test-league-tools'
import { getCurrentUserWithProfile } from '@/lib/auth-roles'

export async function fillLeagueWithTestTeamsAction(
  leagueId: string,
  requestedTeamCount?: number,
) {
  const userWithProfile = await getCurrentUserWithProfile()
  if (!userWithProfile?.user) {
    throw new Error('Unauthorized')
  }

  return fillLeagueWithTestTeams({
    leagueId,
    requestedTeamCount,
    currentUserId: userWithProfile.user.id,
  })
}

