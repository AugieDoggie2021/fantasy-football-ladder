'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeagueStatus } from '@/app/actions/leagues'
import { createLeagueInvite, getLeagueInvites, resendInviteEmail } from '@/app/actions/invites'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

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
  team: {
    id: string
    name: string
    created_at: string
  } | null
}

interface Team {
  id: string
  name: string
  owner_user_id: string
  created_at: string
  users: {
    email: string
  } | Array<{ email: string }> | null
}

interface InvitesData {
  invites: Invite[]
  teams: Team[]
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : '—')

const getStatusVariant = (status: Invite['status']) => {
  switch (status) {
    case 'accepted':
      return 'success'
    case 'revoked':
      return 'destructive'
    case 'expired':
      return 'neutral'
    default:
      return 'warning'
  }
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
  const [invitesData, setInvitesData] = useState<InvitesData | null>(null)
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null)

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

  useEffect(() => {
    const loadInvites = async () => {
      if (leagueStatus === 'invites_open') {
        setLoadingInvites(true)
        setError(null)
        const result = await getLeagueInvites(leagueId)
        if (result.error) {
          setError(result.error)
          setInvitesData(null)
        } else {
          setInvitesData(result.data as InvitesData)
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
      const inviteEmailValue = inviteEmail.trim()
      setInviteEmail('')
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fantasyladder.app'

      if (result.data?.emailSent && !result.data?.devMode) {
        setInviteSuccess(`Invite sent to ${inviteEmailValue}`)
      } else if (result.data?.emailError || result.data?.devMode) {
        const errorMsg = result.data?.emailError || 'Email service not configured'
        setError(`Invite created but email was not sent: ${errorMsg}. Share this link instead: ${baseUrl}/join/${result.data?.token}`)
      } else {
        setInviteSuccess(`Invite created! Share this link: ${baseUrl}/join/${result.data?.token}`)
      }

      const invitesResult = await getLeagueInvites(leagueId)
      if (!invitesResult.error) {
        setInvitesData(invitesResult.data as InvitesData)
      }
    }

    setSendingInvite(false)
  }

  const handleResendInvite = async (invite: Invite) => {
    if (!invite.email) {
      setError('This invite does not have an email address to resend.')
      return
    }

    setResendingInviteId(invite.id)
    setError(null)
    setInviteSuccess(null)

    const result = await resendInviteEmail(invite.id)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fantasyladder.app'

    if (result.error) {
      setError(result.error)
    } else if (result.data?.error) {
      setError(result.data.error)
    } else {
      const inviteLink = `${baseUrl}/join/${invite.token}`
      if (result.data?.devMode) {
        setInviteSuccess(`Email service not configured (dev mode). Copy this invite link to share: ${inviteLink}`)
      } else {
        setInviteSuccess(`Invite re-sent to ${invite.email}`)
      }

      const invitesResult = await getLeagueInvites(leagueId)
      if (!invitesResult.error) {
        setInvitesData(invitesResult.data as InvitesData)
      }
    }

    setResendingInviteId(null)
  }

  if (leagueStatus === 'invites_open') {
    const isFull = teamCount >= maxTeams

    return (
      <Card className="bg-brand-surface-alt/90 border-brand-navy-800 text-brand-nav shadow-lg" padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-semibold text-brand-nav">Step 1: Invite Managers</h2>
            <p className="text-sm text-brand-navy-500 mt-1">
              Teams joined:{' '}
              <span className="font-semibold text-brand-nav">
                {teamCount} / {maxTeams}
              </span>
            </p>
            {!isFull && (
              <p className="text-sm text-brand-navy-500">
                Invite managers until the league is full, then start the draft.
              </p>
            )}
          </div>

          {isFull && (
            <Button
              onClick={handleStartDraft}
              disabled={isUpdating}
              variant="primary"
              size="md"
              className="whitespace-nowrap"
            >
              {isUpdating ? 'Starting Draft...' : 'Start Draft'}
            </Button>
          )}
        </div>

        <form onSubmit={handleSendInvite} className="mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="manager@team.com"
              aria-label="Invite by email"
              disabled={sendingInvite}
              className="bg-white"
            />
            <Button
              type="submit"
              disabled={sendingInvite || !inviteEmail.trim()}
              variant="primary"
              size="md"
              className="md:w-auto"
            >
              {sendingInvite ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </form>

        {error && (
          <div className="mb-4 rounded-md border border-status-error/40 bg-red-50 px-4 py-3 text-sm text-status-error">
            {error}
          </div>
        )}

        {inviteSuccess && (
          <div className="mb-4 rounded-md border border-brand-primary-200 bg-brand-primary-50 px-4 py-3 text-sm text-brand-nav">
            {inviteSuccess}
          </div>
        )}

        {loadingInvites ? (
          <p className="text-sm text-brand-navy-500">Loading invites...</p>
        ) : invitesData ? (
          <div className="space-y-6">
            {invitesData.invites.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-brand-nav">Invites Sent</h3>
                  <p className="text-sm text-brand-navy-500">
                    Email sends count the last sent email, not attempts.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-brand-navy-500 tracking-wide border-b border-brand-navy-100">
                        <th className="px-3 py-2">Email / Invite</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Team Joined</th>
                        <th className="px-3 py-2">Sent</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-navy-100">
                      {invitesData.invites.map((invite) => {
                        const canResend = !!invite.email && invite.status !== 'revoked'
                        return (
                          <tr key={invite.id} className="text-brand-nav">
                            <td className="px-3 py-2">
                              <div className="flex flex-col">
                                <span className="font-semibold">
                                  {invite.email || 'Link invite (no email)'}
                                </span>
                                <span className="text-xs text-brand-navy-500">
                                  Token ending in {invite.token.slice(-6)}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant={getStatusVariant(invite.status)} className="uppercase tracking-tight">
                                {invite.status}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-brand-navy-600">
                              {invite.team ? (
                                <span className="font-semibold text-brand-nav">{invite.team.name}</span>
                              ) : invite.status === 'accepted' ? (
                                <span className="text-brand-primary-700 font-semibold">Team joined</span>
                              ) : (
                                <span className="text-brand-navy-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-brand-navy-600">
                              {formatDate(invite.email_sent_at || invite.created_at)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {canResend ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="h-9 px-3"
                                  disabled={resendingInviteId === invite.id}
                                  onClick={() => handleResendInvite(invite)}
                                >
                                  {resendingInviteId === invite.id ? 'Resending...' : 'Resend'}
                                </Button>
                              ) : (
                                <span className="text-xs text-brand-navy-400">Link only</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {invitesData.teams.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-brand-nav">
                  Teams Joined ({invitesData.teams.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-brand-navy-500 tracking-wide border-b border-brand-navy-100">
                        <th className="px-3 py-2">Team Name</th>
                        <th className="px-3 py-2">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-navy-100">
                      {invitesData.teams.map((team) => (
                        <tr key={team.id} className="text-brand-nav">
                          <td className="px-3 py-2 font-semibold">{team.name}</td>
                          <td className="px-3 py-2 text-brand-navy-600">{formatDate(team.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {invitesData.invites.length === 0 && invitesData.teams.length === 0 && (
              <p className="text-sm text-brand-navy-500">
                No invites sent yet. Use the form above to invite managers.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-brand-navy-500">
            No invites sent yet. Use the form above to invite managers.
          </p>
        )}
      </Card>
    )
  }

  if (leagueStatus === 'draft') {
    return (
      <Card className="bg-brand-accent-gold-50 text-brand-nav border-brand-accent-gold-200 shadow-md" padding="lg">
        <h2 className="text-2xl font-display font-semibold text-brand-nav mb-3">
          Draft in Progress
        </h2>

        <p className="text-brand-navy-600 mb-4">
          Draft flow coming soon. For now, you can manage teams manually after setting the league to active.
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-status-error/40 bg-red-50 px-4 py-3 text-sm text-status-error">
            {error}
          </div>
        )}

        <Button
          onClick={handleStartSeason}
          disabled={isUpdating}
          variant="primary"
          size="md"
        >
          {isUpdating ? 'Starting Season...' : 'Mark Draft Complete / Start Season'}
        </Button>
      </Card>
    )
  }

  return null
}
