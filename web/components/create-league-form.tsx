'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLeague } from '@/app/actions/leagues'

interface Season {
  id: string
  year: number
}

interface PromotionGroup {
  id: string
  name: string
  season_id: string
  seasons: {
    id: string
    year: number
  }
}

interface CreateLeagueFormProps {
  seasons: Season[]
  promotionGroups: PromotionGroup[]
}

export function CreateLeagueForm({ seasons, promotionGroups }: CreateLeagueFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('')
  const [selectedPromotionGroupId, setSelectedPromotionGroupId] = useState<string>('')

  // Filter promotion groups by selected season
  const availablePromotionGroups = selectedSeasonId
    ? promotionGroups.filter(pg => pg.season_id === selectedSeasonId)
    : []

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createLeague(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push(`/leagues/${result.data.id}`)
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
        <label htmlFor="season_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Season *
        </label>
        <select
          id="season_id"
          name="season_id"
          required
          value={selectedSeasonId}
          onChange={(e) => {
            setSelectedSeasonId(e.target.value)
            setSelectedPromotionGroupId('')
          }}
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
        >
          <option value="">Select a season</option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.year} Season
            </option>
          ))}
        </select>
      </div>

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
          placeholder="e.g., Championship League"
        />
      </div>

      <div>
        <label htmlFor="promotion_group_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Promotion Group (Optional)
        </label>
        <select
          id="promotion_group_id"
          name="promotion_group_id"
          value={selectedPromotionGroupId}
          onChange={(e) => setSelectedPromotionGroupId(e.target.value)}
          disabled={!selectedSeasonId || availablePromotionGroups.length === 0}
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2 disabled:opacity-50"
        >
          <option value="">None (Standalone League)</option>
          {availablePromotionGroups.map((pg) => (
            <option key={pg.id} value={pg.id}>
              {pg.name}
            </option>
          ))}
        </select>
        {selectedSeasonId && availablePromotionGroups.length === 0 && (
          <p className="mt-1 text-sm text-gray-500">
            No promotion groups found for this season. You can create one first.
          </p>
        )}
      </div>

      {selectedPromotionGroupId && (
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
      )}

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

