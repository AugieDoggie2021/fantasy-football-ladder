'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteLeague } from '@/app/actions/leagues'

interface DeleteLeagueButtonProps {
  leagueId: string
  leagueName: string
}

export function DeleteLeagueButton({ leagueId, leagueName }: DeleteLeagueButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (confirmationText !== leagueName) {
      setError('League name does not match')
      return
    }

    setIsDeleting(true)
    setError(null)

    const result = await deleteLeague(leagueId)

    if (result.error) {
      setError(result.error)
      setIsDeleting(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
      >
        Delete League
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Delete League
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this league? This action cannot be undone.
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              This will permanently delete the league and all associated data including teams, matchups, and rosters.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type the league name &quot;{leagueName}&quot; to confirm:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => {
                  setConfirmationText(e.target.value)
                  setError(null)
                }}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
                placeholder={leagueName}
                disabled={isDeleting}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsOpen(false)
                  setConfirmationText('')
                  setError(null)
                }}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || confirmationText !== leagueName}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete League'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

