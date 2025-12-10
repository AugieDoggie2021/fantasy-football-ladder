import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { LeagueStandings } from '@/components/league-standings'
import { LeagueContextHeader } from '@/components/league-context-header'
import { LeagueNavigation } from '@/components/league-navigation'
import { HomeIcon, SettingsGearIcon } from '@/components/icons'
import { getCurrentUserWithProfile, canAccessCommissionerTools } from '@/lib/auth-roles'
import { CommissionerSetupPanel } from '@/components/commissioner-setup-panel'
import { LeagueStatusMessage } from '@/components/league-status-message'
import { PageEventTracker } from '@/components/analytics/page-event-tracker'
import { AnalyticsEvents } from '@/lib/analytics/events'
import { Card } from '@/components/ui/Card'

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

  return (
    <div className="min-h-screen bg-brand-nav text-foreground">
      <PageEventTracker
        event={AnalyticsEvents.PAGE_VIEWED}
        properties={{
          page_path: `/leagues/${params.id}`,
          page_title: `League: ${league.name}`,
          league_id: params.id,
        }}
      />
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-brand-primary-200 hover:text-brand-primary-100 transition-colors"
            >
              <HomeIcon size={20} />
              <span className="text-sm font-semibold">Back to Overview</span>
            </Link>

            <LeagueContextHeader
              seasonYear={league.seasons?.[0]?.year}
              promotionGroupName={league.promotion_groups?.name}
              leagueName={league.name}
              tier={league.tier}
              currentWeek={currentWeek?.week_number || null}
            />
          </div>

          {/* League Header with Settings Button for Commissioners */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-semibold text-white">League Home</h1>
              <p className="text-sm text-brand-navy-200/80">Standings</p>
            </div>
            {canAccessCommissioner && (
              <Link
                href={`/leagues/${params.id}/settings`}
                className="inline-flex items-center gap-2 rounded-md border border-brand-navy-200 bg-brand-surface-alt px-4 py-2 text-sm font-semibold text-brand-nav shadow-sm transition-colors hover:bg-brand-navy-100"
              >
                <SettingsGearIcon size={18} />
                <span>League Settings</span>
              </Link>
            )}
          </div>

          {/* League Navigation */}
          <LeagueNavigation leagueId={params.id} isCommissioner={canAccessCommissioner} />

          {/* Commissioner Setup Panel (for invites_open and draft status) */}
          {canAccessCommissioner && (league.status === 'invites_open' || league.status === 'draft') && (
            <CommissionerSetupPanel
              leagueId={params.id}
              leagueStatus={league.status as 'invites_open' | 'draft' | 'active'}
              teamCount={teams?.length || 0}
              maxTeams={league.max_teams}
            />
          )}

          {/* Status Message for Non-Commissioners - Only show if no team yet */}
          {!canAccessCommissioner && !userTeam && (league.status === 'invites_open' || league.status === 'draft') && (
            <LeagueStatusMessage
              status={league.status as 'invites_open' | 'draft' | 'active'}
              isCommissioner={false}
            />
          )}

          {/* Standings Section - Main content for League Home */}
          <Card className="bg-brand-surface-alt/80 border-brand-navy-800 text-brand-nav">
            {league.status === 'active' ? (
              <LeagueStandings leagueId={params.id} currentUserId={user.id} />
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-brand-nav mb-3">Standings</h2>
                <p className="text-brand-navy-500">
                  Standings will update once games are played. The league is currently in{' '}
                  {league.status === 'invites_open' ? 'invite' : 'draft'} phase.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
