/**
 * Sync External Players Edge Function
 * 
 * Fetches all players from external stats provider (SportsData.io) and upserts them
 * into the players table. Uses service-role client to bypass RLS.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ingestion-key',
}

interface SyncResult {
  insertedCount: number;
  updatedCount: number;
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

    // Fetch all players from external provider
    console.log(`[sync_external_players] Fetching players from ${apiBaseUrl}/Players`)
    const playersUrl = `${apiBaseUrl}/Players`
    
    const playersResponse = await fetch(playersUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
      },
    })

    if (!playersResponse.ok) {
      const errorText = await playersResponse.text()
      console.error(`[sync_external_players] API error: ${playersResponse.status} ${errorText}`)
      return new Response(
        JSON.stringify({ 
          error: `External API error: ${playersResponse.status} ${playersResponse.statusText}`,
          details: errorText 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: playersResponse.status,
        }
      )
    }

    const playersData = await playersResponse.json()
    console.log(`[sync_external_players] Fetched ${playersData.length} players from API`)

    // Map external data to our format
    // TODO: Adjust mapping based on actual SportsData.io response format
    const externalPlayers = playersData.map((player: any) => ({
      externalSource: 'sportsdata',
      externalId: String(player.PlayerID || player.playerID || player.id),
      fullName: player.Name || player.FullName || player.fullName || '',
      firstName: player.FirstName || player.firstName,
      lastName: player.LastName || player.lastName,
      position: player.Position || player.position,
      team: player.Team || player.team,
      byeWeek: player.ByeWeek || player.byeWeek || null,
      status: player.Status || player.status || null,
    }))

    // Upsert players into database
    let insertedCount = 0
    let updatedCount = 0

    for (const extPlayer of externalPlayers) {
      // Check if player exists
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('external_source', extPlayer.externalSource)
        .eq('external_id', extPlayer.externalId)
        .single()

      if (existingPlayer) {
        // Update existing player
        const { error: updateError } = await supabase
          .from('players')
          .update({
            full_name: extPlayer.fullName,
            first_name: extPlayer.firstName,
            last_name: extPlayer.lastName,
            position: extPlayer.position || 'QB', // Default fallback
            nfl_team: extPlayer.team,
            bye_week: extPlayer.byeWeek,
            status: extPlayer.status,
          })
          .eq('id', existingPlayer.id)

        if (updateError) {
          console.error(`[sync_external_players] Error updating player ${extPlayer.externalId}:`, updateError)
        } else {
          updatedCount++
        }
      } else {
        // Insert new player
        const { error: insertError } = await supabase
          .from('players')
          .insert({
            external_source: extPlayer.externalSource,
            external_id: extPlayer.externalId,
            full_name: extPlayer.fullName,
            first_name: extPlayer.firstName,
            last_name: extPlayer.lastName,
            position: extPlayer.position || 'QB', // Default fallback
            nfl_team: extPlayer.team,
            bye_week: extPlayer.byeWeek,
            status: extPlayer.status,
          })

        if (insertError) {
          console.error(`[sync_external_players] Error inserting player ${extPlayer.externalId}:`, insertError)
        } else {
          insertedCount++
        }
      }
    }

    const result: SyncResult = {
      insertedCount,
      updatedCount,
    }

    console.log(`[sync_external_players] Sync complete: ${insertedCount} inserted, ${updatedCount} updated`)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('[sync_external_players] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

