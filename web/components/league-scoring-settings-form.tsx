'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeagueScoringConfig } from '@/app/actions/scoring-config'
import type { ScoringConfig } from '@/lib/scoring-config'
import { SCORING_PRESETS, DEFAULT_SCORING_CONFIG, validateScoringConfig } from '@/lib/scoring-config'
import { useToast } from './toast-provider'

interface LeagueScoringSettingsFormProps {
  leagueId: string
  currentConfig: ScoringConfig
}

export function LeagueScoringSettingsForm({
  leagueId,
  currentConfig,
}: LeagueScoringSettingsFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<ScoringConfig>(currentConfig)
  const [errors, setErrors] = useState<string[]>([])

  // Update local state when prop changes
  useEffect(() => {
    setConfig(currentConfig)
  }, [currentConfig])

  const handlePresetChange = (presetKey: keyof typeof SCORING_PRESETS) => {
    const preset = SCORING_PRESETS[presetKey]
    setConfig(preset.config)
    setErrors([])
  }

  const handleReset = () => {
    setConfig(DEFAULT_SCORING_CONFIG)
    setErrors([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validate
    const validationErrors = validateScoringConfig(config)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const result = await updateLeagueScoringConfig(leagueId, config)
      if (result.error) {
        setErrors([result.error])
        showToast(result.error, 'error')
      } else {
        showToast('Scoring settings updated successfully!', 'success')
        router.refresh()
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to update scoring settings'
      setErrors([errorMsg])
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Presets
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handlePresetChange('standard')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Standard (Non-PPR)
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('halfPPR')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Half PPR
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('fullPPR')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Full PPR
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Reset to Default
          </button>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-400">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Passing Settings */}
      <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Passing</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Yards per Point
            </label>
            <input
              type="number"
              min="1"
              value={config.passingYardsPerPoint}
              onChange={(e) =>
                setConfig({ ...config, passingYardsPerPoint: parseFloat(e.target.value) || 25 })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Default: 25 (1 pt per 25 yards)
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              TD Points
            </label>
            <input
              type="number"
              min="0"
              value={config.passingTdPoints}
              onChange={(e) =>
                setConfig({ ...config, passingTdPoints: parseFloat(e.target.value) || 4 })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default: 4</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Interception Points
            </label>
            <input
              type="number"
              max="0"
              value={config.interceptionPoints}
              onChange={(e) =>
                setConfig({ ...config, interceptionPoints: parseFloat(e.target.value) || -2 })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default: -2</p>
          </div>
        </div>
      </div>

      {/* Rushing Settings */}
      <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Rushing</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Yards per Point
            </label>
            <input
              type="number"
              min="1"
              value={config.rushingYardsPerPoint}
              onChange={(e) =>
                setConfig({ ...config, rushingYardsPerPoint: parseFloat(e.target.value) || 10 })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Default: 10 (1 pt per 10 yards)
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              TD Points
            </label>
            <input
              type="number"
              min="0"
              value={config.rushingTdPoints}
              onChange={(e) =>
                setConfig({ ...config, rushingTdPoints: parseFloat(e.target.value) || 6 })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default: 6</p>
          </div>
        </div>
      </div>

      {/* Receiving Settings */}
      <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Receiving</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Yards per Point
            </label>
            <input
              type="number"
              min="1"
              value={config.receivingYardsPerPoint}
              onChange={(e) =>
                setConfig({ ...config, receivingYardsPerPoint: parseFloat(e.target.value) || 10 })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Default: 10 (1 pt per 10 yards)
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              TD Points
            </label>
            <input
              type="number"
              min="0"
              value={config.receivingTdPoints}
              onChange={(e) =>
                setConfig({ ...config, receivingTdPoints: parseFloat(e.target.value) || 6 })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default: 6</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reception Points (PPR)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={config.receptionPoints}
              onChange={(e) =>
                setConfig({ ...config, receptionPoints: parseFloat(e.target.value) || 1 })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Default: 1 (Full PPR), 0.5 (Half PPR), 0 (Standard)
            </p>
          </div>
        </div>
      </div>

      {/* Bonuses */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Yardage Bonuses</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Award bonus points when players reach certain yardage thresholds
        </p>

        {/* Rushing Bonus */}
        <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rushingBonusEnabled"
              checked={config.rushingYardageBonus?.enabled || false}
              onChange={(e) =>
                setConfig({
                  ...config,
                  rushingYardageBonus: {
                    ...(config.rushingYardageBonus || { threshold: 100, bonusPoints: 3 }),
                    enabled: e.target.checked,
                  },
                })
              }
              className="rounded border-gray-300"
            />
            <label
              htmlFor="rushingBonusEnabled"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              Rushing Yardage Bonus
            </label>
          </div>
          {config.rushingYardageBonus?.enabled && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Threshold (yards)
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.rushingYardageBonus.threshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      rushingYardageBonus: {
                        ...config.rushingYardageBonus!,
                        threshold: parseFloat(e.target.value) || 100,
                      },
                    })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Default: 100 yards
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bonus Points
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.rushingYardageBonus.bonusPoints}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      rushingYardageBonus: {
                        ...config.rushingYardageBonus!,
                        bonusPoints: parseFloat(e.target.value) || 3,
                      },
                    })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default: 3 points</p>
              </div>
            </div>
          )}
        </div>

        {/* Receiving Bonus */}
        <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="receivingBonusEnabled"
              checked={config.receivingYardageBonus?.enabled || false}
              onChange={(e) =>
                setConfig({
                  ...config,
                  receivingYardageBonus: {
                    ...(config.receivingYardageBonus || { threshold: 100, bonusPoints: 3 }),
                    enabled: e.target.checked,
                  },
                })
              }
              className="rounded border-gray-300"
            />
            <label
              htmlFor="receivingBonusEnabled"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              Receiving Yardage Bonus
            </label>
          </div>
          {config.receivingYardageBonus?.enabled && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Threshold (yards)
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.receivingYardageBonus.threshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      receivingYardageBonus: {
                        ...config.receivingYardageBonus!,
                        threshold: parseFloat(e.target.value) || 100,
                      },
                    })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Default: 100 yards
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bonus Points
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.receivingYardageBonus.bonusPoints}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      receivingYardageBonus: {
                        ...config.receivingYardageBonus!,
                        bonusPoints: parseFloat(e.target.value) || 3,
                      },
                    })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default: 3 points</p>
              </div>
            </div>
          )}
        </div>

        {/* Passing Bonus */}
        <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="passingBonusEnabled"
              checked={config.passingYardageBonus?.enabled || false}
              onChange={(e) =>
                setConfig({
                  ...config,
                  passingYardageBonus: {
                    ...(config.passingYardageBonus || { threshold: 300, bonusPoints: 3 }),
                    enabled: e.target.checked,
                  },
                })
              }
              className="rounded border-gray-300"
            />
            <label
              htmlFor="passingBonusEnabled"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              Passing Yardage Bonus
            </label>
          </div>
          {config.passingYardageBonus?.enabled && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Threshold (yards)
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.passingYardageBonus.threshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      passingYardageBonus: {
                        ...config.passingYardageBonus!,
                        threshold: parseFloat(e.target.value) || 300,
                      },
                    })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Default: 300 yards
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bonus Points
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.passingYardageBonus.bonusPoints}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      passingYardageBonus: {
                        ...config.passingYardageBonus!,
                        bonusPoints: parseFloat(e.target.value) || 3,
                      },
                    })
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default: 3 points</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Scoring Settings'}
        </button>
      </div>
    </form>
  )
}

