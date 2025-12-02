/**
 * Seed Demo Data Edge Function
 * 
 * Development-only function that seeds a demo season, promotion group,
 * leagues, and a team for the current user.
 * 
 * This function should only be callable in non-production environments.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check environment - only allow in dev/staging
    const env = Deno.env.get('ENVIRONMENT') || 'dev'
    if (env === 'prod') {
      return new Response(
        JSON.stringify({ error: 'Seed function not available in production' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Get authorization header
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

    // Initialize Supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Get current user from the auth token
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

    const currentYear = new Date().getFullYear()

    // Step 1: Create or find season for current year
    let { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('*')
      .eq('year', currentYear)
      .eq('created_by_user_id', user.id)
      .single()

    if (!season && seasonError?.code === 'PGRST116') {
      // Season doesn't exist, create it
      const { data: newSeason, error: createSeasonError } = await supabase
        .from('seasons')
        .insert({
          year: currentYear,
          status: 'preseason',
          created_by_user_id: user.id,
        })
        .select()
        .single()

      if (createSeasonError) {
        throw createSeasonError
      }
      season = newSeason
    } else if (seasonError) {
      throw seasonError
    }

    // Step 2: Create promotion group
    const { data: promotionGroup, error: pgError } = await supabase
      .from('promotion_groups')
      .insert({
        season_id: season.id,
        name: 'Demo Promotion Group',
        description: 'Demo data for testing - created by seed function',
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (pgError) {
      throw pgError
    }

    // Step 3: Create 3 leagues in tiers 1-3
    const leagues = []
    for (let tier = 1; tier <= 3; tier++) {
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .insert({
          season_id: season.id,
          promotion_group_id: promotionGroup.id,
          name: `Demo Tier ${tier} League`,
          tier: tier,
          max_teams: 10,
          status: 'preseason',
          scoring_settings: {},
          draft_type: 'snake',
          created_by_user_id: user.id,
        })
        .select()
        .single()

      if (leagueError) {
        throw leagueError
      }
      leagues.push(league)
    }

    // Initialize service role client for seeding players (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

    // Step 4: Seed players (idempotent - only insert if they don't exist)
    const demoPlayers = [
      // QBs
      { full_name: 'Patrick Mahomes', position: 'QB', nfl_team: 'KC', bye_week: 10 },
      { full_name: 'Josh Allen', position: 'QB', nfl_team: 'BUF', bye_week: 13 },
      { full_name: 'Lamar Jackson', position: 'QB', nfl_team: 'BAL', bye_week: 13 },
      { full_name: 'Jalen Hurts', position: 'QB', nfl_team: 'PHI', bye_week: 10 },
      { full_name: 'Joe Burrow', position: 'QB', nfl_team: 'CIN', bye_week: 7 },
      // RBs
      { full_name: 'Christian McCaffrey', position: 'RB', nfl_team: 'SF', bye_week: 9 },
      { full_name: 'Austin Ekeler', position: 'RB', nfl_team: 'LAC', bye_week: 5 },
      { full_name: 'Derrick Henry', position: 'RB', nfl_team: 'TEN', bye_week: 7 },
      { full_name: 'Josh Jacobs', position: 'RB', nfl_team: 'LV', bye_week: 13 },
      { full_name: 'Saquon Barkley', position: 'RB', nfl_team: 'NYG', bye_week: 13 },
      { full_name: 'Tony Pollard', position: 'RB', nfl_team: 'DAL', bye_week: 7 },
      { full_name: 'Breece Hall', position: 'RB', nfl_team: 'NYJ', bye_week: 7 },
      // WRs
      { full_name: 'Justin Jefferson', position: 'WR', nfl_team: 'MIN', bye_week: 13 },
      { full_name: 'Tyreek Hill', position: 'WR', nfl_team: 'MIA', bye_week: 10 },
      { full_name: 'Cooper Kupp', position: 'WR', nfl_team: 'LA', bye_week: 10 },
      { full_name: 'Davante Adams', position: 'WR', nfl_team: 'LV', bye_week: 13 },
      { full_name: 'Stefon Diggs', position: 'WR', nfl_team: 'BUF', bye_week: 13 },
      { full_name: 'CeeDee Lamb', position: 'WR', nfl_team: 'DAL', bye_week: 7 },
      { full_name: 'A.J. Brown', position: 'WR', nfl_team: 'PHI', bye_week: 10 },
      { full_name: 'DK Metcalf', position: 'WR', nfl_team: 'SEA', bye_week: 5 },
      // TEs
      { full_name: 'Travis Kelce', position: 'TE', nfl_team: 'KC', bye_week: 10 },
      { full_name: 'Mark Andrews', position: 'TE', nfl_team: 'BAL', bye_week: 13 },
      { full_name: 'T.J. Hockenson', position: 'TE', nfl_team: 'MIN', bye_week: 13 },
      { full_name: 'Dallas Goedert', position: 'TE', nfl_team: 'PHI', bye_week: 10 },
      // Ks
      { full_name: 'Justin Tucker', position: 'K', nfl_team: 'BAL', bye_week: 13 },
      { full_name: 'Daniel Carlson', position: 'K', nfl_team: 'LV', bye_week: 13 },
      { full_name: 'Evan McPherson', position: 'K', nfl_team: 'CIN', bye_week: 7 },
      // DEFs
      { full_name: 'Buffalo Bills', position: 'DEF', nfl_team: 'BUF', bye_week: 13 },
      { full_name: 'San Francisco 49ers', position: 'DEF', nfl_team: 'SF', bye_week: 9 },
      { full_name: 'Dallas Cowboys', position: 'DEF', nfl_team: 'DAL', bye_week: 7 },
      { full_name: 'Philadelphia Eagles', position: 'DEF', nfl_team: 'PHI', bye_week: 10 },
    ]

    const seededPlayers = []
    for (const player of demoPlayers) {
      // Check if player already exists by name and position
      const { data: existing } = await supabaseService
        .from('players')
        .select('id')
        .eq('full_name', player.full_name)
        .eq('position', player.position)
        .single()

      if (!existing) {
        const { data: newPlayer, error: playerError } = await supabaseService
          .from('players')
          .insert(player)
          .select()
          .single()

        if (playerError) {
          console.warn(`Failed to seed player ${player.full_name}:`, playerError.message)
        } else {
          seededPlayers.push(newPlayer)
        }
      }
    }

    // Step 5: Create a team for the user in tier 1 league
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        league_id: leagues[0].id,
        owner_user_id: user.id,
        name: 'Demo Team',
        is_active: true,
      })
      .select()
      .single()

    if (teamError) {
      throw teamError
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          season,
          promotionGroup,
          leagues,
          team,
          playersSeeded: seededPlayers.length,
        },
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

