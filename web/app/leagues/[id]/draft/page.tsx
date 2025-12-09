import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { DraftBoard } from '@/components/draft-board'
import { DraftControls } from '@/components/draft-controls'
import { DraftSummary } from '@/components/draft-summary'
import { PageEventTracker } from '@/components/analytics/page-event-tracker'
import { AnalyticsEvents } from '@/lib/analytics/events'

export default async function DraftPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch league info with draft status
  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, created_by_user_id, draft_status, current_pick_id, draft_settings, draft_completed_at, seasons(year)')
    .eq('id', params.id)
    .single()

  if (!league) {
    notFound()
  }

  // Check if user has access to this league (RLS should handle this, but we verify)
  // User can access if they're the commissioner OR they have a team in the league
  const { data: userTeam } = await supabase
    .from('teams')
    .select('id, name, owner_user_id')
    .eq('league_id', params.id)
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .single()

  const isCommissioner = league.created_by_user_id === user.id
  const hasTeam = !!userTeam

  if (!isCommissioner && !hasTeam) {
    redirect(`/leagues/${params.id}`)
  }

  // Fetch teams
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, draft_position')
    .eq('league_id', params.id)
    .eq('is_active', true)
    .order('draft_position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  // Fetch draft picks
  const { data: draftPicks } = await supabase
    .from('draft_picks')
    .select(`
      *,
      teams (
        id,
        name
      ),
      players (
        id,
        full_name,
        position,
        nfl_team
      )
    `)
    .eq('league_id', params.id)
    .order('overall_pick', { ascending: true })

  // Fetch all available players
  const { data: allPlayers } = await supabase
    .from('players')
    .select('*')
    .order('position', { ascending: true })
    .order('full_name', { ascending: true })

  // Get drafted player IDs to filter available players
  const draftedPlayerIds = new Set(
    draftPicks?.filter(pick => pick.player_id).map(pick => pick.player_id) || []
  )

  const availablePlayers = (allPlayers || []).filter(
    player => !draftedPlayerIds.has(player.id)
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageEventTracker
        event={AnalyticsEvents.DRAFT_BOARD_VIEWED}
        properties={{
          league_id: params.id,
          draft_status: league.draft_status || 'scheduled',
          funnel_name: 'draft',
          funnel_step: 'draft_board_viewed',
        }}
      />
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          <div className="mb-6">
            <Link
              href={`/leagues/${params.id}`}
              className="text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block"
            >
              ← Back to League
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Draft - {league.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {league.seasons?.[0]?.year} Season • Status: {league.draft_status || 'scheduled'}
              {isCommissioner && ' • Commissioner'}
            </p>
          </div>

          {/* Show Draft Summary if completed, otherwise show draft board */}
          {league.draft_status === 'completed' ? (
            <DraftSummary
              leagueId={params.id}
              leagueName={league.name}
              teams={teams || []}
              draftPicks={draftPicks || []}
              draftCompletedAt={league.draft_completed_at}
            />
          ) : (
            <>
              {/* Commissioner Draft Controls */}
              {isCommissioner && (
                <div className="mb-6">
                  <DraftControls
                    leagueId={params.id}
                    draftStatus={league.draft_status || 'scheduled'}
                    draftSettings={(league.draft_settings as {
                      timer_seconds?: number
                      auto_pick_enabled?: boolean
                      rounds?: number
                    }) || {}}
                    isCommissioner={isCommissioner}
                  />
                </div>
              )}

              <DraftBoard
                leagueId={params.id}
                teams={teams || []}
                draftPicks={draftPicks || []}
                availablePlayers={availablePlayers}
                draftStatus={league.draft_status || 'scheduled'}
                currentPickId={league.current_pick_id || null}
                userTeamId={userTeam?.id || null}
                isCommissioner={isCommissioner}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

