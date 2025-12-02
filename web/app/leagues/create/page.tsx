import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreateLeagueForm } from '@/components/create-league-form'

export default async function CreateLeaguePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's seasons and promotion groups for dropdowns
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, year')
    .eq('created_by_user_id', user.id)
    .order('year', { ascending: false })

  const { data: promotionGroups } = await supabase
    .from('promotion_groups')
    .select(`
      id,
      name,
      season_id,
      seasons (
        id,
        year
      )
    `)
    .eq('created_by_user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create League
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <CreateLeagueForm seasons={seasons || []} promotionGroups={promotionGroups || []} />
          </div>
        </div>
      </div>
    </div>
  )
}

