interface LeagueStatusMessageProps {
  status: 'invites_open' | 'draft' | 'active'
  isCommissioner: boolean
}

export function LeagueStatusMessage({ status, isCommissioner }: LeagueStatusMessageProps) {
  if (status === 'invites_open') {
    if (isCommissioner) {
      return null // Commissioner sees the setup panel instead
    }
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg shadow p-6 mb-6">
        <p className="text-blue-800 dark:text-blue-200">
          Waiting for commissioner to start the draft.
        </p>
      </div>
    )
  }

  if (status === 'draft') {
    if (isCommissioner) {
      return null // Commissioner sees the draft panel instead
    }
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow p-6 mb-6">
        <p className="text-yellow-800 dark:text-yellow-200">
          Draft in progress – your commissioner will finalize rosters.
        </p>
      </div>
    )
  }

  return null
}

