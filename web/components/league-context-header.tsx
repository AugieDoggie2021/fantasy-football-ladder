'use client'

import { TierBadge } from '@/components/ui'

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
            <span className="font-semibold text-indigo-900 dark:text-indigo-200">Ladder:</span>
            <span className="text-indigo-700 dark:text-indigo-300">{promotionGroupName}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className="font-semibold text-indigo-900 dark:text-indigo-200">League:</span>
          <span className="text-indigo-700 dark:text-indigo-300">{leagueName}</span>
          {tier !== null && tier !== undefined && tier >= 1 && tier <= 4 && (
            <TierBadge tier={tier as 1 | 2 | 3 | 4} size={28} />
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

