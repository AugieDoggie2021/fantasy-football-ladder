/**
 * Sync External Week Stats Edge Function
 * 
 * Fetches weekly player stats from external stats provider (SportsData.io) for a given
 * season and week, and upserts them into the player_week_stats table.
 * 
 * Note: This function creates stats records but does NOT link them to league_week_id.
 * The stats are stored with season_year and nfl_week for later association with leagues.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ingestion-key',
}

interface SyncWeekStatsRequest {
  seasonYear: number;
  week: number;
  mode?: 'live' | 'replay';
}

interface SyncWeekStatsResult {
  seasonYear: number;
  week: number;
  mode: 'live' | 'replay';
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify ingestion secret
    const ingestionKey = req.headers.get('X-INGESTION-KEY')
    const expectedKey = Deno.env.get('INGESTION_SHARED_SECRET')
    
    if (!expectedKey) {
      console.error('INGESTION_SHARED_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Ingestion secret not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    if (!ingestionKey || ingestionKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing X-INGESTION-KEY header' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Parse request body
    const body: SyncWeekStatsRequest = await req.json()
    const { seasonYear, week, mode = 'live' } = body

    if (!seasonYear || !week) {
      return new Response(
        JSON.stringify({ error: 'seasonYear and week are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (week < 1 || week > 18) {
      return new Response(
        JSON.stringify({ error: 'week must be between 1 and 18' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Log mode for future API replay support
    if (mode === 'replay') {
      console.log(`[sync_external_week_stats] Replay mode for ${seasonYear} Week ${week}`)
    }

    // Initialize Supabase service client (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get external stats provider configuration
    const apiBaseUrl = Deno.env.get('EXTERNAL_STATS_API_BASE_URL') || 'https://api.sportsdata.io/v3/nfl'
    const apiKey = Deno.env.get('EXTERNAL_STATS_API_KEY') || ''

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'EXTERNAL_STATS_API_KEY not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Fetch weekly stats from external provider
    // TODO: Verify the exact endpoint format from SportsData.io docs
    const statsUrl = `${apiBaseUrl}/PlayerGameStatsByWeek/${seasonYear}/${week}`
    console.log(`[sync_external_week_stats] Fetching stats from ${statsUrl}`)
    
    const statsResponse = await fetch(statsUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
      },
    })

    if (!statsResponse.ok) {
      const errorText = await statsResponse.text()
      console.error(`[sync_external_week_stats] API error: ${statsResponse.status} ${errorText}`)
      return new Response(
        JSON.stringify({ 
          error: `External API error: ${statsResponse.status} ${statsResponse.statusText}`,
          details: errorText 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: statsResponse.status,
        }
      )
    }

    const statsData = await statsResponse.json()
    console.log(`[sync_external_week_stats] Fetched ${statsData.length} stat records from API`)

    // Map external data to our format
    // TODO: Adjust mapping based on actual SportsData.io response format
    const externalStats = statsData.map((stat: any): any => {
      const playerId = String(stat.PlayerID || stat.playerID || stat.id)
      const statKey = `${playerId}-${seasonYear}-${week}`

      return {
        externalSource: 'sportsdata',
        externalPlayerId: playerId,
        externalStatKey: statKey,
        seasonYear,
        week,
        passingYards: stat.PassingYards || stat.passingYards || 0,
        passingTds: stat.PassingTouchdowns || stat.passingTouchdowns || stat.passingTds || 0,
        interceptions: stat.Interceptions || stat.interceptions || 0,
        rushingYards: stat.RushingYards || stat.rushingYards || 0,
        rushingTds: stat.RushingTouchdowns || stat.rushingTouchdowns || stat.rushingTds || 0,
        receivingYards: stat.ReceivingYards || stat.receivingYards || 0,
        receivingTds: stat.ReceivingTouchdowns || stat.receivingTouchdowns || stat.receivingTds || 0,
        receptions: stat.Receptions || stat.receptions || 0,
        kickingPoints: stat.FantasyPoints || stat.fantasyPoints || stat.kickingPoints || 0, // TODO: Verify field
        defensePoints: stat.DefenseFantasyPoints || stat.defenseFantasyPoints || stat.defensePoints || 0, // TODO: Verify field
      }
    })

    // Upsert stats into database
    let insertedCount = 0
    let updatedCount = 0
    let skippedCount = 0

    for (const extStat of externalStats) {
      // Find player by external_source + external_id
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('external_source', extStat.externalSource)
        .eq('external_id', extStat.externalPlayerId)
        .single()

      if (!player) {
        console.warn(`[sync_external_week_stats] Player not found: ${extStat.externalSource}:${extStat.externalPlayerId}`)
        skippedCount++
        continue
      }

      // Check if stat already exists (by external_source + external_stat_key)
      const { data: existingStat } = await supabase
        .from('player_week_stats')
        .select('id, league_id, league_week_id')
        .eq('external_source', extStat.externalSource)
        .eq('external_stat_key', extStat.externalStatKey)
        .single()

      if (existingStat) {
        // Update existing stat
        // Note: We preserve league_id and league_week_id if they exist (don't overwrite)
        const { error: updateError } = await supabase
          .from('player_week_stats')
          .update({
            passing_yards: extStat.passingYards,
            passing_tds: extStat.passingTds,
            interceptions: extStat.interceptions,
            rushing_yards: extStat.rushingYards,
            rushing_tds: extStat.rushingTds,
            receiving_yards: extStat.receivingYards,
            receiving_tds: extStat.receivingTds,
            receptions: extStat.receptions,
            kicking_points: extStat.kickingPoints,
            defense_points: extStat.defensePoints,
            season_year: extStat.seasonYear,
            nfl_week: extStat.week,
          })
          .eq('id', existingStat.id)

        if (updateError) {
          console.error(`[sync_external_week_stats] Error updating stat ${extStat.externalStatKey}:`, updateError)
          skippedCount++
        } else {
          updatedCount++
        }
      } else {
        // Insert new stat
        // Note: league_id and league_week_id are NULL initially - they'll be linked later
        const { error: insertError } = await supabase
          .from('player_week_stats')
          .insert({
            player_id: player.id,
            league_id: null, // Will be linked later when associating with leagues
            league_week_id: null, // Will be linked later when associating with leagues
            external_source: extStat.externalSource,
            external_stat_key: extStat.externalStatKey,
            season_year: extStat.seasonYear,
            nfl_week: extStat.week,
            passing_yards: extStat.passingYards,
            passing_tds: extStat.passingTds,
            interceptions: extStat.interceptions,
            rushing_yards: extStat.rushingYards,
            rushing_tds: extStat.rushingTds,
            receiving_yards: extStat.receivingYards,
            receiving_tds: extStat.receivingTds,
            receptions: extStat.receptions,
            kicking_points: extStat.kickingPoints,
            defense_points: extStat.defensePoints,
          })

        if (insertError) {
          console.error(`[sync_external_week_stats] Error inserting stat ${extStat.externalStatKey}:`, insertError)
          skippedCount++
        } else {
          insertedCount++
        }
      }
    }

    const result: SyncWeekStatsResult = {
      seasonYear,
      week,
      mode,
      insertedCount,
      updatedCount,
      skippedCount,
    }

    console.log(`[sync_external_week_stats] Sync complete: ${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped`)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('[sync_external_week_stats] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

