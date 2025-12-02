/**
 * Reset Universe Edge Function
 * 
 * Development-only function that deletes all user-created data (leagues, teams,
 * matchups, stats, transactions) and recreates a clean demo universe.
 * 
 * WARNING: This will delete ALL data for the calling user!
 * This function should only be callable in non-production environments.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check environment - only allow in dev/staging
    const env = Deno.env.get('ENVIRONMENT') || 'dev'
    if (env === 'prod') {
      return new Response(
        JSON.stringify({ error: 'Reset function not available in production' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

    // Delete all user's data in reverse dependency order
    // 1. Delete promotion_results (if any)
    await supabaseService
      .from('promotion_results')
      .delete()
      .in('promotion_group_id', 
        supabaseService.from('promotion_groups')
          .select('id')
          .eq('created_by_user_id', user.id)
      )

    // 2. Delete player_week_stats (via leagues)
    const { data: userLeagues } = await supabaseService
      .from('leagues')
      .select('id')
      .eq('created_by_user_id', user.id)

    if (userLeagues && userLeagues.length > 0) {
      const leagueIds = userLeagues.map(l => l.id)
      
      await supabaseService
        .from('player_week_stats')
        .delete()
        .in('league_id', leagueIds)

      // 3. Delete matchups
      await supabaseService
        .from('matchups')
        .delete()
        .in('league_id', leagueIds)

      // 4. Delete league_weeks
      await supabaseService
        .from('league_weeks')
        .delete()
        .in('league_id', leagueIds)

      // 5. Delete draft_picks
      await supabaseService
        .from('draft_picks')
        .delete()
        .in('league_id', leagueIds)

      // 6. Delete transactions
      await supabaseService
        .from('transactions')
        .delete()
        .in('league_id', leagueIds)

      // 7. Delete rosters (via teams)
      const { data: userTeams } = await supabaseService
        .from('teams')
        .select('id')
        .eq('owner_user_id', user.id)

      if (userTeams && userTeams.length > 0) {
        const teamIds = userTeams.map(t => t.id)
        
        await supabaseService
          .from('rosters')
          .delete()
          .in('team_id', teamIds)

        // 8. Delete teams
        await supabaseService
          .from('teams')
          .delete()
          .in('id', teamIds)
      }

      // 9. Delete leagues
      await supabaseService
        .from('leagues')
        .delete()
        .in('id', leagueIds)
    }

    // 10. Delete promotion groups
    await supabaseService
      .from('promotion_groups')
      .delete()
      .eq('created_by_user_id', user.id)

    // 11. Delete seasons
    await supabaseService
      .from('seasons')
      .delete()
      .eq('created_by_user_id', user.id)

    // Note: We do NOT delete players as they are shared system data

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Universe reset complete. All your leagues, teams, and data have been deleted.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

