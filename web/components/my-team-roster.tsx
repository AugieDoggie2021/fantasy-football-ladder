import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { RosterDisplay } from './roster-display'
import { TeamHelmetIcon } from '@/components/icons'

interface Team {
  id: string
  name: string
  logo_url: string | null
  draft_position: number | null
}

interface MyTeamRosterProps {
  team: Team
  leagueId: string
}

/**
 * Displays a team's lineup with starting lineup grouped by position and bench players.
 * Handles data transformation to convert Supabase array responses to expected object types.
 */
export async function MyTeamRoster({ team, leagueId }: MyTeamRosterProps) {
  const supabase = await createClient()

  // Fetch roster with player details
  const { data: roster } = await supabase
    .from('rosters')
    .select(`
      id,
      slot_type,
      is_starter,
      players (
        id,
        full_name,
        position,
        nfl_team,
        bye_week
      )
    `)
    .eq('team_id', team.id)
    .order('is_starter', { ascending: false })
    .order('slot_type', { ascending: true })

  // Transform roster data - convert players array to single object
  const transformedRoster = roster?.map(r => ({
    ...r,
    players: Array.isArray(r.players) ? (r.players[0] || null) : r.players
  })) || []

  // Group roster by slot type
  const starters = transformedRoster.filter(r => r.is_starter) || []
  const bench = transformedRoster.filter(r => !r.is_starter) || []

  // Group starters by position
  const startersByPosition: Record<string, typeof starters> = {}
  const slotOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF']
  
  slotOrder.forEach(slot => {
    startersByPosition[slot] = starters.filter(r => r.slot_type === slot)
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {team.logo_url ? (
            <Image
              src={team.logo_url}
              alt={team.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <TeamHelmetIcon size={48} />
          )}
          <div>
            <div className="flex items-center gap-2">
              <TeamHelmetIcon size={20} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {team.name}
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Draft Position: {team.draft_position ?? 'Not assigned'}
            </p>
          </div>
        </div>
        <Link
          href={`/leagues/${leagueId}/players`}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
        >
          Add Players
        </Link>
      </div>

      <RosterDisplay
        startersByPosition={startersByPosition}
        bench={bench}
        teamId={team.id}
        leagueId={leagueId}
        slotOrder={slotOrder}
      />
    </div>
  )
}

