import { createClient } from '@/lib/supabase/server'
import { TierBadge, MovementArrow } from '@/components/ui'

interface PromotionHistoryProps {
  promotionGroupId: string
}

export async function PromotionHistory({ promotionGroupId }: PromotionHistoryProps) {
  const supabase = await createClient()

  // Fetch promotion results for this group
  const { data: results } = await supabase
    .from('promotion_results')
    .select(`
      *,
      from_season:seasons!promotion_results_from_season_id_fkey (
        id,
        year
      ),
      to_season:seasons!promotion_results_to_season_id_fkey (
        id,
        year
      ),
      team:teams!promotion_results_team_id_fkey (
        id,
        name
      )
    `)
    .eq('promotion_group_id', promotionGroupId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        No promotion history yet. Promotion/relegation will be recorded here after season rollover.
      </div>
    )
  }

  // Group by season transition
  const bySeasonTransition = results.reduce((acc: any, result: any) => {
    const key = `${result.from_season?.year} → ${result.to_season?.year}`
    if (!acc[key]) {
      acc[key] = {
        fromSeason: result.from_season,
        toSeason: result.to_season,
        movements: [],
      }
    }
    acc[key].movements.push(result)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(bySeasonTransition).map(([transition, data]: [string, any]) => (
        <div key={transition} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {transition}
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Team
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Movement
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tier Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {data.movements.map((movement: any) => {
                  const isPromoted = movement.movement_type === 'promoted'
                  const isRelegated = movement.movement_type === 'relegated'
                  const isStayed = movement.movement_type === 'stayed'

                  return (
                    <tr key={movement.id}>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                        {movement.team?.name || 'Unknown Team'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="inline-flex items-center gap-2">
                          {isPromoted && <MovementArrow direction="up" size={20} />}
                          {isRelegated && <MovementArrow direction="down" size={20} />}
                          {isStayed && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">—</span>
                          )}
                          <span className={`text-xs font-medium ${
                            isPromoted
                              ? 'text-green-600 dark:text-green-400'
                              : isRelegated
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {movement.movement_type.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          {movement.from_tier >= 1 && movement.from_tier <= 4 && (
                            <TierBadge tier={movement.from_tier as 1 | 2 | 3 | 4} size={28} />
                          )}
                          {isPromoted && <MovementArrow direction="up" size={20} />}
                          {isRelegated && <MovementArrow direction="down" size={20} />}
                          {isStayed && (
                            <span className="text-gray-400">→</span>
                          )}
                          {movement.to_tier >= 1 && movement.to_tier <= 4 && (
                            <TierBadge tier={movement.to_tier as 1 | 2 | 3 | 4} size={28} />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

