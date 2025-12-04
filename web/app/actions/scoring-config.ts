'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateScoringConfig, parseScoringConfig, type ScoringConfig } from '@/lib/scoring-config'

/**
 * Update league scoring configuration
 * 
 * Validates the config and updates the league's scoring_settings JSONB column.
 * Only the league commissioner can update scoring settings.
 */
export async function updateLeagueScoringConfig(
  leagueId: string,
  config: ScoringConfig
): Promise<{ data?: { success: boolean }; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user is league creator (commissioner)
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, created_by_user_id')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league || league.created_by_user_id !== user.id) {
    return { error: 'Only the league commissioner can update scoring settings' }
  }

  // Validate config
  const validationErrors = validateScoringConfig(config)
  if (validationErrors.length > 0) {
    return { error: `Invalid scoring config: ${validationErrors.join(', ')}` }
  }

  // Update league scoring_settings
  const { error: updateError } = await supabase
    .from('leagues')
    .update({
      scoring_settings: config as any, // JSONB accepts the object directly
    })
    .eq('id', leagueId)

  if (updateError) {
    return { error: `Failed to update scoring settings: ${updateError.message}` }
  }

  revalidatePath(`/leagues/${leagueId}`)
  
  return { data: { success: true } }
}

/**
 * Get league scoring configuration
 * Returns parsed config with defaults applied
 */
export async function getLeagueScoringConfig(
  leagueId: string
): Promise<{ data?: ScoringConfig; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify user has access to this league
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('id, scoring_settings')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) {
    return { error: 'League not found or access denied' }
  }

  const config = parseScoringConfig(league.scoring_settings)
  return { data: config }
}

