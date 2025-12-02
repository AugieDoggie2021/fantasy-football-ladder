import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { DraftBoard } from '@/components/draft-board'

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

  // Fetch league info
  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, created_by_user_id, seasons(year)')
    .eq('id', params.id)
    .single()

  if (!league) {
    notFound()
  }

  // Only league creator (commissioner) can access draft page
  if (league.created_by_user_id !== user.id) {
    redirect(`/leagues/${params.id}`)
  }

  // Fetch teams
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, draft_position')
    .eq('league_id', params.id)
    .eq('is_active', true)
    .order('draft_position', { ascending: true, nullsLast: true })
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
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
              {league.seasons?.year} Season • Commissioner Draft Control
            </p>
          </div>

          <DraftBoard
            leagueId={params.id}
            teams={teams || []}
            draftPicks={draftPicks || []}
            availablePlayers={availablePlayers}
          />
        </div>
      </div>
    </div>
  )
}

