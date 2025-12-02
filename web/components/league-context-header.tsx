'use client'

interface LeagueContextHeaderProps {
  seasonYear?: number
  promotionGroupName?: string
  leagueName: string
  tier?: number | null
  currentWeek?: number | null
}

export function LeagueContextHeader({
  seasonYear,
  promotionGroupName,
  leagueName,
  tier,
  currentWeek,
}: LeagueContextHeaderProps) {
  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {seasonYear && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-900 dark:text-indigo-200">Season:</span>
            <span className="text-indigo-700 dark:text-indigo-300">{seasonYear}</span>
          </div>
        )}
        
        {promotionGroupName && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-900 dark:text-indigo-200">Group:</span>
            <span className="text-indigo-700 dark:text-indigo-300">{promotionGroupName}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className="font-semibold text-indigo-900 dark:text-indigo-200">League:</span>
          <span className="text-indigo-700 dark:text-indigo-300">{leagueName}</span>
          {tier !== null && tier !== undefined && (
            <span className="px-2 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded text-xs font-medium">
              Tier {tier}
            </span>
          )}
        </div>
        
        {currentWeek !== null && currentWeek !== undefined && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-900 dark:text-indigo-200">Week:</span>
            <span className="text-indigo-700 dark:text-indigo-300">{currentWeek}</span>
          </div>
        )}
      </div>
    </div>
  )
}

