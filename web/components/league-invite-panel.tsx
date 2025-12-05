'use client'

import { useState } from 'react'
import { createLeagueInvite } from '@/app/actions/invites'
import { useToast } from './toast-provider'
import { useRouter } from 'next/navigation'
import { isValidEmail } from '@/lib/email'

interface LeagueInvitePanelProps {
  leagueId: string
}

export function LeagueInvitePanel({ leagueId }: LeagueInvitePanelProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  const handleGenerateInvite = async () => {
    setLoading(true)
    setInviteUrl(null)

    try {
      const result = await createLeagueInvite(leagueId)
      
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.data?.token) {
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : process.env.NEXT_PUBLIC_SITE_URL || 'https://fantasy-football-ladder.vercel.app'
        const url = `${baseUrl}/join/league/${result.data.token}`
        setInviteUrl(url)
        showToast('Invite link generated! Copy it to share with players.', 'success')
        router.refresh()
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to generate invite', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!email.trim()) {
      showToast('Please enter an email address', 'error')
      return
    }

    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address', 'error')
      return
    }

    setSendingEmail(true)

    try {
      const result = await createLeagueInvite(leagueId, email.trim())
      
      if (result.error) {
        showToast(result.error, 'error')
      } else if (result.data) {
        if (result.data.emailSent) {
          if (result.data.devMode) {
            showToast('Email sent! (Check Inbucket in dev mode)', 'success')
          } else {
            showToast('Invite email sent successfully!', 'success')
          }
          setEmail('')
        } else if (result.data.emailError) {
          showToast(`Invite created but email failed: ${result.data.emailError}`, 'warning')
          // Still show the link
          if (result.data.token) {
            const baseUrl = typeof window !== 'undefined' 
              ? window.location.origin 
              : process.env.NEXT_PUBLIC_SITE_URL || 'https://fantasy-football-ladder.vercel.app'
            const url = `${baseUrl}/join/league/${result.data.token}`
            setInviteUrl(url)
          }
        } else if (result.data.token) {
          // Invite created but no email sent (shouldn't happen if email provided)
          const baseUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : process.env.NEXT_PUBLIC_SITE_URL || 'https://fantasy-football-ladder.vercel.app'
          const url = `${baseUrl}/join/league/${result.data.token}`
          setInviteUrl(url)
          showToast('Invite created! Copy the link to share.', 'success')
        }
        router.refresh()
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to send invite email', 'error')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleCopyUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
      showToast('Invite link copied to clipboard!', 'success')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Invite Players
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          Send an invite via email or generate a shareable link.
        </p>
      </div>

      {/* Email Input Section */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
            disabled={sendingEmail}
          />
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail || !email.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {sendingEmail ? 'Sending...' : 'Send via Email'}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">Or</span>
        </div>
      </div>

      {/* Link Generation Section */}
      {!inviteUrl ? (
        <button
          onClick={handleGenerateInvite}
          disabled={loading}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? 'Generating...' : 'Generate Invite Link'}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
            />
            <button
              onClick={handleCopyUrl}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => {
              setInviteUrl(null)
              handleGenerateInvite()
            }}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Generate New Link
          </button>
        </div>
      )}
    </div>
  )
}

