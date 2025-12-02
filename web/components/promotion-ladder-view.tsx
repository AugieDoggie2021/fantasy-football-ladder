import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LeagueStandings } from './league-standings'

interface PromotionLadderViewProps {
  promotionGroupId: string
  leagues: Array<{
    id: string
    name: string
    tier: number | null
    status: string
    max_teams: number
  }>
}

export async function PromotionLadderView({ promotionGroupId, leagues }: PromotionLadderViewProps) {
  const supabase = await createClient()

  // Group leagues by tier
  const leaguesByTier = leagues.reduce((acc: any, league) => {
    const tier = league.tier ?? 'No Tier'
    if (!acc[tier]) {
      acc[tier] = []
    }
    acc[tier].push(league)
    return acc
  }, {})

  // Sort tiers descending (1 = top tier at top of visual)
  const sortedTiers = Object.keys(leaguesByTier)
    .filter(t => t !== 'No Tier')
    .map(t => parseInt(t))
    .sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      {sortedTiers.map((tier) => {
        const tierLeagues = leaguesByTier[tier.toString()]
        return (
          <div key={tier} className="border-l-4 border-indigo-500 pl-4">
            <div className="mb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Tier {tier}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tier === 1 ? 'Top Tier' : tier === sortedTiers.length ? 'Bottom Tier' : 'Mid Tier'}
              </p>
            </div>
            {tierLeagues.map((league: any) => (
              <div
                key={league.id}
                className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Link
                      href={`/leagues/${league.id}`}
                      className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {league.name}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Status: {league.status}
                    </p>
                  </div>
                </div>
                {league.status === 'complete' && (
                  <div className="mt-4">
                    <LeagueStandings leagueId={league.id} />
                  </div>
                )}
                {league.status !== 'complete' && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Season in progress. Standings will appear once season is complete.
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      })}
      {leaguesByTier['No Tier'] && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Unassigned
          </h3>
          {leaguesByTier['No Tier'].map((league: any) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition mb-3"
            >
              <h4 className="font-medium text-gray-900 dark:text-white">
                {league.name}
              </h4>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

