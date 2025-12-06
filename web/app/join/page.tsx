import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { JoinLeagueByCodeForm } from '@/components/join-league-by-code-form'

export const dynamic = 'force-dynamic'

export default async function JoinLeaguePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/join')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join a League
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a league invite code or use an invite link to join a league.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Join by Invite Code
          </h2>
          <JoinLeagueByCodeForm />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Don&apos;t have an invite code?
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
            Ask your league commissioner for an invite link or code. You can also browse available public leagues.
          </p>
          <Link
            href="/leagues/browse"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Browse Available Leagues
          </Link>
        </div>
      </div>
    </div>
  )
}

