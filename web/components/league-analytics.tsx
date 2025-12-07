'use client'

import { useState, useEffect } from 'react'
import { getLeagueMetrics } from '@/lib/analytics/league-metrics'

interface LeagueMetrics {
  id: string
  league_id: string
  metric_date: string
  daily_active_managers: number
  weekly_active_managers: number
  lineup_changes_count: number
  draft_completion_time_minutes: number | null
  invite_acceptance_rate: number | null
  team_participation_rate: number | null
}

interface LeagueAnalyticsProps {
  leagueId: string
}

export function LeagueAnalytics({ leagueId }: LeagueAnalyticsProps) {
  const [metrics, setMetrics] = useState<LeagueMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true)
      setError(null)

      try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30) // Last 30 days

        const result = await getLeagueMetrics(leagueId, startDate, endDate)

        if (result.error) {
          setError(result.error)
        } else {
          setMetrics(result.data || [])
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [leagueId])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-red-500 dark:text-red-400">Error: {error}</p>
      </div>
    )
  }

  if (metrics.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          League Analytics
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          No metrics available yet. Metrics will appear as league activity increases.
        </p>
      </div>
    )
  }

  // Calculate averages
  const avgDailyActive = Math.round(
    metrics.reduce((sum, m) => sum + (m.daily_active_managers || 0), 0) / metrics.length
  )
  const avgWeeklyActive = Math.round(
    metrics.reduce((sum, m) => sum + (m.weekly_active_managers || 0), 0) / metrics.length
  )
  const totalLineupChanges = metrics.reduce((sum, m) => sum + (m.lineup_changes_count || 0), 0)
  const avgInviteAcceptance = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + (m.invite_acceptance_rate || 0), 0) / metrics.length
    : null
  const avgTeamParticipation = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + (m.team_participation_rate || 0), 0) / metrics.length
    : null

  const latestMetric = metrics[metrics.length - 1]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        League Analytics (Last 30 Days)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Avg Daily Active Managers
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {avgDailyActive}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Avg Weekly Active Managers
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {avgWeeklyActive}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Total Lineup Changes
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalLineupChanges}
          </p>
        </div>

        {latestMetric.draft_completion_time_minutes && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Draft Completion Time
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {latestMetric.draft_completion_time_minutes}m
            </p>
          </div>
        )}

        {avgInviteAcceptance !== null && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Invite Acceptance Rate
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {avgInviteAcceptance.toFixed(1)}%
            </p>
          </div>
        )}

        {avgTeamParticipation !== null && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Team Participation Rate
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {avgTeamParticipation.toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* Recent Activity Timeline */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Recent Activity
        </h3>
        <div className="space-y-2">
          {metrics.slice(-7).reverse().map((metric) => (
            <div
              key={metric.id}
              className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700"
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(metric.metric_date).toLocaleDateString()}
              </span>
              <span className="text-sm text-gray-900 dark:text-white">
                {metric.daily_active_managers} active managers
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

