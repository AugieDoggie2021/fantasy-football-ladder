'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateScheduleForLeague } from '@/app/actions/matchups'
import { setCurrentWeek, advanceToNextWeek } from '@/app/actions/weeks'

interface CommissionerWeekControlsProps {
  leagueId: string
  currentWeekNumber: number | null
  hasSchedule: boolean
}

export function CommissionerWeekControls({
  leagueId,
  currentWeekNumber,
  hasSchedule,
}: CommissionerWeekControlsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string>('')

  const handleGenerateSchedule = async () => {
    if (!confirm('Generate schedule for this league? This will create 14 weeks of matchups.')) {
      return
    }

    setLoading('generate')
    const result = await generateScheduleForLeague(leagueId, 14)
    if (result.error) {
      alert(result.error)
    } else {
      alert('Schedule generated successfully!')
      router.refresh()
    }
    setLoading(null)
  }

  const handleSetCurrentWeek = async () => {
    const weekNum = parseInt(selectedWeek)
    if (!weekNum || weekNum < 1) {
      alert('Please select a valid week number')
      return
    }

    setLoading('set-week')
    const result = await setCurrentWeek(leagueId, weekNum)
    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
    setLoading(null)
  }

  const handleAdvanceWeek = async () => {
    if (!confirm('Advance to the next week?')) {
      return
    }

    setLoading('advance')
    const result = await advanceToNextWeek(leagueId)
    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      {!hasSchedule && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            No Schedule Generated
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            Generate a schedule to create league weeks and matchups.
          </p>
          <button
            onClick={handleGenerateSchedule}
            disabled={loading !== null}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading === 'generate' ? 'Generating...' : 'Generate Schedule (14 weeks)'}
          </button>
        </div>
      )}

      {hasSchedule && (
        <>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Current Week
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              {currentWeekNumber ? `Week ${currentWeekNumber} is currently active.` : 'No current week set.'}
            </p>
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  placeholder="Week #"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm w-24"
                />
                <button
                  onClick={handleSetCurrentWeek}
                  disabled={loading !== null || !selectedWeek}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {loading === 'set-week' ? 'Setting...' : 'Set Current Week'}
                </button>
              </div>
              {currentWeekNumber && (
                <button
                  onClick={handleAdvanceWeek}
                  disabled={loading !== null}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {loading === 'advance' ? 'Advancing...' : 'Advance to Next Week'}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

