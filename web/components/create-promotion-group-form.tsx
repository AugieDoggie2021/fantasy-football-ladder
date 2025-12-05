'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPromotionGroup } from '@/app/actions/promotion-groups'

interface Season {
  id: string
  year: number
}

export function CreatePromotionGroupForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loadingSeasons, setLoadingSeasons] = useState(true)

  useEffect(() => {
    fetch('/api/seasons')
      .then(res => res.json())
      .then(data => {
        setSeasons(data)
        setLoadingSeasons(false)
      })
      .catch(() => {
        setError('Failed to load seasons')
        setLoadingSeasons(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createPromotionGroup(formData)

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
        <label htmlFor="season_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Season *
        </label>
        {loadingSeasons ? (
          <p className="text-sm text-gray-500">Loading seasons...</p>
        ) : (
          <select
            id="season_id"
            name="season_id"
            required
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
          >
            <option value="">Select a season</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.year} Season
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Ladder Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
          placeholder="e.g., Friends & Family Ladder"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
          placeholder="Optional description"
        />
      </div>

      <button
        type="submit"
        disabled={loading || loadingSeasons}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Create Ladder'}
      </button>
    </form>
  )
}

