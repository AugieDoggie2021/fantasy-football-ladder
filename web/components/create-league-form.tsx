'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLeague } from '@/app/actions/leagues'

interface Ladder {
  id: string
  name: string
  season_id: string
  seasons: {
    id: string
    year: number
  }[]
}

interface CreateLeagueFormProps {
  ladders: Ladder[]
}

export function CreateLeagueForm({ ladders }: CreateLeagueFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [leagueType, setLeagueType] = useState<'standalone' | 'ladder'>('standalone')
  const [ladderOption, setLadderOption] = useState<'new' | 'existing'>('new')
  const [selectedLadderId, setSelectedLadderId] = useState<string>('')
  const [newLadderName, setNewLadderName] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('league_type', leagueType)
    
    if (leagueType === 'ladder') {
      if (ladderOption === 'new') {
        if (!newLadderName.trim()) {
          setError('Ladder name is required when creating a new ladder')
          setLoading(false)
          return
        }
        formData.append('new_ladder_name', newLadderName)
      } else {
        if (!selectedLadderId) {
          setError('Please select a ladder')
          setLoading(false)
          return
        }
        formData.append('promotion_group_id', selectedLadderId)
      }
    }

    const result = await createLeague(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      // Show success and redirect
      router.push(`/leagues/${result.data.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          placeholder="e.g., Championship League"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          League Type *
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="league_type_radio"
              value="standalone"
              checked={leagueType === 'standalone'}
              onChange={() => {
                setLeagueType('standalone')
                setLadderOption('new')
                setSelectedLadderId('')
                setNewLadderName('')
              }}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Standalone League</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="league_type_radio"
              value="ladder"
              checked={leagueType === 'ladder'}
              onChange={() => setLeagueType('ladder')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Ladder League</span>
          </label>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {leagueType === 'standalone' 
            ? 'A standalone league operates independently.'
            : 'A ladder league is part of a multi-tier system with promotion and relegation.'}
        </p>
      </div>

      {leagueType === 'ladder' && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Ladder
            </label>
            <div className="space-y-2 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="ladder_option"
                  value="new"
                  checked={ladderOption === 'new'}
                  onChange={() => {
                    setLadderOption('new')
                    setSelectedLadderId('')
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Create a new Ladder</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="ladder_option"
                  value="existing"
                  checked={ladderOption === 'existing'}
                  onChange={() => {
                    setLadderOption('existing')
                    setNewLadderName('')
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Use an existing Ladder I own</span>
              </label>
            </div>

            {ladderOption === 'new' && (
              <div>
                <label htmlFor="new_ladder_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ladder Name *
                </label>
                <input
                  type="text"
                  id="new_ladder_name"
                  name="new_ladder_name"
                  value={newLadderName}
                  onChange={(e) => setNewLadderName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
                  placeholder="e.g., Friends & Family Ladder"
                />
              </div>
            )}

            {ladderOption === 'existing' && (
              <div>
                <label htmlFor="promotion_group_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Choose a Ladder *
                </label>
                {ladders.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You don't own any ladders yet. Create a new one above.
                  </p>
                ) : (
                  <select
                    id="promotion_group_id"
                    name="promotion_group_id"
                    value={selectedLadderId}
                    onChange={(e) => setSelectedLadderId(e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
                  >
                    <option value="">Select a ladder</option>
                    {ladders.map((ladder) => (
                      <option key={ladder.id} value={ladder.id}>
                        {ladder.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {ladderOption === 'existing' && selectedLadderId && (
              <div className="mt-4">
                <label htmlFor="tier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tier (Optional)
                </label>
                <input
                  type="number"
                  id="tier"
                  name="tier"
                  min="1"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
                  placeholder="e.g., 1, 2, 3"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  The tier determines this league's position in the ladder hierarchy.
                </p>
              </div>
            )}
          </div>
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
