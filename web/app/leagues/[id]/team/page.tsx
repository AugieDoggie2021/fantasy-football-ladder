import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { HomeFootballIcon } from '@/components/icons'
import { getCurrentUserWithProfile, canAccessCommissionerTools } from '@/lib/auth-roles'
import { MyTeamRoster } from '@/components/my-team-roster'
import { LeagueContextHeader } from '@/components/league-context-header'
import { LeagueNavigation } from '@/components/league-navigation'

export default async function TeamPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const userWithProfile = await getCurrentUserWithProfile()

  if (!userWithProfile?.user) {
    redirect('/login')
  }

  const { user } = userWithProfile

  // Fetch league with related data
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
  const canAccessCommissioner = canAccessCommissionerTools(user.id, userWithProfile.profile, league)

  // Check if user has a team in this league
  const { data: userTeam } = await supabase
    .from('teams')
    .select('*')
    .eq('league_id', params.id)
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .single()

  // Fetch current week info
  const { data: currentWeek } = await supabase
    .from('league_weeks')
    .select('*')
    .eq('league_id', params.id)
    .eq('is_current', true)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
            >
              <HomeFootballIcon size={20} />
              <span>← Back to Overview</span>
            </Link>
            
            <LeagueContextHeader
              seasonYear={league.seasons?.[0]?.year}
              promotionGroupName={league.promotion_groups?.name}
              leagueName={league.name}
              tier={league.tier}
              currentWeek={currentWeek?.week_number || null}
            />
          </div>

          {/* League Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Team
            </h1>
          </div>

          {/* League Navigation */}
          <LeagueNavigation leagueId={params.id} isCommissioner={canAccessCommissioner} />

          {/* Team Roster Section */}
          {userTeam ? (
            <MyTeamRoster 
              team={userTeam} 
              leagueId={params.id}
              leagueStatus={league.status}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Join this League
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                You need to join this league before you can manage your team.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

