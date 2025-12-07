import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { HomeIcon, MatchupsIcon } from '@/components/icons'
import { getCurrentUserWithProfile, canAccessCommissionerTools } from '@/lib/auth-roles'
import { LeagueContextHeader } from '@/components/league-context-header'
import { LeagueNavigation } from '@/components/league-navigation'
import { CurrentWeekMatchups } from '@/components/current-week-matchups'

export default async function MatchupPage({
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

  // Fetch current week info
  const { data: currentWeek } = await supabase
    .from('league_weeks')
    .select('*')
    .eq('league_id', params.id)
    .eq('is_current', true)
    .single()

  // Fetch user's matchup for current week
  let userMatchup = null
  if (userTeam && currentWeek) {
    const { data: matchup } = await supabase
      .from('matchups')
      .select(`
        *,
        home_team:teams!matchups_home_team_id_fkey (
          id,
          name,
          logo_url,
          owner_user_id
        ),
        away_team:teams!matchups_away_team_id_fkey (
          id,
          name,
          logo_url,
          owner_user_id
        )
      `)
      .eq('league_week_id', currentWeek.id)
      .or(`home_team_id.eq.${userTeam.id},away_team_id.eq.${userTeam.id}`)
      .single()

    userMatchup = matchup
  }

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

          {/* League Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Matchup
            </h1>
            {currentWeek && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Week {currentWeek.week_number}
              </p>
            )}
          </div>

          {/* League Navigation */}
          <LeagueNavigation leagueId={params.id} isCommissioner={canAccessCommissioner} />

          {/* Matchup Content */}
          {league.status === 'active' ? (
            <>
              {userTeam ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MatchupsIcon size={24} />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Your Matchup
                    </h2>
                  </div>
                  {userMatchup ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          {userMatchup.home_team && (userMatchup.home_team as any).logo_url && (
                            <Image
                              src={(userMatchup.home_team as any).logo_url}
                              alt={(userMatchup.home_team as any).name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {(userMatchup.home_team as any)?.name || 'Home Team'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {userMatchup.home_score || '—'}
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-400 dark:text-gray-500">vs</div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {(userMatchup.away_team as any)?.name || 'Away Team'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {userMatchup.away_score || '—'}
                            </div>
                          </div>
                          {userMatchup.away_team && (userMatchup.away_team as any).logo_url && (
                            <Image
                              src={(userMatchup.away_team as any).logo_url}
                              alt={(userMatchup.away_team as any).name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Position-by-position breakdown coming soon. For now, view all matchups below.
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      No matchup scheduled for this week yet.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                  <p className="text-gray-500 dark:text-gray-400">
                    You need to join this league to view matchups.
                  </p>
                </div>
              )}

              {/* All Matchups for Current Week */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  All Matchups
                </h2>
                <CurrentWeekMatchups leagueId={params.id} currentUserId={user.id} />
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <p className="text-gray-500 dark:text-gray-400">
                Matchups will be available once the league is active.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

