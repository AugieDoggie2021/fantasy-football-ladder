import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreateSeasonForm } from '@/components/create-season-form'

// Force dynamic rendering - requires authentication and database queries
export const dynamic = 'force-dynamic'

export default async function SeasonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Gate access: Only show in dev environment or for admins
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'dev'
  if (!isDev) {
    // In production, check if user is admin (for now, just show access denied)
    // TODO: Add proper admin check based on user email or role
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Season configuration is only available to administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .eq('created_by_user_id', user.id)
    .order('year', { ascending: false })

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
              Season Configuration (Admin)
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Seasons define which NFL year is active for creating leagues. The active season is automatically used when creating new leagues.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create Season
            </h2>
            <CreateSeasonForm />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              My Seasons
            </h2>
            
            {seasons && seasons.length > 0 ? (
              <div className="space-y-3">
                {seasons.map((season: any) => (
                  <div
                    key={season.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {season.year} Season
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Created {new Date(season.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {season.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                You haven&apos;t created any seasons yet. Create one above to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

