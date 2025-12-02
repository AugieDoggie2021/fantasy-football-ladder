import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { CreateLeagueInGroupForm } from '@/components/create-league-in-group-form'

export default async function PromotionGroupDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: group } = await supabase
    .from('promotion_groups')
    .select(`
      *,
      seasons (
        id,
        year
      )
    `)
    .eq('id', params.id)
    .eq('created_by_user_id', user.id)
    .single()

  if (!group) {
    notFound()
  }

  // Fetch leagues in this promotion group, grouped by tier
  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .eq('promotion_group_id', params.id)
    .order('tier', { ascending: true, nullsLast: true })
    .order('name', { ascending: true })

  // Group leagues by tier
  const leaguesByTier = leagues?.reduce((acc: any, league: any) => {
    const tier = league.tier ?? 'No Tier'
    if (!acc[tier]) {
      acc[tier] = []
    }
    acc[tier].push(league)
    return acc
  }, {}) || {}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/promotion-groups"
              className="text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block"
            >
              ← Back to Promotion Groups
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {group.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {group.seasons?.year} Season
            </p>
            {group.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {group.description}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create League in this Group
            </h2>
            <CreateLeagueInGroupForm promotionGroupId={params.id} seasonId={group.season_id} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Leagues by Tier
            </h2>
            
            {Object.keys(leaguesByTier).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(leaguesByTier).map(([tier, tierLeagues]: [string, any]) => (
                  <div key={tier}>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      {tier === 'No Tier' ? 'Unassigned' : `Tier ${tier}`}
                    </h3>
                    <div className="space-y-3">
                      {tierLeagues.map((league: any) => (
                        <Link
                          key={league.id}
                          href={`/leagues/${league.id}`}
                          className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {league.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Max teams: {league.max_teams} • Status: {league.status}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No leagues in this promotion group yet. Create one above.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

