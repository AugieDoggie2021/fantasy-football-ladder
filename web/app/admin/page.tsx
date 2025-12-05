import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SeedDemoButton } from '@/components/seed-demo-button'
import { DevHelpersSection } from '@/components/dev-helpers-section'
import { DevStatsIngestionPanel } from '@/components/dev-stats-ingestion-panel'
import { DevPlayerScoresView } from '@/components/dev-player-scores-view'
import { DevEmailPreview } from '@/components/dev-email-preview'
import { getCurrentUserWithProfile, isGlobalAdmin } from '@/lib/auth-roles'

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const userWithProfile = await getCurrentUserWithProfile()

  if (!userWithProfile?.user) {
    redirect('/login')
  }

  const { user, profile } = userWithProfile
  const isAdmin = isGlobalAdmin(profile)

  // Gate access: Only global admins can access
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This area is only available to admins.
              </p>
              <Link
                href="/dashboard"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Gate access: Only show in dev environment (additional check)
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'dev'
  if (!isDev) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Developer tools are only available in development environments.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Developer Tools
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Development-only tools for testing and data management. These tools are not available in production.
            </p>
          </div>

          <div className="space-y-6">
            {/* Demo Data */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Demo Data
              </h2>
              <SeedDemoButton />
            </div>

            {/* Testing Helpers */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Testing Helpers
              </h2>
              <DevHelpersSection />
            </div>

            {/* Stats Ingestion */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                External Stats Ingestion
              </h2>
              <DevStatsIngestionPanel />
            </div>

            {/* Player Scores View */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Player Scores Debug View
              </h2>
              <DevPlayerScoresView />
            </div>

            {/* Email Testing */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Email Testing
              </h2>
              <DevEmailPreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

