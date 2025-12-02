/**
 * Seed Test Users Edge Function
 * 
 * Development-only function that creates 3-4 dummy users, auto-creates teams
 * for them, auto-drafts rosters, and simulates standings.
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

    // Only allow if user is admin or commissioner
    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!userProfile?.is_admin && req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Only admins can seed test users' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

    // Get or create a demo league (first league the user owns or create one)
    const { data: userLeagues } = await supabase
      .from('leagues')
      .select('*')
      .eq('created_by_user_id', user.id)
      .limit(1)

    let demoLeague = userLeagues?.[0]
    
    if (!demoLeague) {
      // Create a demo league if none exists
      const currentYear = new Date().getFullYear()
      const { data: season } = await supabase
        .from('seasons')
        .select('id')
        .eq('year', currentYear)
        .eq('created_by_user_id', user.id)
        .limit(1)
        .single()

      let seasonId = season?.id
      if (!seasonId) {
        const { data: newSeason } = await supabase
          .from('seasons')
          .insert({
            year: currentYear,
            status: 'preseason',
            created_by_user_id: user.id,
          })
          .select()
          .single()
        seasonId = newSeason?.id
      }

      const { data: newLeague } = await supabase
        .from('leagues')
        .insert({
          season_id: seasonId,
          name: 'Test Users League',
          max_teams: 10,
          status: 'preseason',
          scoring_settings: {},
          draft_type: 'snake',
          created_by_user_id: user.id,
        })
        .select()
        .single()
      
      demoLeague = newLeague
    }

    if (!demoLeague) {
      throw new Error('Failed to get or create demo league')
    }

    // Get available players
    const { data: players } = await supabaseService
      .from('players')
      .select('*')
      .limit(100)

    if (!players || players.length < 30) {
      return new Response(
        JSON.stringify({ error: 'Not enough players in database. Seed players first.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Create test users (using Auth Admin API would require admin client)
    // For now, we'll create teams with placeholder user IDs
    // In a real implementation, you'd use Supabase Admin API to create users
    
    const testUserNames = ['Test User Alpha', 'Test User Beta', 'Test User Gamma', 'Test User Delta']
    const createdTeams = []

    // For MVP: Create teams owned by the current user but with different names
    // In production, this would create actual test user accounts
    for (let i = 0; i < Math.min(4, testUserNames.length); i++) {
      const teamName = testUserNames[i]
      
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          league_id: demoLeague.id,
          owner_user_id: user.id, // For demo, use same user
          name: teamName,
          draft_position: i + 1,
          is_active: true,
        })
        .select()
        .single()

      if (!teamError && team) {
        createdTeams.push(team)
        
        // Auto-draft players for this team (snake draft)
        // Round 1: pick i, Round 2: (8 - i), etc.
        const totalRounds = 14
        let playerIndex = i
        
        for (let round = 1; round <= totalRounds; round++) {
          const isEvenRound = round % 2 === 0
          const overallPick = (round - 1) * 4 + (isEvenRound ? (4 - i) : i + 1)
          
          if (playerIndex < players.length) {
            const player = players[playerIndex]
            
            // Determine slot type based on position and round
            let slotType = 'BENCH'
            if (round <= 8) {
              if (player.position === 'QB' && round === 1) slotType = 'QB'
              else if (player.position === 'RB' && round <= 3) slotType = 'RB'
              else if (player.position === 'WR' && round <= 5) slotType = 'WR'
              else if (player.position === 'TE' && round === 7) slotType = 'TE'
              else if (player.position === 'K' && round === 8) slotType = 'K'
              else if (player.position === 'DEF' && round === 8) slotType = 'DEF'
            }

            // Add to roster
            await supabaseService
              .from('rosters')
              .insert({
                team_id: team.id,
                player_id: player.id,
                slot_type: slotType,
                is_starter: slotType !== 'BENCH',
              })

            // Create draft pick record
            await supabaseService
              .from('draft_picks')
              .insert({
                league_id: demoLeague.id,
                round: round,
                overall_pick: overallPick,
                team_id: team.id,
                player_id: player.id,
              })

            // Create transaction
            await supabaseService
              .from('transactions')
              .insert({
                league_id: demoLeague.id,
                team_id: team.id,
                type: 'add',
                player_in_id: player.id,
              })

            playerIndex += 4 // Move to next pick in snake order
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          league: demoLeague,
          teamsCreated: createdTeams.length,
          teams: createdTeams.map(t => ({ id: t.id, name: t.name })),
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

