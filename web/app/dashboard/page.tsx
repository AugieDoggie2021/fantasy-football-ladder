import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import Link from 'next/link'
import { getCurrentUserWithProfile, isGlobalAdmin } from '@/lib/auth-roles'
import { getDashboardState } from '@/lib/dashboard-state'
import { PageEventTracker } from '@/components/analytics/page-event-tracker'
import { AnalyticsEvents } from '@/lib/analytics/events'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const userWithProfile = await getCurrentUserWithProfile()

  const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'dev'
  if (isDev) {
    console.log('[Dashboard] User check:', userWithProfile?.user?.email || 'not authenticated')
  }

  if (!userWithProfile?.user) {
    redirect('/login')
  }

  const { user, profile } = userWithProfile
  const isAdmin = isGlobalAdmin(profile)

  // Get dashboard state
  const dashboardState = await getDashboardState(user.id)
  const { teams, leaguesOwned, pendingInvites } = dashboardState

  // Fetch promotion groups created by user (ladder commissioner)
  const { data: myPromotionGroups } = await supabase
    .from('promotion_groups')
    .select(`
      id,
      name,
      description,
      seasons (
        id,
        year
      )
    `)
    .eq('created_by_user_id', user.id)
    .order('created_at', { ascending: false })

  const isCommissioner = isAdmin ||
    (leaguesOwned && leaguesOwned.length > 0) ||
    (myPromotionGroups && myPromotionGroups.length > 0)

  const env = process.env.NEXT_PUBLIC_APP_ENV || 'dev'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1120] to-[#111827]">
      <PageEventTracker
        event={AnalyticsEvents.PAGE_VIEWED}
        properties={{
          page_path: '/dashboard',
          page_title: 'Dashboard',
          funnel_name: 'signup',
          funnel_step: 'dashboard_viewed',
        }}
      />
      <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-semibold text-white tracking-tight">
                Fantasy Football Overview
              </h1>
              <p className="text-sm text-slate-400">Logged in as: {user.email}</p>
            </div>
          </div>

          {/* Pending Invites Section */}
          {pendingInvites.length > 0 && (
            <Card>
              <h2 className="text-xl font-display font-semibold text-white tracking-tight mb-4">
                You&apos;ve been invited to join a league
              </h2>
              <div className="space-y-3">
                {pendingInvites.map((invite: any) => {
                  const league = invite.leagues
                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 text-slate-300"
                    >
                      <div>
                        <h3 className="font-semibold text-white">
                          {league?.name}
                        </h3>
                        {league?.promotion_groups && (
                          <p className="text-sm text-slate-400">
                            Ladder: {league.promotion_groups.name}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          Invited {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/join/${invite.token}`}>View</Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Quick Actions - Always Visible */}
          <Card>
            <h2 className="text-xl font-display font-semibold text-white tracking-tight mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/commissioner/get-started"
                className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center hover:border-slate-700 hover:bg-slate-800/60 transition"
              >
                <h3 className="text-lg font-semibold text-white">Create New League</h3>
                <p className="text-sm text-slate-400">
                  Start your own league and invite managers
                </p>
                <Button variant="primary" size="md" className="mx-auto">
                  Create League
                </Button>
              </Link>
              
              <Link
                href="/join"
                className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center hover:border-slate-700 hover:bg-slate-800/60 transition"
              >
                <h3 className="text-lg font-semibold text-white">Join a League</h3>
                <p className="text-sm text-slate-400">
                  Join a league using a code or invite link
                </p>
                <Button variant="secondary" size="md" className="mx-auto">
                  Join League
                </Button>
              </Link>
            </div>
          </Card>

          {/* Leagues I Run (Commissioner) */}
          {leaguesOwned.length > 0 && (
            <Card>
              <h2 className="text-xl font-display font-semibold text-white tracking-tight mb-2">
                Leagues I Run
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Leagues where you are the commissioner
              </p>
              
              <div className="space-y-2">
                {leaguesOwned.map((league: any) => {
                  const season = league?.seasons
                  const promotionGroup = league?.promotion_groups
                  return (
                    <Link
                      key={league.id}
                      href={`/leagues/${league.id}`}
                      className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 hover:bg-slate-800/60 transition"
                    >
                      <h4 className="font-semibold text-white mb-1">
                        {league.name}
                      </h4>
                      <p className="text-sm text-slate-400">
                        {season?.year} Season
                        {league.tier && ` • Tier ${league.tier}`}
                        {promotionGroup && ` • ${promotionGroup.name} Ladder`}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Ladders I Manage (if commissioner) */}
          {isCommissioner && myPromotionGroups && myPromotionGroups.length > 0 && (
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-display font-semibold text-white tracking-tight">
                  My Ladders
                </h2>
                <Button asChild size="sm">
                  <Link href="/promotion-groups">Create Ladder</Link>
                </Button>
              </div>
              
              <div className="space-y-2">
                {myPromotionGroups.map((group: any) => (
                  <Link
                    key={group.id}
                    href={`/promotion-groups/${group.id}`}
                    className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 hover:bg-slate-800/60 transition"
                  >
                    <h4 className="font-semibold text-white mb-1">
                      {group.name}
                    </h4>
                    <p className="text-sm text-slate-400">
                      {group.seasons?.[0]?.year} Season
                    </p>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Admin Links */}
          {isAdmin && (
            <Card>
              <h2 className="text-xl font-display font-semibold text-white tracking-tight mb-4">
                Admin Tools
              </h2>
              <div className="space-y-2">
                <Link
                  href="/seasons"
                  className="block rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm text-slate-300 hover:border-slate-700 hover:bg-slate-800/60 transition"
                >
                  Manage Seasons (Admin)
                </Link>
                {env === 'dev' && (
                  <Link
                    href="/admin"
                    className="block rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200 hover:border-amber-300/50 hover:bg-amber-500/20 transition"
                  >
                    Developer Tools (Admin)
                  </Link>
                )}
              </div>
            </Card>
          )}

          {/* Leagues I'm In (Manager) - Filter out leagues where user is commissioner */}
          {(() => {
            const leaguesOwnedIds = new Set(leaguesOwned.map((l: any) => l.id))
            const managerOnlyTeams = teams.filter((team: any) => {
              const league = team.leagues
              return league && !leaguesOwnedIds.has(league.id)
            })
            
            return managerOnlyTeams.length > 0 ? (
              <Card>
                <h2 className="text-xl font-display font-semibold text-white tracking-tight mb-2">
                  Leagues I&apos;m In
                </h2>
                <p className="text-sm text-slate-400 mb-4">
                  Leagues where you are a team manager
                </p>
                
                <div className="space-y-3">
                  {managerOnlyTeams.map((team: any) => {
                    const league = team.leagues
                    const season = league?.seasons
                    const promotionGroup = league?.promotion_groups
                    
                    return (
                      <Link
                        key={team.id}
                        href={`/leagues/${league.id}`}
                        className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 hover:bg-slate-800/60 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-white">
                              {league.name}
                            </h4>
                            <p className="text-sm text-slate-400">
                              {season?.year} Season
                              {league.tier && ` • Tier ${league.tier}`}
                              {promotionGroup && ` • ${promotionGroup.name} Ladder`}
                            </p>
                            <p className="text-sm text-slate-400">
                              Your Team: {team.name}
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                            {league.status}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </Card>
            ) : null
          })()}

          <div className="mt-8 pt-8 border-t border-slate-800">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  )
}

