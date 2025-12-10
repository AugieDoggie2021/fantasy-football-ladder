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
      <div className="flex flex-wrap gap-2 rounded-full bg-slate-900/50 p-2 shadow-md border border-slate-800/60 backdrop-blur-sm">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.isActive
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors
                ${isActive
                  ? 'bg-ladder-primary text-slate-950 shadow-md'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/70'}
              `}
            >
              <Icon size={20} className={isActive ? '' : 'opacity-70'} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
