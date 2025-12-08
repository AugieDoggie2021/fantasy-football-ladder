'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  addPlayerToQueue, 
  removePlayerFromQueue, 
  reorderQueue,
  getTeamQueue 
} from '@/app/actions/draft'

interface QueueItem {
  id: string
  player_id: string
  priority: number
  created_at: string
  players: {
    id: string
    full_name: string
    position: string
    nfl_team: string | null
  } | null
}

interface DraftQueueProps {
  leagueId: string
  teamId: string
  availablePlayers: Array<{
    id: string
    full_name: string
    position: string
    nfl_team: string | null
  }>
  draftedPlayerIds?: Set<string>
  isEditable?: boolean
}

/**
 * DraftQueue component displays and manages a team's draft queue
 * 
 * Features:
 * - Display queue items in priority order
 * - Drag-and-drop reordering
 * - Add/remove players
 * - Show which players are already drafted
 * - Visual indicators for queue status
 */
export function DraftQueue({
  leagueId,
  teamId,
  availablePlayers,
  draftedPlayerIds = new Set(),
  isEditable = true,
}: DraftQueueProps) {
  const router = useRouter()
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Load queue on mount and when team/league changes
  useEffect(() => {
    loadQueue()
  }, [leagueId, teamId])

  const loadQueue = async () => {
    const result = await getTeamQueue(leagueId, teamId)
    if (result.data) {
      // Sort by priority (descending - higher priority = first in queue)
      // getTeamQueue already returns items ordered by priority DESC, but we'll sort again to be safe
      const sorted = [...result.data].sort((a, b) => (b.priority || 0) - (a.priority || 0))
      setQueueItems(sorted)
    }
  }

  const handleAddPlayer = async (playerId: string) => {
    if (!isEditable) return

    setLoading(true)
    const result = await addPlayerToQueue(leagueId, teamId, playerId)
    if (result.error) {
      alert(result.error)
    } else {
      await loadQueue()
    }
    setLoading(false)
  }

  const handleRemovePlayer = async (playerId: string, playerName: string) => {
    if (!isEditable) return

    if (!confirm(`Remove ${playerName} from your queue?`)) {
      return
    }

    setLoading(true)
    const result = await removePlayerFromQueue(leagueId, teamId, playerId)
    if (result.error) {
      alert(result.error)
    } else {
      await loadQueue()
    }
    setLoading(false)
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    if (!isEditable) return
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', itemId)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isEditable || !draggedItem) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    if (!isEditable || !draggedItem) return

    e.preventDefault()
    setDragOverIndex(null)

    const draggedIndex = queueItems.findIndex(item => item.id === draggedItem)
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedItem(null)
      return
    }

    // Optimistically update UI
    const newItems = [...queueItems]
    const [removed] = newItems.splice(draggedIndex, 1)
    newItems.splice(dropIndex, 0, removed)
    setQueueItems(newItems)

    // Update order values
    const reorderedIds = newItems.map(item => item.id)

    setLoading(true)
    const result = await reorderQueue(leagueId, teamId, reorderedIds)
    if (result.error) {
      alert(result.error)
      // Revert on error
      await loadQueue()
    } else {
      // Reload to get updated order values
      await loadQueue()
    }
    setLoading(false)
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  // Filter available players (not in queue, not drafted)
  const availableForQueue = availablePlayers.filter(player => {
    const inQueue = queueItems.some(item => item.player_id === player.id)
    const isDrafted = draftedPlayerIds.has(player.id)
    return !inQueue && !isDrafted
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          Draft Queue
        </h3>
        {queueItems.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {queueItems.length} {queueItems.length === 1 ? 'player' : 'players'}
          </span>
        )}
      </div>

      {/* Queue List */}
      {queueItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Your queue is empty</p>
          <p className="text-xs mt-1">Add players to your queue for quick picks</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {queueItems.map((item, index) => {
            const isDrafted = item.players && draftedPlayerIds.has(item.players.id)
            const isDragging = draggedItem === item.id
            const isDragOver = dragOverIndex === index

            return (
              <div
                key={item.id}
                draggable={isEditable && !isDrafted}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-all
                  ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
                  ${isDragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}
                  ${isDrafted ? 'bg-gray-100 dark:bg-gray-700/50 opacity-60' : 'bg-gray-50 dark:bg-gray-700/30'}
                `}
              >
                {/* Drag Handle */}
                {isEditable && !isDrafted && (
                  <div className="text-gray-400 dark:text-gray-500">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                )}

                {/* Priority Number */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {index + 1}
                  </span>
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm ${isDrafted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      {item.players?.full_name || 'Unknown Player'}
                    </span>
                    {item.players?.position && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {item.players.position}
                      </span>
                    )}
                    {item.players?.nfl_team && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.players.nfl_team}
                      </span>
                    )}
                  </div>
                  {isDrafted && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Already drafted
                    </p>
                  )}
                </div>

                {/* Remove Button */}
                {isEditable && (
                  <button
                    onClick={() => handleRemovePlayer(item.player_id, item.players?.full_name || 'Player')}
                    disabled={loading}
                    className="flex-shrink-0 p-2 sm:p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 touch-manipulation min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 flex items-center justify-center"
                    title="Remove from queue"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Add Section */}
      {isEditable && availableForQueue.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Add
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {availableForQueue.slice(0, 10).map(player => (
              <button
                key={player.id}
                onClick={() => handleAddPlayer(player.id)}
                disabled={loading}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {player.full_name}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                  {player.position}
                </span>
                {player.nfl_team && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {player.nfl_team}
                  </span>
                )}
                <span className="ml-auto text-xs text-indigo-600 dark:text-indigo-400">
                  + Add
                </span>
              </button>
            ))}
            {availableForQueue.length > 10 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                Showing first 10. Search for more players.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

