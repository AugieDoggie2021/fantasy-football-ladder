'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  startDraft, 
  pauseDraft, 
  resumeDraft, 
  completeDraft,
  updateDraftSettings,
  getDraftProgress,
  extendTimer,
} from '@/app/actions/draft'
import { useToast } from './toast-provider'

interface DraftControlsProps {
  leagueId: string
  draftStatus: string
  draftSettings: {
    timer_seconds?: number
    auto_pick_enabled?: boolean
    rounds?: number
  }
  isCommissioner: boolean
}

export function DraftControls({
  leagueId,
  draftStatus,
  draftSettings,
  isCommissioner,
}: DraftControlsProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    timer_seconds: draftSettings.timer_seconds || 90,
    auto_pick_enabled: draftSettings.auto_pick_enabled || false,
    rounds: draftSettings.rounds || 14,
  })

  if (!isCommissioner) {
    return null
  }

  const handleStartDraft = async () => {
    if (!confirm('Start the draft? This will begin the timer for the first pick.')) {
      return
    }

    setLoading('start')
    const result = await startDraft(leagueId)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast('Draft started!', 'success')
      router.refresh()
    }
    setLoading(null)
  }

  const handlePauseDraft = async () => {
    if (!confirm('Pause the draft? The timer will stop until you resume.')) {
      return
    }

    setLoading('pause')
    const result = await pauseDraft(leagueId)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast('Draft paused', 'info')
      router.refresh()
    }
    setLoading(null)
  }

  const handleResumeDraft = async () => {
    setLoading('resume')
    const result = await resumeDraft(leagueId)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast('Draft resumed!', 'success')
      router.refresh()
    }
    setLoading(null)
  }

  const handleCompleteDraft = async () => {
    if (!confirm('Complete the draft? This will finalize all rosters and end the draft.')) {
      return
    }

    setLoading('complete')
    const result = await completeDraft(leagueId)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast('Draft completed!', 'success')
      router.refresh()
    }
    setLoading(null)
  }

  const handleSaveSettings = async () => {
    setLoading('settings')
    const result = await updateDraftSettings(leagueId, settings)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast('Draft settings updated', 'success')
      setShowSettings(false)
      router.refresh()
    }
    setLoading(null)
  }

  const handleExtendTimer = async (seconds: number = 30) => {
    setLoading('extend')
    const result = await extendTimer(leagueId, seconds)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast(`Timer extended by ${seconds} seconds`, 'success')
      router.refresh()
    }
    setLoading(null)
  }

  // Get status badge color
  const getStatusBadgeColor = () => {
    switch (draftStatus) {
      case 'scheduled':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
      case 'in_progress':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Draft Status Badge */}
      <div className="flex items-center gap-4">
        <div className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeColor()}`}>
          {draftStatus.replace('_', ' ')}
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {showSettings ? 'Hide' : 'Show'} Settings
        </button>
      </div>

      {/* Draft Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Draft Settings
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timer Duration (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="600"
                value={settings.timer_seconds}
                onChange={(e) => setSettings({ ...settings, timer_seconds: parseInt(e.target.value) || 90 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Time allowed per pick (10-600 seconds)
              </p>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.auto_pick_enabled}
                  onChange={(e) => setSettings({ ...settings, auto_pick_enabled: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Auto-Pick
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                Automatically pick from queue or random player when timer expires
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Rounds
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.rounds}
                onChange={(e) => setSettings({ ...settings, rounds: parseInt(e.target.value) || 14 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total rounds in the draft (1-20)
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={loading === 'settings'}
              className="px-4 py-3 sm:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium touch-manipulation min-h-[44px]"
            >
              {loading === 'settings' ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Draft Control Buttons */}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
        <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">
          Draft Controls
        </h4>
        <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
          Manage the draft state and settings. Only the commissioner can use these controls.
        </p>
        <div className="flex gap-2 flex-wrap">
          {draftStatus === 'scheduled' && (
            <button
              onClick={handleStartDraft}
              disabled={loading !== null}
              className="px-4 py-3 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium touch-manipulation min-h-[44px]"
            >
              {loading === 'start' ? 'Starting...' : 'Start Draft'}
            </button>
          )}
          {draftStatus === 'in_progress' && (
            <>
              <button
                onClick={handlePauseDraft}
                disabled={loading !== null}
                className="px-4 py-3 sm:py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium touch-manipulation min-h-[44px]"
              >
                {loading === 'pause' ? 'Pausing...' : 'Pause Draft'}
              </button>
              <button
                onClick={() => handleExtendTimer(30)}
                disabled={loading !== null}
                className="px-4 py-3 sm:py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium touch-manipulation min-h-[44px]"
              >
                {loading === 'extend' ? 'Extending...' : '+30s Timer'}
              </button>
              <button
                onClick={() => handleExtendTimer(60)}
                disabled={loading !== null}
                className="px-4 py-3 sm:py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium touch-manipulation min-h-[44px]"
              >
                {loading === 'extend' ? 'Extending...' : '+60s Timer'}
              </button>
              <button
                onClick={handleCompleteDraft}
                disabled={loading !== null}
                className="px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium touch-manipulation min-h-[44px]"
              >
                {loading === 'complete' ? 'Completing...' : 'Complete Draft'}
              </button>
            </>
          )}
          {draftStatus === 'paused' && (
            <>
              <button
                onClick={handleResumeDraft}
                disabled={loading !== null}
                className="px-4 py-3 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium touch-manipulation min-h-[44px]"
              >
                {loading === 'resume' ? 'Resuming...' : 'Resume Draft'}
              </button>
              <button
                onClick={handleCompleteDraft}
                disabled={loading !== null}
                className="px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium touch-manipulation min-h-[44px]"
              >
                {loading === 'complete' ? 'Completing...' : 'Complete Draft'}
              </button>
            </>
          )}
          {draftStatus === 'completed' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Draft has been completed. All picks are finalized.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

