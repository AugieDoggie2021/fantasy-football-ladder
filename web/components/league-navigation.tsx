'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HomeFootballIcon, StandingsIcon, MatchupsIcon, FantasyPointsIcon, SettingsGearIcon } from '@/components/icons'

interface LeagueNavigationProps {
  leagueId: string
  isCommissioner?: boolean
}

// Centralized nav items configuration to prevent icon/label mismatches
const createNavItems = (
  leagueId: string, 
  pathname: string, 
  isCommissioner: boolean,
  hash: string
) => {
  const basePath = `/leagues/${leagueId}`
  
  const items = [
    {
      href: basePath,
      label: 'Home',
      icon: HomeFootballIcon,
      // Home is active when pathname exactly matches basePath and no hash
      isActive: pathname === basePath && !hash,
    },
    {
      href: `${basePath}#standings`,
      label: 'Standings',
      icon: StandingsIcon,
      // Standings is active when hash is #standings
      isActive: hash === 'standings',
    },
    {
      href: `${basePath}#matchups`,
      label: 'Matchups',
      icon: MatchupsIcon,
      // Matchups is active when hash is #matchups
      isActive: hash === 'matchups',
    },
    {
      href: `${basePath}/players`,
      label: 'Fantasy Points',
      icon: FantasyPointsIcon,
      isActive: pathname === `${basePath}/players`,
    },
  ]

  if (isCommissioner) {
    items.push({
      href: `${basePath}/settings`,
      label: 'Settings',
      icon: SettingsGearIcon,
      isActive: pathname === `${basePath}/settings`,
    })
  }

  return items
}

export function LeagueNavigation({ leagueId, isCommissioner = false }: LeagueNavigationProps) {
  const pathname = usePathname()
  const [hash, setHash] = useState('')

  useEffect(() => {
    // Get hash from URL
    const updateHash = () => {
      const currentHash = window.location.hash.slice(1) // Remove the #
      setHash(currentHash)
    }

    updateHash()
    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  const navItems = createNavItems(leagueId, pathname, isCommissioner, hash)

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

