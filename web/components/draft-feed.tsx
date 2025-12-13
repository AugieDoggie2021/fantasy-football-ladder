'use client'

import { DraftFeedEvent } from '@/lib/hooks/use-draft-realtime'

interface DraftFeedPick {
  id: string
  round: number
  overall_pick: number
  team_id?: string
  player_id?: string | null
  picked_at?: string | null
  is_auto_pick?: boolean | null
  teams?: { id: string; name: string } | null
  players?: { id: string; full_name: string; position: string; nfl_team?: string | null } | null
}

interface DraftFeedProps {
  events: DraftFeedEvent[]
  picks: DraftFeedPick[]
  teams: Array<{ id: string; name: string }>
  className?: string
}

const formatTime = (value?: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

const fallbackTeamName = (teamId: string | null | undefined, teams: DraftFeedProps['teams']) => {
  if (!teamId) return 'Unknown Team'
  return teams.find(t => t.id === teamId)?.name || 'Unknown Team'
}

export function DraftFeed({ events, picks, teams, className = '' }: DraftFeedProps) {
  const pickMap = new Map<string, DraftFeedPick>()
  const playerMap = new Map<string, { full_name: string; position: string }>()

  picks.forEach(p => {
    pickMap.set(p.id, p)
    if (p.players?.id) {
      playerMap.set(p.players.id, { full_name: p.players.full_name, position: p.players.position })
    }
  })

  const feed = [...events].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime()
    const bTime = new Date(b.created_at).getTime()
    return bTime - aTime
  })

  const renderDescription = (event: DraftFeedEvent) => {
    const pick =
      (event.draft_picks?.id && (pickMap.get(event.draft_picks.id) || event.draft_picks)) ||
      (event.pick_id ? pickMap.get(event.pick_id) : null)
    const fromPayload = event.payload || {}
    const round = pick?.round ?? fromPayload.round
    const overall = pick?.overall_pick ?? fromPayload.overall_pick
    const playerId = pick?.player_id ?? fromPayload.player_id
    const playerName =
      pick?.players?.full_name || (playerId ? playerMap.get(playerId)?.full_name : undefined)
    const playerPosition =
      pick?.players?.position || (playerId ? playerMap.get(playerId)?.position : undefined)
    const teamId = pick?.team_id ?? fromPayload.team_id
    const teamName = pick?.teams?.name || fallbackTeamName(teamId, teams)

    switch (event.event_type) {
      case 'pick_made':
        return {
          title: `${teamName} drafted ${playerName || 'Player'}${playerPosition ? ` (${playerPosition})` : ''}`,
          meta: round && overall ? `Pick #${overall} • Round ${round}` : 'Pick made',
        }
      case 'auto_pick':
        return {
          title: `${teamName} auto-picked ${playerName || 'Player'}${playerPosition ? ` (${playerPosition})` : ''}`,
          meta: round && overall ? `Pick #${overall} • Round ${round}` : 'Auto-pick',
        }
      case 'start':
        return {
          title: 'Draft started',
          meta: fromPayload.started_at ? formatTime(fromPayload.started_at) : 'Commissioner started the draft',
        }
      case 'paused':
        return { title: 'Draft paused', meta: 'Timer frozen by commissioner' }
      case 'resumed':
        return { title: 'Draft resumed', meta: 'Clock is running again' }
      case 'stopped':
      case 'completed':
        return { title: 'Draft completed', meta: 'All picks are finalized' }
      case 'reset':
        return { title: 'Draft reset', meta: 'All picks cleared by commissioner' }
      case 'timer_extended':
        return { title: 'Timer extended', meta: `+${fromPayload.additional_seconds || 0}s on current pick` }
      default:
        return { title: event.event_type.replace('_', ' '), meta: '' }
    }
  }

  if (feed.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Draft Feed</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet.</p>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Draft Feed</h3>
      <div className="space-y-2 max-h-[340px] overflow-y-auto">
        {feed.map(event => {
          const description = renderDescription(event)
          const timestamp = formatTime(event.created_at)
          const badge =
            event.event_type === 'auto_pick' || event.is_auto_pick
              ? { label: 'Auto', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' }
              : event.event_type === 'paused'
              ? { label: 'Paused', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' }
              : event.event_type === 'start'
              ? { label: 'Live', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' }
              : null

          return (
            <div
              key={event.id}
              className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {event.event_type === 'pick_made' || event.event_type === 'auto_pick'
                      ? description.meta
                      : event.event_type.replace('_', ' ')}
                  </span>
                  {badge && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {description.title}
                </span>
                {description.meta && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {event.event_type === 'pick_made' || event.event_type === 'auto_pick' ? description.meta : timestamp}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{timestamp}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
