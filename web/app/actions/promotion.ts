'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Preview promotion/relegation movements (dry-run)
 */
export async function previewPromotion(promotionGroupId: string, fromSeasonId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is promotion group creator
  const { data: promotionGroup } = await supabase
    .from('promotion_groups')
    .select('created_by_user_id')
    .eq('id', promotionGroupId)
    .single()

  if (!promotionGroup || promotionGroup.created_by_user_id !== user.id) {
    return { error: 'Only the promotion group creator can preview promotion' }
  }

  // Get session for edge function call
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { error: 'No session found' }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const functionUrl = `${supabaseUrl}/functions/v1/run_promotion`

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        promotion_group_id: promotionGroupId,
        from_season_id: fromSeasonId,
        mode: 'dry_run',
        config: {
          promote_per_tier: 3,
          relegate_per_tier: 3,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Failed to preview promotion' }
    }

    return { data }
  } catch (error: any) {
    return { error: error.message || 'Failed to call promotion function' }
  }
}

/**
 * Apply promotion/relegation and create next season
 */
export async function applyPromotion(promotionGroupId: string, fromSeasonId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is promotion group creator
  const { data: promotionGroup } = await supabase
    .from('promotion_groups')
    .select('created_by_user_id')
    .eq('id', promotionGroupId)
    .single()

  if (!promotionGroup || promotionGroup.created_by_user_id !== user.id) {
    return { error: 'Only the promotion group creator can apply promotion' }
  }

  // Get session for edge function call
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { error: 'No session found' }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const functionUrl = `${supabaseUrl}/functions/v1/run_promotion`

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        promotion_group_id: promotionGroupId,
        from_season_id: fromSeasonId,
        mode: 'apply',
        config: {
          promote_per_tier: 3,
          relegate_per_tier: 3,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Failed to apply promotion' }
    }

    return { data }
  } catch (error: any) {
    return { error: error.message || 'Failed to call promotion function' }
  }
}

