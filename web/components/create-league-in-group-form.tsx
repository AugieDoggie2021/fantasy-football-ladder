'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLeague } from '@/app/actions/leagues'

interface CreateLeagueInGroupFormProps {
  promotionGroupId: string
  seasonId: string
}

export function CreateLeagueInGroupForm({ promotionGroupId, seasonId }: CreateLeagueInGroupFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('season_id', seasonId)
    formData.append('promotion_group_id', promotionGroupId)
    
    const result = await createLeague(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.refresh()
      e.currentTarget.reset()
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          League Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
          placeholder="e.g., Tier 1 League"
        />
      </div>

      <div>
        <label htmlFor="tier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tier
        </label>
        <input
          type="number"
          id="tier"
          name="tier"
          min="1"
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
          placeholder="e.g., 1, 2, 3"
        />
      </div>

      <div>
        <label htmlFor="max_teams" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Max Teams
        </label>
        <input
          type="number"
          id="max_teams"
          name="max_teams"
          defaultValue="10"
          min="2"
          max="20"
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Create League'}
      </button>
    </form>
  )
}

