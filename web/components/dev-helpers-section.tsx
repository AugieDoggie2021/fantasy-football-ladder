'use client'

import { useState } from 'react'
import { useToast } from './toast-provider'
import { useRouter } from 'next/navigation'

export function DevHelpersSection() {
  const { showToast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSeedTestUsers = async () => {
    if (!confirm('Create test users with auto-drafted teams? This will add teams to an existing league.')) {
      return
    }

    setLoading('test-users')
    try {
      const response = await fetch('/api/seed-test-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      if (data.error) {
        showToast(data.error, 'error')
      } else {
        showToast(`Created ${data.data?.teamsCreated || 0} test user teams with auto-drafted rosters!`, 'success')
        router.refresh()
      }
    } catch (error: any) {
      showToast('Failed to seed test users', 'error')
    } finally {
      setLoading(null)
    }
  }

  const handleResetUniverse = async () => {
    if (!confirm('⚠️ WARNING: This will DELETE ALL your leagues, teams, matchups, and data! This cannot be undone. Continue?')) {
      return
    }

    if (!confirm('Are you absolutely sure? This action will delete everything you have created.')) {
      return
    }

    setLoading('reset')
    try {
      const response = await fetch('/api/reset-universe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      if (data.error) {
        showToast(data.error, 'error')
      } else {
        showToast('Universe reset complete! All data deleted.', 'success')
        router.refresh()
      }
    } catch (error: any) {
      showToast('Failed to reset universe', 'error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleSeedTestUsers}
        disabled={loading !== null}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {loading === 'test-users' ? 'Seeding...' : 'Seed Test Users + Auto Draft'}
      </button>
      
      <button
        onClick={handleResetUniverse}
        disabled={loading !== null}
        className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {loading === 'reset' ? 'Resetting...' : 'Reset Universe (Delete All Data)'}
      </button>
    </div>
  )
}

