'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { previewPromotion, applyPromotion } from '@/app/actions/promotion'
import { completeSeasonForPromotionGroup } from '@/app/actions/seasons'

interface PromotionControlsProps {
  promotionGroupId: string
  seasonId: string
  seasonStatus: string
  isComplete: boolean
}

export function PromotionControls({
  promotionGroupId,
  seasonId,
  seasonStatus,
  isComplete,
}: PromotionControlsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [previewResults, setPreviewResults] = useState<any>(null)
  const [applyResults, setApplyResults] = useState<any>(null)

  const handleMarkComplete = async () => {
    if (!confirm('Mark this season as complete? This is required before running promotion.')) {
      return
    }

    setLoading('complete')
    const result = await completeSeasonForPromotionGroup(promotionGroupId)
    if (result.error) {
      alert(result.error)
    } else {
      alert('Season marked as complete!')
      router.refresh()
    }
    setLoading(null)
  }

  const handlePreview = async () => {
    setLoading('preview')
    const result = await previewPromotion(promotionGroupId, seasonId)
    if (result.error) {
      alert(result.error)
      setPreviewResults(null)
    } else {
      setPreviewResults(result.data)
    }
    setLoading(null)
  }

  const handleApply = async () => {
    if (!confirm('Apply promotion and create next season? This action cannot be undone.')) {
      return
    }

    setLoading('apply')
    const result = await applyPromotion(promotionGroupId, seasonId)
    if (result.error) {
      alert(result.error)
    } else {
      setApplyResults(result.data)
      alert('Promotion applied successfully! New season created.')
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className="space-y-6">
      {/* Mark Season Complete */}
      {!isComplete && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Season Not Complete
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            Mark the season as complete before running promotion. This will mark all leagues in the promotion group as complete.
          </p>
          <button
            onClick={handleMarkComplete}
            disabled={loading !== null}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading === 'complete' ? 'Marking...' : 'Mark Season Complete'}
          </button>
        </div>
      )}

      {/* Promotion Controls */}
      {isComplete && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            Promotion & Season Rollover
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
            Run promotion/relegation to create the next season with teams moved between tiers.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handlePreview}
              disabled={loading !== null}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading === 'preview' ? 'Previewing...' : 'Preview Promotion/Relegation'}
            </button>
            <button
              onClick={handleApply}
              disabled={loading !== null || !previewResults}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading === 'apply' ? 'Applying...' : 'Apply Promotion & Create Next Season'}
            </button>
          </div>
        </div>
      )}

      {/* Preview Results */}
      {previewResults && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Preview Results (Dry Run)
          </h4>
          {previewResults.summary && (
            <div className="mb-4 flex gap-4 text-sm">
              <span className="text-green-600 dark:text-green-400">
                Promoted: {previewResults.summary.promoted}
              </span>
              <span className="text-red-600 dark:text-red-400">
                Relegated: {previewResults.summary.relegated}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Staying: {previewResults.summary.stayed}
              </span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Team
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    From
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    To
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Movement
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {previewResults.movements?.map((movement: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                      {movement.team_name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Tier {movement.from_tier}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Tier {movement.to_tier}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        movement.movement_type === 'promoted'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : movement.movement_type === 'relegated'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {movement.movement_type.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            These are preview results. Click "Apply Promotion" to create the next season.
          </p>
        </div>
      )}

      {/* Apply Results */}
      {applyResults && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
            ✓ Promotion Applied Successfully
          </h4>
          <p className="text-sm text-green-700 dark:text-green-300 mb-3">
            New season {applyResults.new_season_year} has been created.
          </p>
          {applyResults.new_promotion_group_id && (
            <a
              href={`/promotion-groups/${applyResults.new_promotion_group_id}`}
              className="text-sm text-green-600 dark:text-green-400 hover:underline font-medium"
            >
              View New Promotion Group →
            </a>
          )}
        </div>
      )}
    </div>
  )
}

