import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { HomeIcon } from '@/components/icons'
import { getCurrentUserWithProfile, canAccessCommissionerTools } from '@/lib/auth-roles'
import { MyTeamRoster } from '@/components/my-team-roster'
import { LeagueContextHeader } from '@/components/league-context-header'
import { LeagueNavigation } from '@/components/league-navigation'
import { Card } from '@/components/ui/Card'
import { LeagueTeamsPanel } from '@/components/league-teams-panel'

export default async function TeamPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const userWithProfile = await getCurrentUserWithProfile()

  if (!userWithProfile?.user) {
    redirect('/login')
  }

  const { user } = userWithProfile

  // Fetch league with related data
  const { data: league } = await supabase
    .from('leagues')
    .select(`
      *,
      seasons (
        id,
        year
      ),
      promotion_groups (
        id,
        name
      )
    `)
    .eq('id', params.id)
    .single()

  if (!league) {
    notFound()
  }

  // Check if user can access commissioner tools
  const canAccessCommissioner = canAccessCommissionerTools(user.id, userWithProfile.profile, league)

  // Check if user has a team in this league
  const { data: userTeam } = await supabase
    .from('teams')
    .select('*')
    .eq('league_id', params.id)
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .single()

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, owner_user_id, is_bot, created_at, is_active')
    .eq('league_id', params.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // Fetch current week info
  const { data: currentWeek } = await supabase
    .from('league_weeks')
    .select('*')
    .eq('league_id', params.id)
    .eq('is_current', true)
    .single()

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

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-display font-semibold text-white">{league.name}</h1>
              <p className="text-sm text-slate-400">Team</p>
              <LeagueContextHeader
                seasonYear={league.seasons?.[0]?.year}
                promotionGroupName={league.promotion_groups?.name}
                leagueName={league.name}
                tier={league.tier}
                currentWeek={currentWeek?.week_number || null}
                showLeagueName={false}
              />
            </div>
          </div>
        </div>

        <LeagueNavigation leagueId={params.id} isCommissioner={canAccessCommissioner} />

        <div className="space-y-6">
          {userTeam ? (
            <MyTeamRoster 
              team={userTeam} 
              leagueId={params.id}
              leagueStatus={league.status}
            />
          ) : (
            <Card>
              <h2 className="text-xl font-semibold text-white mb-3">
                Join this League
              </h2>
              <p className="text-slate-400">
                You need to join this league before you can manage your team.
              </p>
              {canAccessCommissioner && (
                <p className="text-sm text-slate-400 mt-2">
                  As commissioner, you can create your team below to appear in drafts.
                </p>
              )}
            </Card>
          )}

          <LeagueTeamsPanel
            leagueId={params.id}
            commissionerUserId={league.created_by_user_id}
            currentUserId={user.id}
            teams={teams || []}
            maxTeams={league.max_teams}
          />
        </div>
      </div>
    </div>
  )
}
