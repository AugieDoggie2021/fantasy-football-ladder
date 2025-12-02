import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { CreateLeagueInGroupForm } from '@/components/create-league-in-group-form'
import { PromotionLadderView } from '@/components/promotion-ladder-view'
import { PromotionControls } from '@/components/promotion-controls'

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
        year,
        status
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

          {/* Ladder View */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Ladder View
            </h2>
            {leagues && leagues.length > 0 ? (
              <PromotionLadderView promotionGroupId={params.id} leagues={leagues} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No leagues in this promotion group yet. Create one above.
              </p>
            )}
          </div>

          {/* Commissioner Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Promotion & Season Rollover
            </h2>
            <PromotionControls
              promotionGroupId={params.id}
              seasonId={group.season_id}
              seasonStatus={group.seasons?.status || 'preseason'}
              isComplete={group.seasons?.status === 'complete'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

