import { createClient } from '@/lib/supabase/server'

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
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                          isPromoted
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : isRelegated
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {isPromoted && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                          {isRelegated && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                          {isStayed && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                            </svg>
                          )}
                          {movement.movement_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-medium">Tier {movement.from_tier}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className={`font-medium ${
                            isPromoted
                              ? 'text-green-600 dark:text-green-400'
                              : isRelegated
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            Tier {movement.to_tier}
                          </span>
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

