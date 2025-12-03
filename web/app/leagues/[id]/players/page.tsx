import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { PlayersList } from '@/components/players-list'

export default async function LeaguePlayersPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch league info
  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, seasons(year)')
    .eq('id', params.id)
    .single()

  if (!league) {
    notFound()
  }

  // Check if user has a team in this league
  const { data: userTeam } = await supabase
    .from('teams')
    .select('id, name')
    .eq('league_id', params.id)
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!userTeam) {
    // Redirect to league page if user doesn't have a team
    redirect(`/leagues/${params.id}`)
  }

  // Fetch all players
  const { data: allPlayers } = await supabase
    .from('players')
    .select('*')
    .order('position', { ascending: true })
    .order('full_name', { ascending: true })

  // Fetch all rosters in this league to determine ownership
  const { data: leagueRosters } = await supabase
    .from('rosters')
    .select(`
      player_id,
      teams!inner(
        id,
        name,
        owner_user_id
      )
    `)
    .eq('league_id', params.id)

  // Create a map of player_id to team ownership info
  const playerOwnershipMap = new Map<string, { teamId: string; teamName: string; isMyTeam: boolean }>()
  
  leagueRosters?.forEach((roster: any) => {
    const team = roster.teams
    if (team) {
      playerOwnershipMap.set(roster.player_id, {
        teamId: team.id,
        teamName: team.name,
        isMyTeam: team.owner_user_id === user.id,
      })
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href={`/leagues/${params.id}`}
              className="text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block"
            >
              ← Back to League
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Players - {league.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {league.seasons?.[0]?.year} Season
            </p>
          </div>

          <PlayersList
            players={allPlayers || []}
            playerOwnershipMap={playerOwnershipMap}
            teamId={userTeam.id}
            leagueId={params.id}
          />
        </div>
      </div>
    </div>
  )
}

