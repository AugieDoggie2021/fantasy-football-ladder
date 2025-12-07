'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LeagueTrophyIcon, HomeFootballIcon, MatchupsIcon, StandingsIcon } from '@/components/icons'

interface LeagueNavigationProps {
  leagueId: string
  isCommissioner?: boolean
}

// Centralized nav items configuration to prevent icon/label mismatches
// League navigation: League Home, Team, Matchup, Players (in this order, left to right)
const createNavItems = (
  leagueId: string, 
  pathname: string, 
  isCommissioner: boolean
) => {
  const basePath = `/leagues/${leagueId}`
  
  const items = [
    {
      href: basePath,
      label: 'League Home',
      icon: LeagueTrophyIcon,
      // League Home is active when pathname exactly matches basePath
      isActive: pathname === basePath,
    },
    {
      href: `${basePath}/team`,
      label: 'Team',
      icon: HomeFootballIcon,
      isActive: pathname === `${basePath}/team`,
    },
    {
      href: `${basePath}/matchup`,
      label: 'Matchup',
      icon: MatchupsIcon,
      isActive: pathname === `${basePath}/matchup`,
    },
    {
      href: `${basePath}/players`,
      label: 'Players',
      icon: StandingsIcon,
      isActive: pathname === `${basePath}/players`,
    },
  ]

  return items
}

export function LeagueNavigation({ leagueId, isCommissioner = false }: LeagueNavigationProps) {
  const pathname = usePathname()
  const navItems = createNavItems(leagueId, pathname, isCommissioner)

  return (
    <nav className="mb-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.isActive
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                ${
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <Icon size={20} className={isActive ? '' : 'opacity-70'} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

