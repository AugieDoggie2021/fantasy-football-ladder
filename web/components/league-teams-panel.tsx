'use client'

import { useMemo, useState, useTransition } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { createCommissionerTeam } from '@/app/actions/teams'
import { useRouter } from 'next/navigation'

interface LeagueTeam {
  id: string
  name: string
  is_bot?: boolean | null
  owner_user_id?: string | null
  created_at?: string
}

interface LeagueTeamsPanelProps {
  leagueId: string
  commissionerUserId: string
  currentUserId: string
  teams: LeagueTeam[]
  maxTeams: number
}

export function LeagueTeamsPanel({
  leagueId,
  commissionerUserId,
  currentUserId,
  teams,
  maxTeams,
}: LeagueTeamsPanelProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { sortedTeams, hasCommissionerTeam, currentUserHasTeam } = useMemo(() => {
    const commissionerTeam = teams.find((t) => t.owner_user_id === commissionerUserId && !t.is_bot)
    const currentUserTeam = teams.find((t) => t.owner_user_id === currentUserId && !t.is_bot)
    const realTeams = teams.filter((t) => !t.is_bot)
    const botTeams = teams.filter((t) => t.is_bot)

    const otherReal = realTeams
      .filter((t) => t.owner_user_id !== commissionerUserId)
      .sort((a, b) => a.name.localeCompare(b.name))
    const botsSorted = botTeams.sort((a, b) => a.name.localeCompare(b.name))

    const ordered = [
      ...(commissionerTeam ? [commissionerTeam] : []),
      ...otherReal,
      ...botsSorted,
    ]

    return {
      sortedTeams: ordered,
      hasCommissionerTeam: !!commissionerTeam,
      currentUserHasTeam: !!currentUserTeam,
    }
  }, [teams, commissionerUserId, currentUserId])

  const canCreateCommissionerTeam =
    commissionerUserId === currentUserId &&
    !hasCommissionerTeam &&
    teams.length < maxTeams

  const handleCreateCommissionerTeam = () => {
    setError(null)
    startTransition(async () => {
      const result = await createCommissionerTeam(leagueId)
      if ((result as any)?.error) {
        setError((result as any).error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-display font-semibold text-white">Teams</h3>
          <p className="text-sm text-slate-400">
            {teams.length} / {maxTeams} joined
          </p>
        </div>
        {canCreateCommissionerTeam && (
          <Button size="sm" onClick={handleCreateCommissionerTeam} disabled={pending}>
            {pending ? 'Creating...' : 'Create My Team'}
          </Button>
        )}
      </div>

      {sortedTeams.length === 0 ? (
        <p className="text-sm text-slate-400">No teams yet. Invite managers or create your own team.</p>
      ) : (
        <div className="space-y-3">
          {sortedTeams.map((team) => {
            const isCommissionerTeam = team.owner_user_id === commissionerUserId && !team.is_bot
            const isCurrentUserTeam = team.owner_user_id === currentUserId && !team.is_bot
            return (
              <div
                key={team.id}
                className="flex items-center justify-between rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-[0_12px_30px_rgba(0,0,0,0.55)] p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{team.name}</span>
                    {team.is_bot ? <Badge variant="neutral">Bot</Badge> : null}
                    {isCommissionerTeam ? <Badge variant="accent">Commissioner</Badge> : null}
                    {isCurrentUserTeam && !team.is_bot ? <Badge variant="primary">You</Badge> : null}
                  </div>
                  <p className="text-xs text-slate-400">
                    {team.is_bot ? 'Simulated team' : 'Managed team'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-md border border-status-error/40 bg-red-900/30 px-4 py-3 text-sm text-status-error">
          {error}
        </div>
      )}
    </Card>
  )
}
