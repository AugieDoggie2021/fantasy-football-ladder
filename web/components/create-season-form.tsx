'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSeason } from '@/app/actions/seasons'

export function CreateSeasonForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createSeason(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.refresh()
      // Reset form
      e.currentTarget.reset()
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Year
        </label>
        <input
          type="number"
          id="year"
          name="year"
          required
          defaultValue={currentYear}
          min="2020"
          max="2100"
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue="preseason"
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
        >
          <option value="preseason">Preseason</option>
          <option value="drafting">Drafting</option>
          <option value="regular_season">Regular Season</option>
          <option value="playoffs">Playoffs</option>
          <option value="complete">Complete</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Create Season'}
      </button>
    </form>
  )
}

