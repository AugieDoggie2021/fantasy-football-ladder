import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import Link from 'next/link'
import { getCurrentUserWithProfile, isGlobalAdmin } from '@/lib/auth-roles'
import { getDashboardState } from '@/lib/dashboard-state'

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

  // Get dashboard state
  const dashboardState = await getDashboardState(user.id)
  const { teams, leaguesOwned, pendingInvites } = dashboardState

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
    (leaguesOwned && leaguesOwned.length > 0) ||
    (myPromotionGroups && myPromotionGroups.length > 0)

  const env = process.env.NEXT_PUBLIC_APP_ENV || 'dev'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Fantasy Football Overview
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Logged in as: {user.email}
            </p>
          </div>

          {/* Pending Invites Section */}
          {pendingInvites.length > 0 && (
            <div className="mb-8 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                You&apos;ve been invited to join a league
              </h2>
              <div className="space-y-3">
                {pendingInvites.map((invite: any) => {
                  const league = invite.leagues
                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-700"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {league?.name}
                        </h3>
                        {league?.promotion_groups && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ladder: {league.promotion_groups.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Invited {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        href={`/join/league/${invite.token}`}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                      >
                        View
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Actions - Always Visible */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/commissioner/get-started"
                className="flex flex-col items-center justify-center p-6 border-2 border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition text-center"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Create New League
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Start your own league and invite managers
                </p>
                <span className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium">
                  Create League
                </span>
              </Link>
              
              <Link
                href="/join"
                className="flex flex-col items-center justify-center p-6 border-2 border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition text-center"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Join a League
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Join a league using a code or invite link
                </p>
                <span className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium">
                  Join League
                </span>
              </Link>
            </div>
          </div>

          {/* Leagues I Run (Commissioner) */}
          {leaguesOwned.length > 0 && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Leagues I Run
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Leagues where you are the commissioner
              </p>
              
              <div className="space-y-2">
                {leaguesOwned.map((league: any) => {
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
            </div>
          )}

          {/* Ladders I Manage (if commissioner) */}
          {isCommissioner && myPromotionGroups && myPromotionGroups.length > 0 && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  My Ladders
                </h2>
                <Link
                  href="/promotion-groups"
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                >
                  Create Ladder
                </Link>
              </div>
              
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
            </div>
          )}

          {/* Admin Links */}
          {isAdmin && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Admin Tools
              </h2>
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

          {/* Leagues I'm In (Manager) - Filter out leagues where user is commissioner */}
          {(() => {
            const leaguesOwnedIds = new Set(leaguesOwned.map((l: any) => l.id))
            const managerOnlyTeams = teams.filter((team: any) => {
              const league = team.leagues
              return league && !leaguesOwnedIds.has(league.id)
            })
            
            return managerOnlyTeams.length > 0 ? (
              <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Leagues I&apos;m In
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Leagues where you are a team manager
                </p>
                
                <div className="space-y-3">
                  {managerOnlyTeams.map((team: any) => {
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
              </div>
            ) : null
          })()}

          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  )
}

