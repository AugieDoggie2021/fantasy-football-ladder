import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { HomeFootballIcon } from '@/components/icons'
import { getCurrentUserWithProfile, canAccessCommissionerTools } from '@/lib/auth-roles'
import { DeleteLeagueButton } from '@/components/delete-league-button'

export default async function LeagueSettingsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const userWithProfile = await getCurrentUserWithProfile()

  if (!userWithProfile?.user) {
    redirect('/login')
  }

  const { user, profile } = userWithProfile

  // Fetch league
  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, created_by_user_id')
    .eq('id', params.id)
    .single()

  if (!league) {
    notFound()
  }

  // Check if user can access commissioner tools
  const canAccessCommissioner = canAccessCommissionerTools(user.id, profile, league)

  if (!canAccessCommissioner) {
    redirect(`/leagues/${params.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href={`/leagues/${params.id}`}
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
            >
              <HomeFootballIcon size={20} />
              <span>Back to League</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              League Settings
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              League Information
            </h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">League Name:</span>
                <p className="text-lg text-gray-900 dark:text-white">{league.name}</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-2 border-red-200 dark:border-red-800">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
              Danger Zone
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Once you delete a league, there is no going back. Please be certain.
            </p>
            <DeleteLeagueButton leagueId={params.id} leagueName={league.name} />
          </div>
        </div>
      </div>
    </div>
  )
}

