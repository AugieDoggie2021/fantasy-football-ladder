'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeagueStatus } from '@/app/actions/leagues'
import { createLeagueInvite, getLeagueInvites } from '@/app/actions/invites'

interface CommissionerSetupPanelProps {
  leagueId: string
  leagueStatus: 'invites_open' | 'draft' | 'active'
  teamCount: number
  maxTeams: number
}

interface Invite {
  id: string
  email: string | null
  token: string
  status: string
  created_at: string
  expires_at: string | null
  email_sent_at: string | null
  email_sent_count: number | null
  last_email_error: string | null
}

export function CommissionerSetupPanel({
  leagueId,
  leagueStatus,
  teamCount,
  maxTeams,
}: CommissionerSetupPanelProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const handleStartDraft = async () => {
    setIsUpdating(true)
    setError(null)

    const result = await updateLeagueStatus(leagueId, 'draft')

    if (result.error) {
      setError(result.error)
      setIsUpdating(false)
    } else {
      router.refresh()
    }
  }

  const handleStartSeason = async () => {
    setIsUpdating(true)
    setError(null)

    const result = await updateLeagueStatus(leagueId, 'active')

    if (result.error) {
      setError(result.error)
      setIsUpdating(false)
    } else {
      router.refresh()
    }
  }

  // Load invites when component mounts or league status changes
  useEffect(() => {
    const loadInvites = async () => {
      if (leagueStatus === 'invites_open') {
        setLoadingInvites(true)
        const result = await getLeagueInvites(leagueId)
        if (result.error) {
          setError(result.error)
        } else {
          setInvites(result.data || [])
        }
        setLoadingInvites(false)
      }
    }
    loadInvites()
  }, [leagueId, leagueStatus])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      setError('Please enter an email address')
      return
    }

    setSendingInvite(true)
    setError(null)
    setInviteSuccess(null)

    const result = await createLeagueInvite(leagueId, inviteEmail.trim())

    if (result.error) {
      setError(result.error)
    } else {
      setInviteEmail('')
      setInviteSuccess(
        result.data?.emailSent
          ? `Invite sent to ${inviteEmail.trim()}`
          : `Invite created! Share this link: ${window.location.origin}/join/league/${result.data?.token}`
      )
      // Reload invites
      const invitesResult = await getLeagueInvites(leagueId)
      if (!invitesResult.error) {
        setInvites(invitesResult.data || [])
      }
    }

    setSendingInvite(false)
  }

  if (leagueStatus === 'invites_open') {
    const isFull = teamCount >= maxTeams

    return (
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Step 1: Invite Managers
        </h2>
        
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Teams joined: <span className="font-semibold text-gray-900 dark:text-white">{teamCount} / {maxTeams}</span>
          </p>
          {!isFull && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Invite managers until the league is full, then start the draft.
            </p>
          )}
        </div>

        {/* Invite Form */}
        <form onSubmit={handleSendInvite} className="mb-6">
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Invite by email"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={sendingInvite}
            />
            <button
              type="submit"
              disabled={sendingInvite || !inviteEmail.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingInvite ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {inviteSuccess && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">{inviteSuccess}</p>
          </div>
        )}

        {/* Invite Status List */}
        {loadingInvites ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading invites...</p>
        ) : invites.length > 0 ? (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Invite Status
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sent At
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {invites.map((invite) => (
                    <tr key={invite.id}>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                        {invite.email || 'No email (link invite)'}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            invite.status === 'accepted'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                              : invite.status === 'expired'
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                          }`}
                        >
                          {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                        {invite.email_sent_at
                          ? new Date(invite.email_sent_at).toLocaleDateString()
                          : invite.created_at
                          ? new Date(invite.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                        {invite.created_at
                          ? new Date(invite.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No invites sent yet. Use the form above to invite managers.
          </p>
        )}

        {isFull && (
          <button
            onClick={handleStartDraft}
            disabled={isUpdating}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50"
          >
            {isUpdating ? 'Starting Draft...' : 'Start Draft'}
          </button>
        )}
      </div>
    )
  }

  if (leagueStatus === 'draft') {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Draft in Progress
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Draft flow coming soon. For now, you can manage teams manually after setting the league to active.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <button
          onClick={handleStartSeason}
          disabled={isUpdating}
          className="px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium disabled:opacity-50"
        >
          {isUpdating ? 'Starting Season...' : 'Mark Draft Complete / Start Season'}
        </button>
      </div>
    )
  }

  return null
}

