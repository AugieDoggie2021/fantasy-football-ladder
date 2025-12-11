'use client'

import { TierBadge } from '@/components/ui'
import { LeagueTrophyIcon } from '@/components/icons'

interface LeagueContextHeaderProps {
  seasonYear?: number
  promotionGroupName?: string
  leagueName: string
  tier?: number | null
  currentWeek?: number | null
  showLeagueName?: boolean
}

export function LeagueContextHeader({
  seasonYear,
  promotionGroupName,
  leagueName,
  tier,
  currentWeek,
  showLeagueName = true,
}: LeagueContextHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-300">
      {showLeagueName && (
        <div className="flex items-center gap-2">
          <LeagueTrophyIcon size={18} />
          <span className="text-lg font-bold text-white">{leagueName}</span>
          {tier !== null && tier !== undefined && tier >= 1 && tier <= 4 && (
            <TierBadge tier={tier as 1 | 2 | 3 | 4} size={28} />
          )}
        </div>
      )}

      {!showLeagueName && tier !== null && tier !== undefined && tier >= 1 && tier <= 4 && (
        <div className="flex items-center gap-2">
          <TierBadge tier={tier as 1 | 2 | 3 | 4} size={24} />
          <span className="text-slate-300">Tier {tier}</span>
        </div>
      )}

      {seasonYear && (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Season:</span>
          <span className="text-slate-300">{seasonYear}</span>
        </div>
      )}
      
      {promotionGroupName && (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Ladder:</span>
          <span className="text-slate-300">{promotionGroupName}</span>
        </div>
      )}
      
      {currentWeek !== null && currentWeek !== undefined && (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Week:</span>
          <span className="text-slate-300">{currentWeek}</span>
        </div>
      )}
    </div>
  )
}
