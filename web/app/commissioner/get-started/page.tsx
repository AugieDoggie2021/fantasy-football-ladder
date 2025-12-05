import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommissionerOnboardingForm } from '@/components/commissioner-onboarding-form'

export const dynamic = 'force-dynamic'

export default async function CommissionerGetStartedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check for active season
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id, year, status')
    .or('status.eq.active,status.eq.preseason')
    .order('status', { ascending: true })
    .order('year', { ascending: false })
    .limit(1)
    .single()

  if (!activeSeason) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Active Season
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There is no active season configured yet. Please contact an administrator to set up a season.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Your League
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set up a league for the {activeSeason.year} season. You&apos;ll be the commissioner and can invite players to join.
          </p>
        </div>

        <CommissionerOnboardingForm activeSeasonId={activeSeason.id} activeSeasonYear={activeSeason.year} />
      </div>
    </div>
  )
}

