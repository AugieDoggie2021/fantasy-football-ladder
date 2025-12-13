import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getInviteByToken, acceptInvite } from '@/app/actions/invites'
import { JoinLeagueInviteForm } from '@/components/join-league-invite-form'

export const dynamic = 'force-dynamic'

interface JoinLeaguePageProps {
  params: {
    token: string
  }
}

export default async function JoinLeaguePage({ params }: JoinLeaguePageProps) {
  // Redirect legacy /join/league/:token to canonical /join/:token
  redirect(`/join/${params.token}`)

  if (inviteResult.error || !inviteResult.data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Invalid Invite
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {inviteResult.error || 'This invite link is invalid or has expired.'}
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  const invite = inviteResult.data
  const league = invite.leagues as any

  // Check if user already has a team in this league
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id, name')
    .eq('league_id', invite.league_id)
    .eq('owner_user_id', user.id)
    .single()

  if (existingTeam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Already in League
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You&apos;re already in this league with the team &quot;{existingTeam.name}&quot;.
          </p>
          <a
            href={`/leagues/${invite.league_id}`}
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            View League
          </a>
        </div>
      </div>
    )
  }

  // Check if league is full
  const teamCount = Array.isArray(league?.teams) ? league.teams.length : 0
  const isFull = teamCount >= league.max_teams

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Join League
          </h1>
          
          <div className="space-y-4 mb-6">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">League:</span>
              <p className="text-lg text-gray-900 dark:text-white">{league.name}</p>
            </div>
            
            {league.promotion_groups && (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Ladder:</span>
                <p className="text-lg text-gray-900 dark:text-white">{league.promotion_groups.name}</p>
              </div>
            )}
            
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Teams:</span>
              <p className="text-lg text-gray-900 dark:text-white">
                {teamCount} / {league.max_teams}
              </p>
            </div>
          </div>

          {isFull ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                This league is full ({teamCount}/{league.max_teams} teams). Contact the commissioner to join.
              </p>
            </div>
          ) : (
            <JoinLeagueInviteForm token={params.token} leagueId={invite.league_id} />
          )}
        </div>
      </div>
    </div>
  )
}

