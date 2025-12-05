import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { JoinLeagueForm } from '@/components/join-league-form'
import { MyTeamRoster } from '@/components/my-team-roster'
import { RecentTransactions } from '@/components/recent-transactions'
import { CurrentWeekMatchups } from '@/components/current-week-matchups'
import { LeagueStandings } from '@/components/league-standings'
import { CommissionerWeekControls } from '@/components/commissioner-week-controls'
import { CommissionerScoringControls } from '@/components/commissioner-scoring-controls'
import { LeagueContextHeader } from '@/components/league-context-header'
import { CommissionerToolsSection } from '@/components/commissioner-tools-section'
import { LeagueInvitePanel } from '@/components/league-invite-panel'
import { LeagueInviteList } from '@/components/league-invite-list'
import { CommissionerScoringWorkflow } from '@/components/commissioner-scoring-workflow'
import { LeagueScoringSettingsForm } from '@/components/league-scoring-settings-form'
import { getLeagueScoringConfig } from '@/app/actions/scoring-config'
import { LeagueNavigation } from '@/components/league-navigation'
import { StandingsIcon, MatchupsIcon, HomeFootballIcon } from '@/components/icons'
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

  // Fetch scoring config for commissioner
  let scoringConfig = null
  if (canAccessCommissioner) {
    const configResult = await getLeagueScoringConfig(params.id)
    scoringConfig = configResult.data || null
  }

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

  // Check if schedule exists
  const { data: hasSchedule } = await supabase
    .from('league_weeks')
    .select('id')
    .eq('league_id', params.id)
    .limit(1)
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
              <HomeFootballIcon size={20} />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {league.name}
            </h1>
            
            <LeagueContextHeader
              seasonYear={league.seasons?.[0]?.year}
              promotionGroupName={league.promotion_groups?.name}
              leagueName={league.name}
              tier={league.tier}
              currentWeek={currentWeek?.week_number || null}
            />
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

          {/* Status Message for Non-Commissioners */}
          {!canAccessCommissioner && (league.status === 'invites_open' || league.status === 'draft') && (
            <LeagueStatusMessage
              status={league.status as 'invites_open' | 'draft' | 'active'}
              isCommissioner={false}
            />
          )}

          {/* User's Team Section - Only show in active status or if user has team */}
          {(league.status === 'active' || userTeam) ? (
            userTeam ? (
              <MyTeamRoster 
                team={userTeam} 
                leagueId={params.id}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Join this League
                </h2>
                {teams && teams.length >= league.max_teams ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    This league is full ({teams.length}/{league.max_teams} teams).
                  </p>
                ) : (
                  <JoinLeagueForm leagueId={params.id} />
                )}
              </div>
            )
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <p className="text-gray-500 dark:text-gray-400">
                Lineups will be available after the draft.
              </p>
            </div>
          )}

          {/* Current Week Matchups Section - Only show in active status */}
          {league.status === 'active' && (
            <>
              <div id="matchups" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 scroll-mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <MatchupsIcon size={24} />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Matchups
                  </h2>
                </div>
                <CurrentWeekMatchups leagueId={params.id} currentUserId={user.id} />
              </div>

              {/* Standings Section */}
              <div id="standings" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 scroll-mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <StandingsIcon size={24} />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Standings
                  </h2>
                </div>
                <LeagueStandings leagueId={params.id} currentUserId={user.id} />
              </div>

              {/* Recent Activity Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Activity
                </h2>
                <RecentTransactions leagueId={params.id} />
              </div>
            </>
          )}

          {/* Teams in League Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Teams ({teams?.length || 0}/{league.max_teams})
            </h2>
            
            {teams && teams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team: any) => (
                  <div
                    key={team.id}
                    className={`p-4 border rounded-lg ${
                      team.owner_user_id === user.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {team.logo_url && (
                      <Image
                        src={team.logo_url}
                        alt={team.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover mb-2"
                      />
                    )}
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {team.name}
                      {team.owner_user_id === user.id && (
                        <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
                          (You)
                        </span>
                      )}
                    </h3>
                    {team.draft_position && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Draft Position: {team.draft_position}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No teams have joined this league yet.
              </p>
            )}
          </div>

          {/* Commissioner Controls */}
          {canAccessCommissioner && (
            <div className="mt-6 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Commissioner Tools
                </h2>
                <div className="space-y-6">
                  <CommissionerToolsSection title="Schedule & Week Management">
                    <CommissionerWeekControls
                      leagueId={params.id}
                      currentWeekNumber={currentWeek?.week_number || null}
                      hasSchedule={!!hasSchedule}
                    />
                  </CommissionerToolsSection>

                  <CommissionerToolsSection title="Scoring Rules">
                    {scoringConfig ? (
                      <LeagueScoringSettingsForm
                        leagueId={params.id}
                        currentConfig={scoringConfig}
                      />
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">
                        Loading scoring settings...
                      </p>
                    )}
                  </CommissionerToolsSection>

                  <CommissionerToolsSection title="Score Management">
                    <CommissionerScoringWorkflow
                      leagueId={params.id}
                      currentWeekNumber={currentWeek?.week_number}
                    />
                  </CommissionerToolsSection>

                  <CommissionerToolsSection title="Score Preview & Finalization">
                    <CommissionerScoringControls
                      leagueId={params.id}
                      currentWeekId={currentWeek?.id || null}
                      currentWeekNumber={currentWeek?.week_number || null}
                    />
                  </CommissionerToolsSection>

                  <CommissionerToolsSection title="Invite Players">
                    <LeagueInvitePanel leagueId={params.id} />
                    <div className="mt-6">
                      <LeagueInviteList leagueId={params.id} />
                    </div>
                  </CommissionerToolsSection>

                  <CommissionerToolsSection title="Draft Management">
                    <Link
                      href={`/leagues/${params.id}/draft`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium inline-block"
                    >
                      Manage Draft
                    </Link>
                  </CommissionerToolsSection>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

