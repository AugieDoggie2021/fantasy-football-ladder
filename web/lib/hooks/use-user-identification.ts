'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { identify, setUserProperties } from '@/lib/analytics/track'
import { AnalyticsEvents } from '@/lib/analytics/events'

/**
 * Hook to identify users in PostHog when authenticated
 * Fetches user profile and sets user properties
 * Updates properties when user data changes
 */
export function useUserIdentification() {
  const router = useRouter()
  const identifiedRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true

    const identifyUser = async () => {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          return
        }

        // Skip if already identified for this user
        if (identifiedRef.current === user.id) {
          return
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, display_name, is_admin, created_at')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 is "not found" - user profile might not exist yet
          console.error('Error fetching user profile:', profileError)
        }

        // Fetch user's league and team counts
        const [leaguesResult, teamsResult] = await Promise.all([
          supabase
            .from('leagues')
            .select('id', { count: 'exact', head: true })
            .eq('created_by_user_id', user.id),
          supabase
            .from('teams')
            .select('id', { count: 'exact', head: true })
            .eq('owner_user_id', user.id)
            .eq('is_active', true),
        ])

        const leagueCount = leaguesResult.count || 0
        const teamCount = teamsResult.count || 0

        // Prepare user traits
        const traits: Record<string, unknown> = {
          email: user.email,
          user_id: user.id,
          display_name: profile?.display_name || user.email?.split('@')[0] || 'User',
          is_admin: profile?.is_admin || false,
          created_at: profile?.created_at || user.created_at,
          league_count: leagueCount,
          team_count: teamCount,
        }

        // Identify user in PostHog
        identify(user.id, traits)
        identifiedRef.current = user.id

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ User identified in PostHog:', user.id, traits)
        }
      } catch (error) {
        console.error('Error identifying user:', error)
      }
    }

    // Identify user on mount
    identifyUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        // Reset identified ref to allow re-identification
        identifiedRef.current = null
        identifyUser()
      } else if (event === 'SIGNED_OUT') {
        identifiedRef.current = null
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])
}

/**
 * Hook to update user properties when they change
 * Call this after actions that change user metadata (league count, team count, etc.)
 */
export function useUpdateUserProperties() {
  const updateProperties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch updated counts
      const [leaguesResult, teamsResult] = await Promise.all([
        supabase
          .from('leagues')
          .select('id', { count: 'exact', head: true })
          .eq('created_by_user_id', user.id),
        supabase
          .from('teams')
          .select('id', { count: 'exact', head: true })
          .eq('owner_user_id', user.id)
          .eq('is_active', true),
      ])

      const leagueCount = leaguesResult.count || 0
      const teamCount = teamsResult.count || 0

      // Update user properties
      setUserProperties({
        league_count: leagueCount,
        team_count: teamCount,
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ User properties updated:', { league_count: leagueCount, team_count: teamCount })
      }
    } catch (error) {
      console.error('Error updating user properties:', error)
    }
  }

  return { updateProperties }
}

