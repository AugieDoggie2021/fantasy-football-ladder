import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BrowseLeaguesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch public/joinable leagues
  // For now, we'll show leagues that are marked as public and joinable
  // In the future, this could be expanded to show leagues the user can request to join
  const { data: leagues } = await supabase
    .from('leagues')
    .select(`
      id,
      name,
      max_teams,
      status,
      promotion_groups (
        id,
        name
      ),
      teams!inner (
        id
      )
    `)
    .eq('is_public', true)
    .eq('is_joinable', true)
    .order('created_at', { ascending: false })

  // Count teams for each league
  const leaguesWithCounts = leagues?.map(league => {
    const teamCount = Array.isArray(league.teams) ? league.teams.length : 0
    return {
      ...league,
      teamCount,
      isFull: teamCount >= league.max_teams,
    }
  }) || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Browse Available Leagues
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find and join public leagues that are open for new members.
          </p>
        </div>

        {leaguesWithCounts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No public leagues are available at this time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaguesWithCounts.map((league: any) => (
              <div
                key={league.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {league.name}
                </h3>
                
                {league.promotion_groups && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Ladder: {league.promotion_groups.name}
                  </p>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {league.teamCount} / {league.max_teams} teams
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    league.status === 'preseason' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                      : league.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {league.status}
                  </span>
                </div>

                {league.isFull ? (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                    League is full
                  </p>
                ) : (
                  <Link
                    href={`/leagues/${league.id}`}
                    className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                  >
                    View League
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

