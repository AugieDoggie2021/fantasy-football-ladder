'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptInvite } from '@/app/actions/invites'
import { useToast } from './toast-provider'
import { track } from '@/lib/analytics/track'
import { AnalyticsEvents } from '@/lib/analytics/events'

interface JoinLeagueInviteFormProps {
  token: string
  leagueId: string
}

export function JoinLeagueInviteForm({ token, leagueId }: JoinLeagueInviteFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!teamName.trim()) {
      showToast('Please enter a team name', 'error')
      return
    }

    setLoading(true)
    
    try {
      const result = await acceptInvite(token, teamName.trim())
      
      if (result.error) {
        showToast(result.error, 'error')
        if (result.data?.leagueId) {
          // User already in league - redirect after a moment
          setTimeout(() => {
            router.push(`/leagues/${result.data.leagueId}`)
          }, 2000)
        }
      } else {
        // Track league joined
        track(AnalyticsEvents.LEAGUE_JOINED, {
          league_id: leagueId,
          team_id: result.data?.teamId,
          funnel_name: 'league_join',
          funnel_step: 'league_joined',
        })
        showToast('Successfully joined the league!', 'success')
        router.push(`/leagues/${leagueId}#my-team`)
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to join league', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Team Name
        </label>
        <input
          id="teamName"
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter your team name"
          required
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading || !teamName.trim()}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Joining...' : 'Join League'}
      </button>
    </form>
  )
}

