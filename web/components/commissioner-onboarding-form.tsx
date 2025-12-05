'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCommissionerLeague } from '@/app/actions/commissioner'
import { useToast } from './toast-provider'

interface CommissionerOnboardingFormProps {
  activeSeasonId: string
  activeSeasonYear: number
}

export function CommissionerOnboardingForm({ activeSeasonId, activeSeasonYear }: CommissionerOnboardingFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    leagueName: '',
    leagueType: 'standalone' as 'standalone' | 'ladder',
    ladderName: '',
    maxTeams: 10,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.leagueName.trim()) {
      showToast('Please enter a league name', 'error')
      return
    }

    if (formData.leagueType === 'ladder' && !formData.ladderName.trim()) {
      showToast('Please enter a ladder name', 'error')
      return
    }

    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.leagueName.trim())
      formDataToSend.append('league_type', formData.leagueType)
      formDataToSend.append('max_teams', formData.maxTeams.toString())
      
      if (formData.leagueType === 'ladder') {
        formDataToSend.append('new_ladder_name', formData.ladderName.trim() || `${formData.leagueName.trim()} Ladder`)
      }

      const result = await createCommissionerLeague(formDataToSend)
      
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.data?.id) {
        showToast('Your league has been created! Invite players to join and set up your draft.', 'success')
        router.push(`/leagues/${result.data.id}`)
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to create league', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      <div>
        <label htmlFor="leagueName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          League Name <span className="text-red-500">*</span>
        </label>
        <input
          id="leagueName"
          type="text"
          value={formData.leagueName}
          onChange={(e) => setFormData({ ...formData, leagueName: e.target.value })}
          placeholder="My Fantasy League"
          required
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          League Type <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="leagueType"
              value="standalone"
              checked={formData.leagueType === 'standalone'}
              onChange={(e) => setFormData({ ...formData, leagueType: e.target.value as 'standalone' | 'ladder', ladderName: '' })}
              disabled={loading}
              className="mr-2"
            />
            <span className="text-gray-900 dark:text-white">Standalone League</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="leagueType"
              value="ladder"
              checked={formData.leagueType === 'ladder'}
              onChange={(e) => setFormData({ ...formData, leagueType: e.target.value as 'standalone' | 'ladder' })}
              disabled={loading}
              className="mr-2"
            />
            <span className="text-gray-900 dark:text-white">Ladder League</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Ladder leagues are part of a multi-tier system with promotion and relegation.
        </p>
      </div>

      {formData.leagueType === 'ladder' && (
        <div>
          <label htmlFor="ladderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ladder Name <span className="text-red-500">*</span>
          </label>
          <input
            id="ladderName"
            type="text"
            value={formData.ladderName}
            onChange={(e) => setFormData({ ...formData, ladderName: e.target.value })}
            placeholder={formData.leagueName ? `${formData.leagueName} Ladder` : 'My Ladder'}
            required={formData.leagueType === 'ladder'}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
        </div>
      )}

      <div>
        <label htmlFor="maxTeams" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Max Teams
        </label>
        <select
          id="maxTeams"
          value={formData.maxTeams}
          onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) })}
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
        >
          <option value={8}>8 teams</option>
          <option value={10}>10 teams</option>
          <option value={12}>12 teams</option>
        </select>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={loading || !formData.leagueName.trim()}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Creating...' : 'Create League'}
        </button>
      </div>
    </form>
  )
}

