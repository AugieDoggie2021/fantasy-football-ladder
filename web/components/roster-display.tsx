'use client'

import { useState } from 'react'
import { updateRosterSlot, dropPlayerFromRoster } from '@/app/actions/rosters'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/analytics/track'
import { AnalyticsEvents } from '@/lib/analytics/events'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from './toast-provider'

interface Player {
  id: string
  full_name: string
  position: string
  nfl_team: string | null
  bye_week: number | null
}

interface RosterEntry {
  id: string
  slot_type: string
  is_starter: boolean
  players: Player | null
}

interface RosterDisplayProps {
  startersByPosition: Record<string, RosterEntry[]>
  bench: RosterEntry[]
  teamId: string
  leagueId: string
  slotOrder: string[]
  isEditable?: boolean
}

export function RosterDisplay({
  startersByPosition,
  bench,
  teamId,
  leagueId,
  slotOrder,
  isEditable = true,
}: RosterDisplayProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [dropDialog, setDropDialog] = useState<{ isOpen: boolean; rosterId: string; playerName: string }>({
    isOpen: false,
    rosterId: '',
    playerName: '',
  })

  const handleMoveToBench = async (rosterId: string) => {
    setLoading(rosterId)
    const formData = new FormData()
    formData.append('roster_id', rosterId)
    formData.append('slot_type', 'BENCH')
    formData.append('is_starter', 'false')

    const result = await updateRosterSlot(formData)
    if (!result.error) {
      // Track lineup change
      track(AnalyticsEvents.LINEUP_CHANGED, {
        league_id: leagueId,
        team_id: teamId,
        changes_count: 1,
        positions_changed: ['BENCH'],
      })
      showToast('Player moved to bench', 'success')
      router.refresh()
    } else {
      showToast(result.error, 'error')
    }
    setLoading(null)
  }

  const handleMoveToStarter = async (rosterId: string, position: string) => {
    setLoading(rosterId)
    const formData = new FormData()
    formData.append('roster_id', rosterId)
    formData.append('slot_type', position)
    formData.append('is_starter', 'true')

    const result = await updateRosterSlot(formData)
    if (!result.error) {
      // Track lineup change
      track(AnalyticsEvents.LINEUP_CHANGED, {
        league_id: leagueId,
        team_id: teamId,
        changes_count: 1,
        positions_changed: [position],
      })
      showToast('Player moved to starting lineup', 'success')
      router.refresh()
    } else {
      showToast(result.error, 'error')
    }
    setLoading(null)
  }

  const handleDropClick = (rosterId: string, playerName: string) => {
    setDropDialog({ isOpen: true, rosterId, playerName })
  }

  const handleDropConfirm = async () => {
    const { rosterId, playerName } = dropDialog
    
    // Find the roster entry to get player_id
    const allEntries = [...Object.values(startersByPosition).flat(), ...bench]
    const entry = allEntries.find(e => e.id === rosterId)
    const playerId = entry?.players?.id

    setLoading(rosterId)
    setDropDialog({ isOpen: false, rosterId: '', playerName: '' })
    
    const formData = new FormData()
    formData.append('roster_id', rosterId)

    const result = await dropPlayerFromRoster(formData)
    if (!result.error) {
      // Track player dropped
      track(AnalyticsEvents.PLAYER_DROPPED, {
        league_id: leagueId,
        team_id: teamId,
        player_id: playerId,
      })
      showToast(`${playerName} dropped from roster`, 'success')
      router.refresh()
    } else {
      showToast(result.error, 'error')
    }
    setLoading(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          My Lineup
        </h3>
        {isEditable && (
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {editing ? 'Done Editing' : 'Edit Lineup'}
          </button>
        )}
      </div>
      
      {!isEditable && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Draft not started. Your roster will be populated after the draft.
          </p>
        </div>
      )}

      {/* Starting Lineup */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Starting Lineup
        </h4>
        <div className="space-y-3">
          {slotOrder.map(slot => {
            const players = startersByPosition[slot] || []
            const slotLabel = slot === 'FLEX' ? 'FLEX (RB/WR/TE)' : slot
            
            return (
              <div key={slot} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                  {slotLabel}:
                </div>
                <div className="flex-1 flex gap-2 flex-wrap">
                  {players.length > 0 ? (
                    players.map(entry => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {entry.players?.full_name}
                        </span>
                        {entry.players?.nfl_team && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {entry.players.nfl_team}
                          </span>
                        )}
                        {editing && isEditable && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleMoveToBench(entry.id)}
                              disabled={loading === entry.id}
                              className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                              Bench
                            </button>
                            <button
                              onClick={() => handleDropClick(entry.id, entry.players?.full_name || 'Player')}
                              disabled={loading === entry.id}
                              className="text-xs px-2 py-0.5 bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded hover:bg-red-300 disabled:opacity-50"
                            >
                              Drop
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                      {isEditable ? 'Empty' : 'Draft not started'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bench */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Bench
        </h4>
        {bench.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {bench.map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {entry.players?.full_name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {entry.players?.position}
                    {entry.players?.nfl_team && ` • ${entry.players.nfl_team}`}
                  </span>
                </div>
                {editing && isEditable && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMoveToStarter(entry.id, entry.players?.position || 'BENCH')}
                      disabled={loading === entry.id}
                      className="text-xs px-2 py-0.5 bg-green-200 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded hover:bg-green-300 disabled:opacity-50"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => handleDropClick(entry.id, entry.players?.full_name || 'Player')}
                      disabled={loading === entry.id}
                      className="text-xs px-2 py-0.5 bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded hover:bg-red-300 disabled:opacity-50"
                    >
                      Drop
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            {isEditable ? 'No players on bench' : 'Draft not started'}
          </p>
        )}
      </div>

      <ConfirmDialog
        isOpen={dropDialog.isOpen}
        onClose={() => setDropDialog({ isOpen: false, rosterId: '', playerName: '' })}
        onConfirm={handleDropConfirm}
        title="Drop Player"
        message={`Are you sure you want to drop ${dropDialog.playerName} from your roster? This action cannot be undone.`}
        confirmLabel="Drop Player"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={loading === dropDialog.rosterId}
      />
    </div>
  )
}

