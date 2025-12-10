import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { HomeIcon, MatchupsIcon } from '@/components/icons'
import { getCurrentUserWithProfile, canAccessCommissionerTools } from '@/lib/auth-roles'
import { LeagueContextHeader } from '@/components/league-context-header'
import { LeagueNavigation } from '@/components/league-navigation'
import { CurrentWeekMatchups } from '@/components/current-week-matchups'
import { PageEventTracker } from '@/components/analytics/page-event-tracker'
import { AnalyticsEvents } from '@/lib/analytics/events'
import { Card } from '@/components/ui/Card'

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

  const canAccessCommissioner = canAccessCommissionerTools(user.id, userWithProfile.profile, league)

  const { data: userTeam } = await supabase
    .from('teams')
    .select('*')
    .eq('league_id', params.id)
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .single()

  const { data: currentWeek } = await supabase
    .from('league_weeks')
    .select('*')
    .eq('league_id', params.id)
    .eq('is_current', true)
    .single()

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
    <div className="min-h-screen bg-gradient-to-b from-[#0B1120] to-[#111827]">
      <PageEventTracker
        event={AnalyticsEvents.MATCHUP_VIEWED}
        properties={{
          league_id: params.id,
        }}
      />
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 transition-colors"
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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold text-white">Matchup</h1>
            {currentWeek && (
              <p className="text-sm text-slate-400">
                Week {currentWeek.week_number}
              </p>
            )}
          </div>
        </div>

        <LeagueNavigation leagueId={params.id} isCommissioner={canAccessCommissioner} />

        {league.status === 'active' ? (
          <>
            {userTeam ? (
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <MatchupsIcon size={24} />
                  <h2 className="text-xl font-semibold text-white">Your Matchup</h2>
                </div>
                {userMatchup ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
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
                          <div className="font-semibold text-white">
                            {(userMatchup.home_team as any)?.name || 'Home Team'}
                          </div>
                          <div className="text-sm text-slate-400">
                            {userMatchup.home_score || '—'}
                          </div>
                        </div>
                      </div>
                      <div className="text-slate-500">vs</div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold text-white">
                            {(userMatchup.away_team as any)?.name || 'Away Team'}
                          </div>
                          <div className="text-sm text-slate-400">
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
                    <p className="text-sm text-slate-400">
                      Position-by-position breakdown coming soon. For now, view all matchups below.
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400">
                    No matchup scheduled for this week yet.
                  </p>
                )}
              </Card>
            ) : (
              <Card>
                <p className="text-slate-400">
                  You need to join this league to view matchups.
                </p>
              </Card>
            )}

            <Card>
              <h2 className="text-xl font-semibold text-white mb-4">
                All Matchups
              </h2>
              <CurrentWeekMatchups leagueId={params.id} currentUserId={user.id} />
            </Card>
          </>
        ) : (
          <Card>
            <p className="text-slate-400">
              Matchups will be available once the league is active.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

