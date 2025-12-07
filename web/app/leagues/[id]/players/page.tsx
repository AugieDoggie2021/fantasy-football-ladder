import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { PlayersList } from '@/components/players-list'
import { HomeIcon } from '@/components/icons'
import { getCurrentUserWithProfile, canAccessCommissionerTools } from '@/lib/auth-roles'
import { LeagueContextHeader } from '@/components/league-context-header'
import { LeagueNavigation } from '@/components/league-navigation'

export default async function LeaguePlayersPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const userWithProfile = await getCurrentUserWithProfile()

  if (!userWithProfile?.user) {
    redirect('/login')
  }

  const { user, profile } = userWithProfile

  // Fetch league info
  const { data: league } = await supabase
    .from('leagues')
    .select(`
      *,
      seasons (
        id,
        year
      ),
      promotion_groups (
        id,
        name
      )
    `)
    .eq('id', params.id)
    .single()

  if (!league) {
    notFound()
  }

  // Check if user can access commissioner tools
  const canAccessCommissioner = canAccessCommissionerTools(user.id, profile, league)

  // Redirect if league is not active
  if (league.status !== 'active') {
    redirect(`/leagues/${params.id}`)
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
              href="/dashboard"
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
            >
              <HomeIcon size={20} />
              <span>← Back to Overview</span>
            </Link>
            
            <LeagueContextHeader
              seasonYear={league.seasons?.[0]?.year}
              promotionGroupName={undefined}
              leagueName={league.name}
              tier={undefined}
              currentWeek={null}
            />
            
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Players
              </h1>
            </div>

            <LeagueNavigation leagueId={params.id} isCommissioner={canAccessCommissioner} />
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

