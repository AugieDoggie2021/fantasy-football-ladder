import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreatePromotionGroupForm } from '@/components/create-promotion-group-form'

// Force dynamic rendering - requires authentication and database queries
export const dynamic = 'force-dynamic'

export default async function PromotionGroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: promotionGroups } = await supabase
    .from('promotion_groups')
    .select(`
      *,
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
              Promotion Groups
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create Promotion Group
            </h2>
            <CreatePromotionGroupForm />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              My Promotion Groups
            </h2>
            
            {promotionGroups && promotionGroups.length > 0 ? (
              <div className="space-y-3">
                {promotionGroups.map((group: any) => (
                  <Link
                    key={group.id}
                    href={`/promotion-groups/${group.id}`}
                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {group.seasons?.[0]?.year} Season
                    </p>
                    {group.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {group.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                You haven&apos;t created any promotion groups yet. Create one above to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

