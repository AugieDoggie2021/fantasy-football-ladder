'use client'

import { useState, useEffect } from 'react'
import { getLeagueInvites, revokeInvite, resendInviteEmail } from '@/app/actions/invites'
import { useToast } from './toast-provider'
import { useRouter } from 'next/navigation'

interface LeagueInviteListProps {
  leagueId: string
}

interface Invite {
  id: string
  email: string | null
  token: string
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  created_at: string
  expires_at: string | null
  email_sent_at: string | null
  email_sent_count: number
  last_email_error: string | null
}

export function LeagueInviteList({ leagueId }: LeagueInviteListProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'revoked' | 'expired'>('all')

  useEffect(() => {
    loadInvites()
  }, [leagueId])

  const loadInvites = async () => {
    setLoading(true)
    try {
      const result = await getLeagueInvites(leagueId)
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.data) {
        setInvites(result.data as Invite[])
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load invites', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) {
      return
    }

    try {
      const result = await revokeInvite(inviteId)
      if (result.error) {
        showToast(result.error, 'error')
      } else {
        showToast('Invite revoked successfully', 'success')
        loadInvites()
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to revoke invite', 'error')
    }
  }

  const handleResend = async (inviteId: string) => {
    try {
      const result = await resendInviteEmail(inviteId)
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.data?.success) {
        if (result.data.devMode) {
          showToast('Email resent! (Check Inbucket in dev mode)', 'success')
        } else {
          showToast('Email resent successfully!', 'success')
        }
        loadInvites()
      } else {
        showToast(result.data?.error || 'Failed to resend email', 'error')
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to resend email', 'error')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      revoked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const filteredInvites = invites.filter((invite) => {
    if (filter === 'all') return true
    if (filter === 'expired') return isExpired(invite.expires_at)
    return invite.status === filter
  })

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-600 dark:text-gray-400">
        Loading invites...
      </div>
    )
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-4 text-gray-600 dark:text-gray-400">
        No invites yet. Generate an invite link or send an email invite above.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Sent Invites ({filteredInvites.length})
        </h4>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="space-y-2">
        {filteredInvites.map((invite) => {
          const expired = isExpired(invite.expires_at)
          const effectiveStatus = expired ? 'expired' : invite.status

          return (
            <div
              key={invite.id}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(effectiveStatus)}
                    {invite.email && (
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {invite.email}
                      </span>
                    )}
                    {!invite.email && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Link-only invite
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>Created: {formatDate(invite.created_at)}</div>
                    {invite.expires_at && (
                      <div>
                        Expires: {formatDate(invite.expires_at)}
                        {expired && <span className="text-red-600 dark:text-red-400 ml-1">(Expired)</span>}
                      </div>
                    )}
                    {invite.email_sent_at && (
                      <div>
                        Email sent: {formatDate(invite.email_sent_at)} ({invite.email_sent_count}x)
                      </div>
                    )}
                    {invite.last_email_error && (
                      <div className="text-red-600 dark:text-red-400">
                        Error: {invite.last_email_error}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {invite.email && effectiveStatus === 'pending' && !expired && (
                    <button
                      onClick={() => handleResend(invite.id)}
                      className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Resend
                    </button>
                  )}
                  {effectiveStatus === 'pending' && !expired && (
                    <button
                      onClick={() => handleRevoke(invite.id)}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

