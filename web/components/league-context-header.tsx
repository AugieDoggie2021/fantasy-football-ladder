'use client'

import { TierBadge } from '@/components/ui'
import { LeagueTrophyIcon } from '@/components/icons'

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
    <div className="mb-6 rounded-lg border border-brand-navy-800 bg-brand-surface-alt/80 p-4 shadow-md">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {seasonYear && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-nav">Season:</span>
            <span className="text-brand-navy-600">{seasonYear}</span>
          </div>
        )}
        
        {promotionGroupName && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-nav">Ladder:</span>
            <span className="text-brand-navy-600">{promotionGroupName}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <LeagueTrophyIcon size={18} />
          <span className="text-lg font-bold text-brand-nav">{leagueName}</span>
          {tier !== null && tier !== undefined && tier >= 1 && tier <= 4 && (
            <TierBadge tier={tier as 1 | 2 | 3 | 4} size={28} />
          )}
        </div>
        
        {currentWeek !== null && currentWeek !== undefined && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-nav">Week:</span>
            <span className="text-brand-navy-600">{currentWeek}</span>
          </div>
        )}
      </div>
    </div>
  )
}
