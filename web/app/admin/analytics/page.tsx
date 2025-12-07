import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUserWithProfile, isGlobalAdmin } from '@/lib/auth-roles'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const userWithProfile = await getCurrentUserWithProfile()

  if (!userWithProfile?.user) {
    redirect('/login')
  }

  const { profile } = userWithProfile
  const isAdmin = isGlobalAdmin(profile)

  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Get user growth metrics
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Get league creation trends (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentLeagues } = await supabase
    .from('leagues')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  // Get total leagues
  const { count: totalLeagues } = await supabase
    .from('leagues')
    .select('*', { count: 'exact', head: true })

  // Get active leagues (status = 'active')
  const { count: activeLeagues } = await supabase
    .from('leagues')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Get total teams
  const { count: totalTeams } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Get analytics events count (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { count: recentEvents } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString())

  // Get top events by type (last 7 days)
  const { data: eventTypes } = await supabase
    .from('analytics_events')
    .select('event_type')
    .gte('created_at', sevenDaysAgo.toISOString())

  const eventCounts: Record<string, number> = {}
  eventTypes?.forEach(event => {
    eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1
  })

  const topEvents = Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  // Get league metrics summary
  const { data: leagueMetrics } = await supabase
    .from('analytics_league_metrics')
    .select('league_id, daily_active_managers, weekly_active_managers, lineup_changes_count')
    .order('metric_date', { ascending: false })
    .limit(100)

  const avgDailyActive = leagueMetrics && leagueMetrics.length > 0
    ? Math.round(leagueMetrics.reduce((sum, m) => sum + (m.daily_active_managers || 0), 0) / leagueMetrics.length)
    : 0

  const avgWeeklyActive = leagueMetrics && leagueMetrics.length > 0
    ? Math.round(leagueMetrics.reduce((sum, m) => sum + (m.weekly_active_managers || 0), 0) / leagueMetrics.length)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Platform-wide analytics and metrics
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Total Users
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalUsers || 0}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Total Leagues
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalLeagues || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {activeLeagues || 0} active
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Total Teams
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalTeams || 0}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Events (7 days)
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {recentEvents || 0}
              </p>
            </div>
          </div>

          {/* League Creation Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              League Creation Trends (Last 30 Days)
            </h2>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {recentLeagues?.length || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              New leagues created in the last 30 days
            </p>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Average Daily Active Managers
              </h2>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {avgDailyActive}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Average Weekly Active Managers
              </h2>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {avgWeeklyActive}
              </p>
            </div>
          </div>

          {/* Top Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Top Events (Last 7 Days)
            </h2>
            <div className="space-y-2">
              {topEvents.length > 0 ? (
                topEvents.map(([eventType, count]) => (
                  <div
                    key={eventType}
                    className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {eventType}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No events recorded in the last 7 days
                </p>
              )}
            </div>
          </div>

          {/* PostHog Integration Note */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> For detailed user journeys, funnels, and advanced analytics, 
              visit the{' '}
              <a
                href="https://app.posthog.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                PostHog dashboard
              </a>
              . This page shows aggregated metrics from our custom analytics tables.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

