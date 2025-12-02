/**
 * Promotion/Relegation Edge Function
 * 
 * Handles promotion and relegation logic at the end of a season.
 * Supports dry-run mode for preview and apply mode for season rollover.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PromotionConfig {
  promote_per_tier?: number
  relegate_per_tier?: number
}

interface PromotionRequest {
  promotion_group_id: string
  from_season_id: string
  mode?: 'dry_run' | 'apply'
  config?: PromotionConfig
}

interface TeamStanding {
  teamId: string
  teamName: string
  wins: number
  losses: number
  ties: number
  pointsFor: number
  pointsAgainst: number
}

interface Movement {
  team_id: string
  team_name: string
  old_league_id: string
  old_league_name: string
  new_league_id?: string
  new_league_name?: string
  from_tier: number
  to_tier: number
  movement_type: 'promoted' | 'relegated' | 'stayed'
  reason: any
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    // User client for auth checks
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Service client for privileged operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Parse request body
    const body: PromotionRequest = await req.json()
    const {
      promotion_group_id,
      from_season_id,
      mode = 'dry_run',
      config = { promote_per_tier: 3, relegate_per_tier: 3 }
    } = body

    if (!promotion_group_id || !from_season_id) {
      return new Response(
        JSON.stringify({ error: 'promotion_group_id and from_season_id are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Verify user is promotion group creator or admin
    const { data: promotionGroup, error: pgError } = await supabaseUser
      .from('promotion_groups')
      .select('id, created_by_user_id, season_id')
      .eq('id', promotion_group_id)
      .single()

    if (pgError || !promotionGroup) {
      return new Response(
        JSON.stringify({ error: 'Promotion group not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Check if user is creator
    if (promotionGroup.created_by_user_id !== user.id) {
      // Check if user is admin
      const { data: userProfile } = await supabaseUser
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!userProfile?.is_admin) {
        return new Response(
          JSON.stringify({ error: 'Only the promotion group creator or admin can run promotion' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          }
        )
      }
    }

    // Verify promotion group is linked to from_season_id
    if (promotionGroup.season_id !== from_season_id) {
      return new Response(
        JSON.stringify({ error: 'Promotion group is not linked to the specified season' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Fetch from season
    const { data: fromSeason, error: seasonError } = await supabaseService
      .from('seasons')
      .select('*')
      .eq('id', from_season_id)
      .single()

    if (seasonError || !fromSeason) {
      return new Response(
        JSON.stringify({ error: 'Season not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Gather all leagues in this promotion group for this season
    const { data: leagues, error: leaguesError } = await supabaseService
      .from('leagues')
      .select('id, name, tier, max_teams, status')
      .eq('promotion_group_id', promotion_group_id)
      .eq('season_id', from_season_id)
      .order('tier', { ascending: true })

    if (leaguesError || !leagues || leagues.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No leagues found in this promotion group for this season' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Get distinct tiers and sort ascending (1 = top tier)
    const tiers = [...new Set(leagues.map(l => l.tier).filter(t => t !== null))].sort((a, b) => a - b) as number[]
    if (tiers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No tiers found in leagues' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // For MVP, verify all leagues are complete (or at least have final matchups)
    // TODO: Could be more lenient, but for safety check status
    const incompleteLeagues = leagues.filter(l => l.status !== 'complete')
    if (incompleteLeagues.length > 0 && mode === 'apply') {
      return new Response(
        JSON.stringify({ 
          error: `Cannot apply promotion: some leagues are not marked as complete. League(s): ${incompleteLeagues.map(l => l.name).join(', ')}` 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Compute standings for each league
    const leagueStandingsMap = new Map<string, TeamStanding[]>()
    
    for (const league of leagues) {
      // Fetch all completed matchups for this league
      const { data: matchups } = await supabaseService
        .from('matchups')
        .select(`
          home_team_id,
          home_score,
          away_team_id,
          away_score,
          status,
          home_team:teams!matchups_home_team_id_fkey (
            id,
            name
          ),
          away_team:teams!matchups_away_team_id_fkey (
            id,
            name
          )
        `)
        .eq('league_id', league.id)
        .eq('status', 'final')

      // Calculate standings (similar logic to web/lib/standings-helpers.ts)
      const standingsMap = new Map<string, TeamStanding>()
      
      // Initialize all teams in league
      const { data: leagueTeams } = await supabaseService
        .from('teams')
        .select('id, name')
        .eq('league_id', league.id)
        .eq('is_active', true)

      leagueTeams?.forEach(team => {
        standingsMap.set(team.id, {
          teamId: team.id,
          teamName: team.name,
          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
          pointsAgainst: 0,
        })
      })

      // Process matchups
      matchups?.forEach((matchup: any) => {
        const homeStanding = standingsMap.get(matchup.home_team_id)
        const awayStanding = standingsMap.get(matchup.away_team_id)
        
        if (homeStanding && awayStanding) {
          const homeScore = Number(matchup.home_score) || 0
          const awayScore = Number(matchup.away_score) || 0

          homeStanding.pointsFor += homeScore
          homeStanding.pointsAgainst += awayScore
          awayStanding.pointsFor += awayScore
          awayStanding.pointsAgainst += homeScore

          if (homeScore > awayScore) {
            homeStanding.wins += 1
            awayStanding.losses += 1
          } else if (awayScore > homeScore) {
            awayStanding.wins += 1
            homeStanding.losses += 1
          } else {
            homeStanding.ties += 1
            awayStanding.ties += 1
          }
        }
      })

      // Sort standings: wins desc, then PF desc, then PA asc
      const standings = Array.from(standingsMap.values()).sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins
        if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor
        return a.pointsAgainst - b.pointsAgainst
      })

      leagueStandingsMap.set(league.id, standings)
    }

    // Calculate movements
    const movements: Movement[] = []
    const promotePerTier = config.promote_per_tier || 3
    const relegatePerTier = config.relegate_per_tier || 3
    const maxTier = Math.max(...tiers)

    // Map: tier -> league (assuming one league per tier for MVP)
    const leagueByTier = new Map<number, typeof leagues[0]>()
    leagues.forEach(league => {
      if (league.tier !== null) {
        leagueByTier.set(league.tier, league)
      }
    })

    // Process each tier
    for (const tier of tiers) {
      const league = leagueByTier.get(tier)
      if (!league) continue

      const standings = leagueStandingsMap.get(league.id) || []
      
      standings.forEach((standing, index) => {
        const rank = index + 1 // 1-based ranking
        let movementType: 'promoted' | 'relegated' | 'stayed' = 'stayed'
        let toTier = tier
        let reason: any = {}

        // Check for promotion (if not top tier)
        if (tier > 1 && rank <= promotePerTier) {
          movementType = 'promoted'
          toTier = tier - 1
          reason = { rule: 'top_3_promoted', rank, promote_per_tier: promotePerTier }
        }
        // Check for relegation (if not bottom tier)
        else if (tier < maxTier && rank > standings.length - relegatePerTier) {
          movementType = 'relegated'
          toTier = tier + 1
          reason = { rule: 'bottom_3_relegated', rank, relegate_per_tier: relegatePerTier, total_teams: standings.length }
        }
        // Otherwise staying
        else {
          reason = { rule: 'stayed', rank }
        }

        movements.push({
          team_id: standing.teamId,
          team_name: standing.teamName,
          old_league_id: league.id,
          old_league_name: league.name,
          from_tier: tier,
          to_tier: toTier,
          movement_type: movementType,
          reason,
        })
      })
    }

    // If dry_run, return preview
    if (mode === 'dry_run') {
      return new Response(
        JSON.stringify({
          mode: 'dry_run',
          promotion_group_id,
          from_season_id,
          proposed_new_season_year: fromSeason.year + 1,
          tiers_count: tiers.length,
          movements: movements.map(m => ({
            team_id: m.team_id,
            team_name: m.team_name,
            old_league_id: m.old_league_id,
            old_league_name: m.old_league_name,
            from_tier: m.from_tier,
            to_tier: m.to_tier,
            movement_type: m.movement_type,
            reason: m.reason,
          })),
          summary: {
            promoted: movements.filter(m => m.movement_type === 'promoted').length,
            relegated: movements.filter(m => m.movement_type === 'relegated').length,
            stayed: movements.filter(m => m.movement_type === 'stayed').length,
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Apply mode: Create new season and apply movements
    // Start transaction-like operations (Supabase doesn't have explicit transactions in edge functions,
    // but we'll do sequential operations and rollback on error where possible)

    // Step 1: Create new season
    const { data: newSeason, error: seasonCreateError } = await supabaseService
      .from('seasons')
      .insert({
        year: fromSeason.year + 1,
        status: 'preseason',
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (seasonCreateError || !newSeason) {
      return new Response(
        JSON.stringify({ error: `Failed to create new season: ${seasonCreateError?.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Step 2: Create new promotion group for new season
    const { data: oldPromotionGroup } = await supabaseService
      .from('promotion_groups')
      .select('name, description')
      .eq('id', promotion_group_id)
      .single()

    const { data: newPromotionGroup, error: pgCreateError } = await supabaseService
      .from('promotion_groups')
      .insert({
        season_id: newSeason.id,
        name: oldPromotionGroup?.name || 'Promotion Group',
        description: oldPromotionGroup?.description || null,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (pgCreateError || !newPromotionGroup) {
      return new Response(
        JSON.stringify({ error: `Failed to create new promotion group: ${pgCreateError?.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Step 3: Create new leagues for each tier
    const newLeagueByTier = new Map<number, typeof leagues[0] & { id: string }>()
    
    for (const tier of tiers) {
      const oldLeague = leagueByTier.get(tier)
      if (!oldLeague) continue

      const { data: newLeague, error: leagueCreateError } = await supabaseService
        .from('leagues')
        .insert({
          season_id: newSeason.id,
          promotion_group_id: newPromotionGroup.id,
          name: oldLeague.name,
          tier: tier,
          max_teams: oldLeague.max_teams,
          status: 'preseason',
          scoring_settings: {}, // Copy from old league if needed
          draft_type: 'snake',
          created_by_user_id: user.id,
        })
        .select()
        .single()

      if (leagueCreateError || !newLeague) {
        return new Response(
          JSON.stringify({ error: `Failed to create new league for tier ${tier}: ${leagueCreateError?.message}` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }

      newLeagueByTier.set(tier, newLeague)
    }

    // Step 4: Get old team details and create new teams
    const teamMapping = new Map<string, { oldTeam: any, newTeamId: string }>()
    const promotionResultsToInsert: any[] = []

    for (const movement of movements) {
      // Fetch old team details
      const { data: oldTeam } = await supabaseService
        .from('teams')
        .select('id, name, logo_url, owner_user_id')
        .eq('id', movement.team_id)
        .single()

      if (!oldTeam) {
        console.warn(`Old team ${movement.team_id} not found, skipping`)
        continue
      }

      // Find destination league
      const destinationLeague = newLeagueByTier.get(movement.to_tier)
      if (!destinationLeague) {
        console.warn(`No league found for tier ${movement.to_tier}, skipping`)
        continue
      }

      // Create new team in destination league
      const { data: newTeam, error: teamCreateError } = await supabaseService
        .from('teams')
        .insert({
          league_id: destinationLeague.id,
          owner_user_id: oldTeam.owner_user_id,
          name: oldTeam.name,
          logo_url: oldTeam.logo_url,
          is_active: true,
        })
        .select()
        .single()

      if (teamCreateError || !newTeam) {
        console.warn(`Failed to create new team for ${oldTeam.name}: ${teamCreateError?.message}`)
        continue
      }

      teamMapping.set(movement.team_id, { oldTeam, newTeamId: newTeam.id })

      // Update movement with new league info
      movement.new_league_id = destinationLeague.id
      movement.new_league_name = destinationLeague.name

      // Prepare promotion_results row
      promotionResultsToInsert.push({
        promotion_group_id: promotion_group_id,
        from_season_id: from_season_id,
        to_season_id: newSeason.id,
        from_league_id: movement.old_league_id,
        to_league_id: destinationLeague.id,
        team_id: movement.team_id,
        new_team_id: newTeam.id,
        movement_type: movement.movement_type,
        from_tier: movement.from_tier,
        to_tier: movement.to_tier,
        reason: movement.reason,
      })
    }

    // Step 5: Insert promotion_results (using service role to bypass RLS)
    if (promotionResultsToInsert.length > 0) {
      const { error: resultsInsertError } = await supabaseService
        .from('promotion_results')
        .insert(promotionResultsToInsert)

      if (resultsInsertError) {
        return new Response(
          JSON.stringify({ error: `Failed to insert promotion results: ${resultsInsertError.message}` }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        )
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        mode: 'apply',
        success: true,
        promotion_group_id,
        from_season_id,
        to_season_id: newSeason.id,
        new_promotion_group_id: newPromotionGroup.id,
        new_season_year: newSeason.year,
        movements: movements.map(m => ({
          team_id: m.team_id,
          team_name: m.team_name,
          old_league_id: m.old_league_id,
          old_league_name: m.old_league_name,
          new_league_id: m.new_league_id,
          new_league_name: m.new_league_name,
          from_tier: m.from_tier,
          to_tier: m.to_tier,
          movement_type: m.movement_type,
          reason: m.reason,
        })),
        summary: {
          promoted: movements.filter(m => m.movement_type === 'promoted').length,
          relegated: movements.filter(m => m.movement_type === 'relegated').length,
          stayed: movements.filter(m => m.movement_type === 'stayed').length,
          total_teams: movements.length,
        }
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
