'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeagueStatus } from '@/app/actions/leagues'
import { createLeagueInvite, getLeagueInvites, resendInviteEmail } from '@/app/actions/invites'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from './toast-provider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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
  const { showToast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitesData, setInvitesData] = useState<InvitesData | null>(null)
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null)
  const [copyingInviteId, setCopyingInviteId] = useState<string | null>(null)
  const [showDraftOverride, setShowDraftOverride] = useState(false)

  const handleStartDraftClick = () => {
    if (teamCount >= maxTeams) {
      handleStartDraft()
    } else {
      setShowDraftOverride(true)
    }
  }

  const handleStartDraft = async () => {
    setShowDraftOverride(false)
    setIsUpdating(true)
    setError(null)

    const result = await updateLeagueStatus(leagueId, 'draft')

    if (result.error) {
      setError(result.error)
      setIsUpdating(false)
    } else {
      showToast('Draft started!', 'success')
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
        setError(
          `Invite created but email was not sent: ${errorMsg}. Share this link instead: ${baseUrl}/join/${result.data?.token}`,
        )
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

  const handleCopyInviteLink = async (invite: Invite) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fantasyladder.app'
    const inviteLink = `${baseUrl}/join/${invite.token}`
    
    setCopyingInviteId(invite.id)
    try {
      await navigator.clipboard.writeText(inviteLink)
      showToast('Invite link copied to clipboard!', 'success')
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = inviteLink
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        showToast('Invite link copied to clipboard!', 'success')
      } catch (fallbackErr) {
        showToast('Failed to copy link. Please copy manually: ' + inviteLink, 'error')
      }
      document.body.removeChild(textArea)
    }
    setCopyingInviteId(null)
  }

  const handleCreateAndCopyInviteLink = async () => {
    setSendingInvite(true)
    setError(null)
    setInviteSuccess(null)

    // Create invite without email
    const result = await createLeagueInvite(leagueId)

    if (result.error) {
      setError(result.error)
    } else if (result.data?.token) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fantasyladder.app'
      const inviteLink = `${baseUrl}/join/${result.data.token}`
      
      try {
        await navigator.clipboard.writeText(inviteLink)
        showToast('Invite link created and copied to clipboard!', 'success')
        setInviteSuccess(`Invite link created and copied! Share: ${inviteLink}`)
      } catch (err) {
        // Fallback
        const textArea = document.createElement('textarea')
        textArea.value = inviteLink
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          showToast('Invite link created and copied to clipboard!', 'success')
          setInviteSuccess(`Invite link created and copied! Share: ${inviteLink}`)
        } catch (fallbackErr) {
          setInviteSuccess(`Invite link created! Copy this link: ${inviteLink}`)
        }
        document.body.removeChild(textArea)
      }

      const invitesResult = await getLeagueInvites(leagueId)
      if (!invitesResult.error) {
        setInvitesData(invitesResult.data as InvitesData)
      }
    }

    setSendingInvite(false)
  }

  if (leagueStatus === 'invites_open') {
    const isFull = teamCount >= maxTeams

    return (
      <Card padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-semibold text-white tracking-tight">Step 1: Invite Managers</h2>
            <p className="text-sm text-slate-400 mt-1">
              Teams joined:{' '}
              <span className="font-semibold text-white">
                {teamCount} / {maxTeams}
              </span>
            </p>
            {!isFull && (
              <p className="text-sm text-slate-400">
                Invite managers until the league is full, then start the draft.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {isFull ? (
              <Button
                onClick={handleStartDraft}
                disabled={isUpdating}
                variant="primary"
                size="md"
                className="whitespace-nowrap"
              >
                {isUpdating ? 'Starting Draft...' : 'Start Draft'}
              </Button>
            ) : (
              <Button
                onClick={handleStartDraftClick}
                disabled={isUpdating}
                variant="secondary"
                size="md"
                className="whitespace-nowrap"
              >
                {isUpdating ? 'Starting Draft...' : 'Start Draft Anyway'}
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <form onSubmit={handleSendInvite}>
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="manager@team.com"
                aria-label="Invite by email"
                disabled={sendingInvite}
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
          
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-700/60"></div>
            <span className="text-xs text-slate-400 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-slate-700/60"></div>
          </div>
          
          <Button
            onClick={handleCreateAndCopyInviteLink}
            disabled={sendingInvite}
            variant="secondary"
            size="md"
            className="w-full"
          >
            {sendingInvite ? 'Creating...' : '📋 Create & Copy Invite Link'}
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-status-error/40 bg-red-900/30 px-4 py-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-status-error flex-1">{error}</p>
              {error.includes('http') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const linkMatch = error.match(/https?:\/\/[^\s]+/)
                    if (linkMatch) {
                      const link = linkMatch[0]
                      try {
                        await navigator.clipboard.writeText(link)
                        showToast('Link copied to clipboard!', 'success')
                      } catch (err) {
                        showToast('Failed to copy link', 'error')
                      }
                    }
                  }}
                  className="shrink-0"
                >
                  📋 Copy Link
                </Button>
              )}
            </div>
          </div>
        )}

        {inviteSuccess && (
          <div className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-900/20 px-4 py-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-emerald-100 flex-1">{inviteSuccess}</p>
              {inviteSuccess.includes('http') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const linkMatch = inviteSuccess.match(/https?:\/\/[^\s]+/)
                    if (linkMatch) {
                      const link = linkMatch[0]
                      try {
                        await navigator.clipboard.writeText(link)
                        showToast('Link copied to clipboard!', 'success')
                      } catch (err) {
                        showToast('Failed to copy link', 'error')
                      }
                    }
                  }}
                  className="shrink-0"
                >
                  📋 Copy Link
                </Button>
              )}
            </div>
          </div>
        )}

        {loadingInvites ? (
          <p className="text-sm text-slate-400">Loading invites...</p>
        ) : invitesData ? (
          <div className="space-y-6">
            {invitesData.invites.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Invites Sent</h3>
                  <p className="text-sm text-slate-400">
                    Email sends count the last sent email, not attempts.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-slate-400 tracking-wide border-b border-slate-700/40">
                        <th className="px-3 py-2">Email / Invite</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Team Joined</th>
                        <th className="px-3 py-2">Sent</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {invitesData.invites.map((invite) => {
                        const canResend = !!invite.email && invite.status !== 'revoked'
                        return (
                          <tr key={invite.id} className="text-slate-300 bg-slate-900/40 hover:bg-slate-800/40">
                            <td className="px-3 py-2">
                              <div className="flex flex-col">
                                <span className="font-semibold text-white">
                                  {invite.email || 'Link invite (no email)'}
                                </span>
                                <span className="text-xs text-slate-400">
                                  Token ending in {invite.token.slice(-6)}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant={getStatusVariant(invite.status)} className="uppercase tracking-tight">
                                {invite.status}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-slate-300">
                              {invite.team ? (
                                <span className="font-semibold text-white">{invite.team.name}</span>
                              ) : invite.status === 'accepted' ? (
                                <span className="text-emerald-300 font-semibold">Team joined</span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-300">
                              {formatDate(invite.email_sent_at || invite.created_at)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 px-3"
                                  disabled={copyingInviteId === invite.id}
                                  onClick={() => handleCopyInviteLink(invite)}
                                  title="Copy invite link"
                                >
                                  {copyingInviteId === invite.id ? 'Copying...' : '📋 Copy'}
                                </Button>
                                {canResend && (
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
                                )}
                              </div>
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
                <h3 className="text-base font-semibold text-white">
                  Teams Joined ({invitesData.teams.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-slate-400 tracking-wide border-b border-slate-700/40">
                        <th className="px-3 py-2">Team Name</th>
                        <th className="px-3 py-2">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {invitesData.teams.map((team) => (
                        <tr key={team.id} className="text-slate-300 bg-slate-900/40 hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-semibold text-white">{team.name}</td>
                          <td className="px-3 py-2 text-slate-300">{formatDate(team.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {invitesData.invites.length === 0 && invitesData.teams.length === 0 && (
              <p className="text-sm text-slate-400">
                No invites sent yet. Use the form above to invite managers.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No invites sent yet. Use the form above to invite managers.
          </p>
        )}

        <ConfirmDialog
          isOpen={showDraftOverride}
          onClose={() => setShowDraftOverride(false)}
          onConfirm={handleStartDraft}
          title="Start Draft Before League is Full?"
          variant="default"
          isLoading={isUpdating}
          confirmLabel="Yes, Start Draft"
          cancelLabel="Cancel"
        >
          <div className="space-y-3">
            <p className="text-slate-300">
              You're starting the draft with <strong className="text-white">{teamCount} / {maxTeams}</strong> teams. 
              This means some draft slots will be empty.
            </p>
            <div className="bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">
              <p className="text-sm font-semibold text-amber-200 mb-2">Readiness Checklist:</p>
              <ul className="text-sm text-amber-100 space-y-1 list-disc list-inside">
                <li className={teamCount >= 2 ? 'text-emerald-300' : ''}>
                  {teamCount >= 2 ? '✓' : '○'} At least 2 teams joined ({teamCount >= 2 ? 'Yes' : 'No'})
                </li>
                <li className={teamCount >= maxTeams ? 'text-emerald-300' : 'text-amber-200'}>
                  {teamCount >= maxTeams ? '✓' : '○'} League is full ({teamCount >= maxTeams ? 'Yes' : 'No'})
                </li>
                <li className="text-amber-200">
                  ○ All managers are ready to draft
                </li>
              </ul>
            </div>
            <p className="text-xs text-slate-400">
              You can still invite more managers after starting the draft, but they won't be able to participate.
            </p>
          </div>
        </ConfirmDialog>
      </Card>
    )
  }

  if (leagueStatus === 'draft') {
    return (
      <Card className="bg-slate-900/80 text-slate-300 border-slate-700 shadow-md" padding="lg">
        <h2 className="text-2xl font-display font-semibold text-white tracking-tight mb-3">
          Draft in Progress
        </h2>

        <p className="text-slate-400 mb-4">
          Draft flow coming soon. For now, you can manage teams manually after setting the league to active.
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-status-error/40 bg-red-900/30 px-4 py-3 text-sm text-status-error">
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

