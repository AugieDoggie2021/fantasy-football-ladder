'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeFootballIcon, StandingsIcon, MatchupsIcon, FantasyPointsIcon } from '@/components/icons'

interface LeagueNavigationProps {
  leagueId: string
}

export function LeagueNavigation({ leagueId }: LeagueNavigationProps) {
  const pathname = usePathname()
  const basePath = `/leagues/${leagueId}`
  
  const navItems = [
    {
      href: basePath,
      label: 'Home',
      icon: HomeFootballIcon,
      isActive: pathname === basePath,
    },
    {
      href: `${basePath}#standings`,
      label: 'Standings',
      icon: StandingsIcon,
      isActive: pathname === basePath && pathname.includes('#standings'),
    },
    {
      href: `${basePath}#matchups`,
      label: 'Matchups',
      icon: MatchupsIcon,
      isActive: pathname === basePath && pathname.includes('#matchups'),
    },
    {
      href: `${basePath}/players`,
      label: 'Fantasy Points',
      icon: FantasyPointsIcon,
      isActive: pathname === `${basePath}/players`,
    },
  ]

  return (
    <nav className="mb-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                ${
                  item.isActive
                    ? 'bg-kelly-base/20 text-kelly-neon border border-kelly-base/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <Icon size={20} className={item.isActive ? '' : 'opacity-70'} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

