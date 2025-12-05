import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreateLeagueForm } from '@/components/create-league-form'
import { getCurrentUserWithProfile, isGlobalAdmin } from '@/lib/auth-roles'

export default async function CreateLeaguePage() {
  const supabase = await createClient()
  const userWithProfile = await getCurrentUserWithProfile()

  if (!userWithProfile?.user) {
    redirect('/login')
  }

  const { user, profile } = userWithProfile
  const isAdmin = isGlobalAdmin(profile)

  // Check for active season (inferred automatically, but we need to validate it exists)
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id, year, status')
    .or('status.eq.active,status.eq.preseason')
    .order('status', { ascending: true })
    .order('year', { ascending: false })
    .limit(1)
    .single()

  // Fetch user's ladders (promotion groups) for the active season
  const { data: ladders } = await supabase
    .from('promotion_groups')
    .select(`
      id,
      name,
      season_id,
      seasons (
        id,
        year
      )
    `)
    .eq('created_by_user_id', user.id)
    .eq('season_id', activeSeason?.id || '')
    .order('created_at', { ascending: false })

  // Permission check: Only show "No active season" error to admins/commissioners
  // Regular users should see permission error instead
  const canCreateLeague = isAdmin || true // For now, any logged-in user can create (they become commissioner)

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
              Create League
            </h1>
            {activeSeason && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Creating league for {activeSeason.year} Season
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {!activeSeason ? (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
                {canCreateLeague ? (
                  <>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      No active season is configured yet.
                    </p>
                    {isAdmin && (
                      <Link
                        href="/seasons"
                        className="text-sm text-yellow-900 dark:text-yellow-100 underline font-medium"
                      >
                        Go to Season Configuration (Admin) to set the active season.
                      </Link>
                    )}
                    {!isAdmin && (
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Please contact the commissioner or admin.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    You don&apos;t have permission to create a league. Ask your commissioner to set one up.
                  </p>
                )}
              </div>
            ) : (
              <CreateLeagueForm ladders={ladders || []} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

