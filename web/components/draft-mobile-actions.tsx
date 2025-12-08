'use client'

import { useState } from 'react'
import { DraftQueue } from './draft-queue'
import { DraftPlayerList } from './draft-player-list'

interface Player {
  id: string
  full_name: string
  position: string
  nfl_team: string | null
}

interface DraftMobileActionsProps {
  leagueId: string
  teamId: string | null
  availablePlayers: Player[]
  draftedPlayerIds: Set<string>
  isUserTurn: boolean
  isCommissioner: boolean
  onSelectPlayer: (playerId: string) => void
  currentPickId: string | null
}

/**
 * DraftMobileActions - Simplified mobile draft experience
 * 
 * Features:
 * - Floating action buttons for quick access
 * - Bottom sheet for queue and player selection
 * - Quick pick from queue
 * - Simplified UI for mobile devices
 */
export function DraftMobileActions({
  leagueId,
  teamId,
  availablePlayers,
  draftedPlayerIds,
  isUserTurn,
  isCommissioner,
  onSelectPlayer,
  currentPickId,
}: DraftMobileActionsProps) {
  const [showQueue, setShowQueue] = useState(false)
  const [showPlayerList, setShowPlayerList] = useState(false)
  const [activeSheet, setActiveSheet] = useState<'queue' | 'players' | null>(null)

  const canMakePick = isUserTurn || isCommissioner

  if (!teamId) {
    return null
  }

  const handleQuickPick = () => {
    // Show queue first, then player list if queue is empty
    setShowQueue(true)
    setActiveSheet('queue')
  }

  const handleCloseSheet = () => {
    setShowQueue(false)
    setShowPlayerList(false)
    setActiveSheet(null)
  }

  return (
    <>
      {/* Mobile Floating Action Buttons - Only show on mobile */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40 flex flex-col gap-3">
        {/* Quick Pick Button - Only show when it's user's turn */}
        {canMakePick && currentPickId && (
          <button
            onClick={handleQuickPick}
            className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center touch-manipulation"
            title="Quick Pick"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        )}

        {/* Queue Button */}
        <button
          onClick={() => {
            setShowQueue(true)
            setActiveSheet('queue')
          }}
          className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center touch-manipulation"
          title="View Queue"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Player List Button */}
        <button
          onClick={() => {
            setShowPlayerList(true)
            setActiveSheet('players')
          }}
          className="w-14 h-14 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition-all flex items-center justify-center touch-manipulation"
          title="Browse Players"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Bottom Sheet Overlay */}
      {(showQueue || showPlayerList) && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={handleCloseSheet}
        />
      )}

      {/* Queue Bottom Sheet */}
      {showQueue && activeSheet === 'queue' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col animate-slide-up">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Draft Queue
            </h3>
            <button
              onClick={handleCloseSheet}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          {/* Queue Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <DraftQueue
              leagueId={leagueId}
              teamId={teamId}
              availablePlayers={availablePlayers}
              draftedPlayerIds={draftedPlayerIds}
              isEditable={canMakePick}
            />
          </div>

          {/* Quick Pick from Queue Button */}
          {canMakePick && currentPickId && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => {
                  // This would trigger auto-pick from queue
                  // For now, just close and show player list
                  handleCloseSheet()
                  setShowPlayerList(true)
                  setActiveSheet('players')
                }}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors touch-manipulation font-medium"
              >
                Pick from Queue
              </button>
            </div>
          )}
        </div>
      )}

      {/* Player List Bottom Sheet */}
      {showPlayerList && activeSheet === 'players' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-in">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Player
            </h3>
            <button
              onClick={handleCloseSheet}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          {/* Player List Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <DraftPlayerList
              players={availablePlayers}
              leagueId={leagueId}
              teamId={teamId}
              onSelectPlayer={(playerId) => {
                onSelectPlayer(playerId)
                handleCloseSheet()
              }}
              draftedPlayerIds={draftedPlayerIds}
            />
          </div>
        </div>
      )}
    </>
  )
}

