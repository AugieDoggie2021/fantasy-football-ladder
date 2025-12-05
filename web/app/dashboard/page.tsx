import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import Link from 'next/link'
import { getCurrentUserWithProfile, isGlobalAdmin } from '@/lib/auth-roles'

export default async function DashboardPage() {
  const supabase = await createClient()
  const userWithProfile = await getCurrentUserWithProfile()

  const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'dev'
  if (isDev) {
    console.log('[Dashboard] User check:', userWithProfile?.user?.email || 'not authenticated')
  }

  if (!userWithProfile?.user) {
    redirect('/login')
  }

  const { user, profile } = userWithProfile
  const isAdmin = isGlobalAdmin(profile)

  // Fetch leagues where user has a team (as player)
  const { data: myTeams } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      league_id,
      leagues (
        id,
        name,
        tier,
        status,
        seasons (
          id,
          year
        ),
        promotion_groups (
          id,
          name
        )
      )
    `)
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Fetch leagues where user is commissioner
  const { data: myCommissionerLeagues } = await supabase
    .from('leagues')
    .select(`
      id,
      name,
      tier,
      status,
      seasons (
        id,
        year
      ),
      promotion_groups (
        id,
        name
      )
    `)
    .eq('created_by_user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch promotion groups created by user (ladder commissioner)
  const { data: myPromotionGroups } = await supabase
    .from('promotion_groups')
    .select(`
      id,
      name,
      description,
      seasons (
        id,
        year
      )
    `)
    .eq('created_by_user_id', user.id)
    .order('created_at', { ascending: false })

  const isCommissioner = isAdmin || 
    (myCommissionerLeagues && myCommissionerLeagues.length > 0) ||
    (myPromotionGroups && myPromotionGroups.length > 0)

  const env = process.env.NEXT_PUBLIC_APP_ENV || 'dev'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Logged in as: {user.email}
            </p>
          </div>

          {/* As Commissioner Section */}
          {isCommissioner && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                As Commissioner
              </h2>
              
              <div className="space-y-6">
                {/* Ladders I Manage */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Ladders I Manage
                    </h3>
                    <Link
                      href="/promotion-groups"
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      Create Ladder
                    </Link>
                  </div>
                  
                  {myPromotionGroups && myPromotionGroups.length > 0 ? (
                    <div className="space-y-2">
                      {myPromotionGroups.map((group: any) => (
                        <Link
                          key={group.id}
                          href={`/promotion-groups/${group.id}`}
                          className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {group.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {group.seasons?.[0]?.year} Season
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No ladders yet. <Link href="/promotion-groups" className="text-indigo-600 dark:text-indigo-400 hover:underline">Create one</Link>
                    </p>
                  )}
                </div>

                {/* Leagues I Manage */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Leagues I Manage
                    </h3>
                    <Link
                      href="/leagues/create"
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      Create League
                    </Link>
                  </div>
                  
                  {myCommissionerLeagues && myCommissionerLeagues.length > 0 ? (
                    <div className="space-y-2">
                      {myCommissionerLeagues.map((league: any) => {
                        const season = league?.seasons
                        const promotionGroup = league?.promotion_groups
                        return (
                          <Link
                            key={league.id}
                            href={`/leagues/${league.id}`}
                            className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                          >
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              {league.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {season?.year} Season
                              {league.tier && ` • Tier ${league.tier}`}
                              {promotionGroup && ` • ${promotionGroup.name} Ladder`}
                            </p>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No leagues yet. <Link href="/leagues/create" className="text-indigo-600 dark:text-indigo-400 hover:underline">Create one</Link>
                    </p>
                  )}
                </div>

                {/* Admin Links */}
                {isAdmin && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Admin Tools
                    </h3>
                    <div className="space-y-2">
                      <Link
                        href="/seasons"
                        className="block px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                      >
                        Manage Seasons (Admin)
                      </Link>
                      {env === 'dev' && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition text-sm text-yellow-800 dark:text-yellow-200"
                        >
                          Developer Tools (Admin)
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* As Player Section */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              As Player
            </h2>
            
            {/* My Teams */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                My Teams
              </h3>
              
              {myTeams && myTeams.length > 0 ? (
                <div className="space-y-3">
                  {myTeams.map((team: any) => {
                    const league = team.leagues
                    const season = league?.seasons
                    const promotionGroup = league?.promotion_groups
                    
                    return (
                      <Link
                        key={team.id}
                        href={`/leagues/${league.id}`}
                        className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {league.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {season?.year} Season
                              {league.tier && ` • Tier ${league.tier}`}
                              {promotionGroup && ` • ${promotionGroup.name} Ladder`}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Your Team: {team.name}
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {league.status}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  You don&apos;t have any teams yet.{' '}
                  <Link href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    Browse available leagues
                  </Link>
                </p>
              )}
            </div>

            {/* Join a League (placeholder) */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Join a League
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Browse and join available leagues. (Feature coming soon)
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  )
}

