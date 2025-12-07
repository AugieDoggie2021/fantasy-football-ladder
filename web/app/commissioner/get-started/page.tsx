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

  // Check for active season - look for 'active' or 'preseason' status
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id, year, status')
    .or('status.eq.active,status.eq.preseason')
    .order('status', { ascending: true })
    .order('year', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Also check for any season to determine current year
  const currentYear = new Date().getFullYear()
  const { data: currentYearSeason } = await supabase
    .from('seasons')
    .select('id, year, status')
    .eq('year', currentYear)
    .order('status', { ascending: true })
    .limit(1)
    .maybeSingle()

  // Determine if we're too far into the season (after week 4, it's too late to start new leagues)
  // For now, we'll check if there's an active season. If not, suggest next year.
  const nextYear = currentYear + 1
  const isTooLateInSeason = currentYearSeason && 
    currentYearSeason.status === 'active' && 
    !activeSeason // If there's a current year season but it's active and not available for new leagues

  if (!activeSeason) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {isTooLateInSeason ? 'Season Already Underway' : 'No Active Season'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isTooLateInSeason 
              ? `We're already well into the ${currentYear} fantasy football season. It's too late to start a new league for this year, but we're already looking forward to the ${nextYear} season! Check back soon to create your league for next season.`
              : `There is no active season configured yet. ${currentYearSeason ? `The ${currentYear} season may have already started or completed. ` : ''}We're looking forward to the ${nextYear} season! Check back soon to create your league.`}
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

