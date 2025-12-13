import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { HomeIcon } from '@/components/icons'
import { getCurrentUserWithProfile, canAccessCommissionerTools } from '@/lib/auth-roles'
import { DeleteLeagueButton } from '@/components/delete-league-button'
import { LeagueContextHeader } from '@/components/league-context-header'
import { Card } from '@/components/ui/Card'
import { LeagueNavigation } from '@/components/league-navigation'

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

  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, created_by_user_id')
    .eq('id', params.id)
    .single()

  if (!league) {
    notFound()
  }

  const canAccessCommissioner = canAccessCommissionerTools(user.id, profile, league)

  if (!canAccessCommissioner) {
    redirect(`/leagues/${params.id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#0a1020] to-[#0b1220]">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 transition-colors"
          >
            <HomeIcon size={20} />
            <span className="text-sm font-semibold">Back to Overview</span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-display font-semibold text-white">{league.name}</h1>
            <p className="text-sm text-slate-400">League Settings</p>
            <LeagueContextHeader
              seasonYear={undefined}
              promotionGroupName={undefined}
              leagueName={league.name}
              tier={undefined}
              currentWeek={null}
              showLeagueName={false}
            />
          </div>
        </div>

        <LeagueNavigation leagueId={params.id} isCommissioner={canAccessCommissioner} />

        <Card>
          <h2 className="text-xl font-display font-semibold text-white mb-4">League Information</h2>
          <div className="space-y-2 text-slate-300">
            <div>
              <p className="text-sm text-slate-400">League Name</p>
              <p className="text-lg font-semibold text-white">{league.name}</p>
            </div>
          </div>
        </Card>

        <Card className="border-red-500/40 bg-red-900/20">
          <h2 className="text-xl font-display font-semibold text-white mb-3">Danger Zone</h2>
          <p className="text-sm text-slate-300 mb-4">
            Once you delete a league, there is no going back. Please be certain.
          </p>
          <DeleteLeagueButton leagueId={params.id} leagueName={league.name} />
        </Card>
      </div>
    </div>
  )
}
