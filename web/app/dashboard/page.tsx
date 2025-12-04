import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import { SeedDemoButton } from '@/components/seed-demo-button'
import { DevHelpersSection } from '@/components/dev-helpers-section'
import { DevStatsIngestionPanel } from '@/components/dev-stats-ingestion-panel'
import { DevPlayerScoresView } from '@/components/dev-player-scores-view'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch leagues where user has a team
  const { data: myLeagues } = await supabase
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

  // Fetch promotion groups created by user
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

          {/* My Leagues Section */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                My Leagues
              </h2>
              <Link
                href="/leagues/create"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
              >
                Create League
              </Link>
            </div>
            
            {myLeagues && myLeagues.length > 0 ? (
              <div className="space-y-3">
                {myLeagues.map((team: any) => {
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
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {league.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {season?.year} Season
                            {league.tier && ` • Tier ${league.tier}`}
                            {promotionGroup && ` • ${promotionGroup.name}`}
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
                <Link href="/leagues/create" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Join or create a league
                </Link>
              </p>
            )}
          </div>

          {/* Promotion Groups I Own Section */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Promotion Groups I Own
              </h2>
              <Link
                href="/promotion-groups"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
              >
                Create Promotion Group
              </Link>
            </div>
            
            {myPromotionGroups && myPromotionGroups.length > 0 ? (
              <div className="space-y-3">
                {myPromotionGroups.map((group: any) => (
                  <Link
                    key={group.id}
                    href={`/promotion-groups/${group.id}`}
                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {group.seasons?.[0]?.year} Season
                    </p>
                    {group.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {group.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                You haven&apos;t created any promotion groups yet.{' '}
                <Link href="/promotion-groups" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Create one
                </Link>
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/seasons"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center"
              >
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  Manage Seasons
                </span>
              </Link>
              <Link
                href="/promotion-groups"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center"
              >
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  Promotion Groups
                </span>
              </Link>
              <Link
                href="/leagues/create"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-center"
              >
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  Create League
                </span>
              </Link>
            </div>
          </div>

          {/* Dev-only Tools */}
          {env === 'dev' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Demo Data
                </h3>
                <SeedDemoButton />
              </div>
              
              <div className="pt-4 border-t border-yellow-200 dark:border-yellow-800">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Testing Helpers
                </h3>
                <DevHelpersSection />
              </div>

              <div className="pt-4 border-t border-yellow-200 dark:border-yellow-800">
                <DevStatsIngestionPanel />
              </div>

              <div className="pt-4 border-t border-yellow-200 dark:border-yellow-800">
                <DevPlayerScoresView />
              </div>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  )
}

