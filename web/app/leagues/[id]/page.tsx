import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LeagueStandings } from '@/components/league-standings'
import { LeagueContextHeader } from '@/components/league-context-header'
import { LeagueNavigation } from '@/components/league-navigation'
import { HomeIcon, SettingsGearIcon, LeagueTrophyIcon } from '@/components/icons'
import { getCurrentUserWithProfile, canAccessCommissionerTools } from '@/lib/auth-roles'
import { CommissionerSetupPanel } from '@/components/commissioner-setup-panel'
import { LeagueStatusMessage } from '@/components/league-status-message'

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

  // Determine if user is commissioner or just a manager
  const isCommissioner = league.created_by_user_id === user.id

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
            >
              <HomeIcon size={20} />
              <span>← Back to Overview</span>
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
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                League Home
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Standings
              </p>
            </div>
            {canAccessCommissioner && (
              <Link
                href={`/leagues/${params.id}/settings`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
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
          {league.status === 'active' ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <LeagueStandings leagueId={params.id} currentUserId={user.id} />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Standings
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Standings will update once games are played. The league is currently in {league.status === 'invites_open' ? 'invite' : 'draft'} phase.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

