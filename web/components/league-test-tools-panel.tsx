'use client'

import { useState, useTransition } from 'react'
import { fillLeagueWithTestTeamsAction } from '@/app/actions/test-league-tools'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// Renders commissioner-only bot-fill tools when feature flag is enabled and user is commissioner/admin.
interface LeagueTestToolsPanelProps {
  leagueId: string
  maxTeams: number
  existingTeamCount: number
  isCommissionerOrAdmin: boolean
  testToolsEnabled: boolean
}

export function LeagueTestToolsPanel({
  leagueId,
  maxTeams,
  existingTeamCount,
  isCommissionerOrAdmin,
  testToolsEnabled,
}: LeagueTestToolsPanelProps) {
  const [pending, startTransition] = useTransition()
  const [targetCount, setTargetCount] = useState<number>(maxTeams)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isCommissionerOrAdmin || !testToolsEnabled) {
    return null
  }

  const onSubmit = () => {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await fillLeagueWithTestTeamsAction(leagueId, targetCount)
      if ((result as any)?.error) {
        setError((result as any).error)
      } else {
        setMessage(
          `Created ${(result as any)?.created ?? 0} test team(s). Total teams: ${(result as any)?.totalTeams ?? targetCount}.`,
        )
      }
    })
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Test Tools (Bots)</h3>
          <p className="text-sm text-slate-400 mt-1">
            Fill this league with test teams so you can run a full draft. These teams are marked as bots and can be removed later.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] items-end">
        <div>
          <Input
            type="number"
            min={2}
            max={maxTeams}
            value={targetCount}
            onChange={(e) => setTargetCount(Number(e.target.value))}
            label="Number of teams to simulate"
            helperText={`Current teams: ${existingTeamCount} / ${maxTeams}`}
          />
        </div>
        <Button type="button" onClick={onSubmit} disabled={pending}>
          {pending ? 'Filling...' : 'Fill league with test teams'}
        </Button>
      </div>

      {message && (
        <div className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-100">
          {message}
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
