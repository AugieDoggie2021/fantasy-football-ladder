import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { LeagueStandings } from '@/components/league-standings'
import { LeagueContextHeader } from '@/components/league-context-header'
import { LeagueNavigation } from '@/components/league-navigation'
import { HomeIcon } from '@/components/icons'
import { getCurrentUserWithProfile, canAccessCommissionerTools } from '@/lib/auth-roles'
import { CommissionerSetupPanel } from '@/components/commissioner-setup-panel'
import { LeagueStatusMessage } from '@/components/league-status-message'
import { PageEventTracker } from '@/components/analytics/page-event-tracker'
import { AnalyticsEvents } from '@/lib/analytics/events'
import { Card } from '@/components/ui/Card'
import { LeagueTestToolsPanel } from '@/components/league-test-tools-panel'
import { isTestTeamsEnabledClient } from '@/lib/feature-flags'
import { LeagueTeamsPanel } from '@/components/league-teams-panel'

const normalizeDraftStatus = (status?: string | null) => {
  if (!status) return 'pre_draft'
  if (status === 'scheduled') return 'pre_draft'
  if (status === 'in_progress') return 'live'
  return status
}

export default async function LeagueDetailPage({
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

  // Check if user can access commissioner tools
  const canAccessCommissioner = canAccessCommissionerTools(user.id, profile, league)

  if (!league) {
    notFound()
  }

  // Check if user can view this league (RLS should handle this, but we check anyway)
  const { data: canView } = await supabase
    .from('leagues')
    .select('id')
    .eq('id', params.id)
    .single()

  if (!canView) {
    redirect('/dashboard')
  }

  // Check if user already has a team in this league
  const { data: userTeam } = await supabase
    .from('teams')
    .select('*')
    .eq('league_id', params.id)
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .single()

  // Fetch all teams in this league
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      *,
      owner_user_id
    `)
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

  const teamCount = teams?.length || 0
  const commissionerUserId = league.created_by_user_id
  const leagueDraftStatus = normalizeDraftStatus(league.draft_status || 'pre_draft')
  const showDraftEntryCta = (canAccessCommissioner || !!userTeam) && (
    leagueDraftStatus === 'live' ||
    leagueDraftStatus === 'paused' ||
    leagueDraftStatus === 'completed' ||
    teamCount >= league.max_teams
  )
  const draftCtaLabel = leagueDraftStatus === 'completed' ? 'View Draft Results' : 'Enter the Draft'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#0a1020] to-[#0b1220]">
      <PageEventTracker
        event={AnalyticsEvents.PAGE_VIEWED}
        properties={{
          page_path: `/leagues/${params.id}`,
          page_title: `League: ${league.name}`,
          league_id: params.id,
        }}
      />
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-8">
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
                <h1 className="text-3xl font-display font-semibold text-white tracking-tight">{league.name}</h1>
                <p className="text-sm text-slate-400">League Home</p>
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

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {showDraftEntryCta && (
                <Card className="bg-slate-900/80 border-slate-700 shadow-md" padding="lg">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-emerald-300 font-semibold uppercase tracking-wide">
                        Draft Room Ready
                      </p>
                      <p className="text-base text-slate-200">
                        {leagueDraftStatus === 'completed'
                          ? 'Review the finalized draft board and results.'
                          : 'Head to the draft room. The clock only starts when the commissioner hits Start.'}
                      </p>
                    </div>
                    <Link
                      href={`/leagues/${params.id}/draft`}
                      className="inline-flex items-center justify-center rounded-full bg-ladder-primary text-slate-950 px-5 py-2.5 font-semibold shadow-md hover:bg-emerald-400 transition-colors whitespace-nowrap"
                    >
                      {draftCtaLabel}
                    </Link>
                  </div>
                </Card>
              )}
              {canAccessCommissioner && (league.status === 'invites_open' || league.status === 'draft') && (
                <CommissionerSetupPanel
                  leagueId={params.id}
                  leagueStatus={league.status as 'invites_open' | 'draft' | 'active'}
                  teamCount={teamCount}
                  maxTeams={league.max_teams}
                />
              )}

              <LeagueTeamsPanel
                leagueId={params.id}
                commissionerUserId={commissionerUserId}
                currentUserId={user.id}
                teams={teams || []}
                maxTeams={league.max_teams}
              />
            </div>

            <div className="space-y-6">
              {canAccessCommissioner && isTestTeamsEnabledClient() && (
                <LeagueTestToolsPanel
                  leagueId={params.id}
                  maxTeams={league.max_teams}
                  existingTeamCount={teamCount}
                  isCommissionerOrAdmin={canAccessCommissioner}
                  testToolsEnabled={isTestTeamsEnabledClient()}
                />
              )}

              {!canAccessCommissioner && !userTeam && (league.status === 'invites_open' || league.status === 'draft') && (
                <LeagueStatusMessage
                  status={league.status as 'invites_open' | 'draft' | 'active'}
                  isCommissioner={false}
                />
              )}

              <Card>
                {league.status === 'active' ? (
                  <LeagueStandings leagueId={params.id} currentUserId={user.id} />
                ) : (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-3">Standings</h2>
                    <p className="text-slate-400">
                      Standings will update once games are played. The league is currently in{' '}
                      {league.status === 'invites_open' ? 'invite' : 'draft'} phase.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
