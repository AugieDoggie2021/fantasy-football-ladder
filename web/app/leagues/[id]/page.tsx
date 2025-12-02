import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { JoinLeagueForm } from '@/components/join-league-form'

export default async function LeagueDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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

  // Check if user can view this league (RLS should handle this, but we check anyway)
  const { data: canView } = await supabase
    .from('leagues')
    .select('id')
    .eq('id', params.id)
    .single()

  if (!canView) {
    redirect('/dashboard')
  }

  // Check if user already has a team in this league
  const { data: userTeam } = await supabase
    .from('teams')
    .select('*')
    .eq('league_id', params.id)
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .single()

  // Fetch all teams in this league
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      *,
      owner_user_id
    `)
    .eq('league_id', params.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {league.name}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{league.seasons?.year} Season</span>
              {league.tier && <span>• Tier {league.tier}</span>}
              {league.promotion_groups && (
                <span>• {league.promotion_groups.name}</span>
              )}
              <span>• Max Teams: {league.max_teams}</span>
              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {league.status}
              </span>
            </div>
          </div>

          {/* User's Team Section */}
          {userTeam ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Your Team
              </h2>
              <div className="flex items-center gap-4">
                {userTeam.logo_url && (
                  <img
                    src={userTeam.logo_url}
                    alt={userTeam.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {userTeam.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Draft Position: {userTeam.draft_position ?? 'Not assigned'}
                  </p>
                </div>
              </div>
              {/* TODO: Link to team management page in Phase 3 */}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Join this League
              </h2>
              {teams && teams.length >= league.max_teams ? (
                <p className="text-gray-500 dark:text-gray-400">
                  This league is full ({teams.length}/{league.max_teams} teams).
                </p>
              ) : (
                <JoinLeagueForm leagueId={params.id} />
              )}
            </div>
          )}

          {/* Teams in League Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Teams ({teams?.length || 0}/{league.max_teams})
            </h2>
            
            {teams && teams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team: any) => (
                  <div
                    key={team.id}
                    className={`p-4 border rounded-lg ${
                      team.owner_user_id === user.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {team.logo_url && (
                      <img
                        src={team.logo_url}
                        alt={team.name}
                        className="w-12 h-12 rounded-full object-cover mb-2"
                      />
                    )}
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {team.name}
                      {team.owner_user_id === user.id && (
                        <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
                          (You)
                        </span>
                      )}
                    </h3>
                    {team.draft_position && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Draft Position: {team.draft_position}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No teams have joined this league yet.
              </p>
            )}
          </div>

          {/* League Settings (Commissioner Only) */}
          {league.created_by_user_id === user.id && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You are the commissioner of this league. League management features will be added in future phases.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

