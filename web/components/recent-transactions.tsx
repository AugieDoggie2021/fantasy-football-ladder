import { createClient } from '@/lib/supabase/server'

interface RecentTransactionsProps {
  leagueId: string
}

export async function RecentTransactions({ leagueId }: RecentTransactionsProps) {
  const supabase = await createClient()

  // Fetch recent transactions (last 20)
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      id,
      type,
      created_at,
      notes,
      teams (
        id,
        name
      ),
      player_in:players!transactions_player_in_id_fkey (
        id,
        full_name,
        position
      ),
      player_out:players!transactions_player_out_id_fkey (
        id,
        full_name,
        position
      )
    `)
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!transactions || transactions.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No transactions yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction: any) => {
        const team = transaction.teams
        const playerIn = transaction.player_in
        const playerOut = transaction.player_out

        return (
          <div
            key={transaction.id}
            className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div className={`px-2 py-1 text-xs font-medium rounded ${
              transaction.type === 'add'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                : transaction.type === 'drop'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
            }`}>
              {transaction.type.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-900 dark:text-white">
                <span className="font-medium">{team?.name}</span>
                {transaction.type === 'add' && playerIn && (
                  <> added <span className="font-medium">{playerIn.full_name}</span> ({playerIn.position})</>
                )}
                {transaction.type === 'drop' && playerOut && (
                  <> dropped <span className="font-medium">{playerOut.full_name}</span> ({playerOut.position})</>
                )}
              </div>
              {transaction.notes && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {transaction.notes}
                </div>
              )}
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {new Date(transaction.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

