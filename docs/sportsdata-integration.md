# SportsData.io Integration

This document describes the SportsData.io integration for Fantasy Football Ladder, which provides player data and weekly statistics ingestion.

## Overview

The integration is built with a **provider-agnostic architecture** that allows the app to work with any external stats provider without being tightly coupled to a specific provider's API. The current implementation uses SportsData.io as the stats provider.

## Architecture

### Provider-Agnostic Layer

The core integration is located in `web/lib/stats-provider/`:

- **`types.ts`** - TypeScript types for external players and stats (`ExternalPlayer`, `ExternalPlayerWeekStats`)
- **`provider.ts`** - Interface definition (`ExternalStatsProvider`) that all stats providers must implement
- **`sportsdata-client.ts`** - SportsData.io-specific implementation of the provider interface

This design allows for easy swapping of stats providers in the future by implementing a new provider class that conforms to the `ExternalStatsProvider` interface.

### Data Flow

1. **Player Sync**: Edge function `sync_external_players` fetches all NFL players from SportsData.io and upserts them into the `players` table
2. **Weekly Stats Sync**: Edge function `sync_external_week_stats` fetches weekly player stats for a given season/week and upserts them into the `player_week_stats` table

### Database Schema

#### Players Table

The `players` table has been extended with:

- `external_source` (TEXT, NOT NULL, DEFAULT 'sportsdata') - Identifies the stats provider
- `external_id` (TEXT, NOT NULL) - Player ID from the external provider
- `first_name` (TEXT) - Player's first name
- `last_name` (TEXT) - Player's last name
- `status` (TEXT) - Player availability status

**Index**: `idx_players_external_source_external_id` on `(external_source, external_id)` for fast lookups

#### Player Week Stats Table

The `player_week_stats` table has been extended with:

- `external_source` (TEXT, NOT NULL, DEFAULT 'sportsdata') - Identifies the stats provider
- `external_stat_key` (TEXT) - Composite key for traceability/debugging
- `season_year` (INTEGER) - NFL season year (e.g., 2024)
- `nfl_week` (INTEGER) - NFL week number (1-18)
- `league_id` (UUID, NULLABLE) - Can be NULL for external stats not yet linked to leagues
- `league_week_id` (UUID, NULLABLE) - Can be NULL for external stats not yet linked to league weeks

**Indexes**:
- `idx_player_week_stats_season_week` on `(season_year, nfl_week)` for week-based queries
- `idx_player_week_stats_external_key` on `(external_source, external_stat_key)` for traceability

**Note**: `league_id` and `league_week_id` are now nullable to support syncing stats before league weeks are created. Stats can be linked to leagues later.

## Edge Functions

### `sync_external_players`

Fetches all NFL players from SportsData.io and upserts them into the `players` table.

**Authentication**: Requires `X-INGESTION-KEY` header matching `INGESTION_SHARED_SECRET` environment variable.

**Response**:
```json
{
  "insertedCount": 1500,
  "updatedCount": 200
}
```

### `sync_external_week_stats`

Fetches weekly player stats for a given season and week from SportsData.io and upserts them into the `player_week_stats` table.

**Authentication**: Requires `X-INGESTION-KEY` header matching `INGESTION_SHARED_SECRET` environment variable.

**Request Body**:
```json
{
  "seasonYear": 2024,
  "week": 3,
  "mode": "live"
}
```

**Response**:
```json
{
  "seasonYear": 2024,
  "week": 3,
  "mode": "live",
  "insertedCount": 500,
  "updatedCount": 50,
  "skippedCount": 10
}
```

**Modes**:
- `live` - Fetch live stats from the API (default)
- `replay` - Future support for API replay mode (simulating weeks without hitting live endpoints)

## Server Actions

Server actions in `web/app/actions/stats-ingestion.ts`:

- `triggerExternalPlayersSync()` - Triggers player sync
- `triggerExternalWeekStatsSync(seasonYear, week, mode?)` - Triggers weekly stats sync

Both actions:
- Only available in `dev` environment OR for admin users
- Call the corresponding edge function via HTTP
- Return the sync result summary

## Dev UI Panel

The `DevStatsIngestionPanel` component (`web/components/dev-stats-ingestion-panel.tsx`) provides a UI for triggering syncs in development:

- **Sync External Players** button - Triggers player sync
- **Sync Weekly Stats** form - Inputs for season year, week, and mode (live/replay)

The panel is integrated into the dashboard page and only visible in `dev` environment.

## Environment Variables

### Required Environment Variables

Set these in your Supabase project (Edge Functions secrets) and Next.js environment:

```env
# SportsData.io API Configuration
EXTERNAL_STATS_API_BASE_URL=https://api.sportsdata.io/v3/nfl
EXTERNAL_STATS_API_KEY=your-sportsdata-api-key-here

# Ingestion Security
INGESTION_SHARED_SECRET=super-strong-secret-string

# Optional: Provider name (defaults to 'sportsdata')
EXTERNAL_STATS_PROVIDER_NAME=sportsdata
```

### Setting Supabase Edge Function Secrets

```bash
# Set secrets for edge functions
supabase secrets set EXTERNAL_STATS_API_BASE_URL=https://api.sportsdata.io/v3/nfl
supabase secrets set EXTERNAL_STATS_API_KEY=your-api-key
supabase secrets set INGESTION_SHARED_SECRET=your-secret
```

Or via Supabase Dashboard: **Project Settings → Edge Functions → Secrets**

### Setting Next.js Environment Variables

Add to `.env.local` (for local development) or your deployment platform's environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
INGESTION_SHARED_SECRET=your-secret
```

**Note**: `INGESTION_SHARED_SECRET` must match between Next.js and Supabase edge functions.

## Deployment

### Deploy Edge Functions

```bash
cd supabase

# Deploy both functions
supabase functions deploy sync_external_players
supabase functions deploy sync_external_week_stats

# Or deploy all functions
supabase functions deploy
```

### Apply Database Migrations

```bash
# Apply the external stats support migration
supabase db push
```

Or apply migrations individually:
```bash
supabase migration up
```

## API Replay Support

The integration includes hooks for future **API Replay** functionality:

- The `mode` parameter in `fetchWeeklyPlayerStats()` and `sync_external_week_stats` supports `'live'` and `'replay'` modes
- Currently, `'replay'` mode is logged but uses the same API endpoint as `'live'`
- Future implementation can use cached data or different endpoints for replay scenarios

This allows for:
- Testing weeks without hitting live API endpoints
- Re-running historical weeks
- Simulating matchups with different stat sets

## SportsData.io API Mapping

**Note**: The current implementation includes placeholder mappings based on common API patterns. You'll need to verify and adjust the field mappings based on the actual SportsData.io API response format.

### Expected Endpoints

- **All Players**: `GET /Players`
- **Weekly Stats**: `GET /PlayerGameStatsByWeek/{season}/{week}`

### Field Mapping TODOs

The following mappings need to be verified against actual SportsData.io API responses:

1. **Player fields**: `PlayerID`, `Name`, `FirstName`, `LastName`, `Position`, `Team`, `ByeWeek`, `Status`
2. **Stats fields**: `PassingYards`, `PassingTouchdowns`, `Interceptions`, `RushingYards`, `RushingTouchdowns`, `ReceivingYards`, `ReceivingTouchdowns`, `Receptions`, `FantasyPoints`, `DefenseFantasyPoints`

See `web/lib/stats-provider/sportsdata-client.ts` for current placeholder mappings.

## Troubleshooting

### Edge Function Errors

Check Supabase logs:
```bash
supabase functions logs sync_external_players
supabase functions logs sync_external_week_stats
```

### Authentication Errors

- Verify `INGESTION_SHARED_SECRET` matches between Next.js and Supabase
- Check that `X-INGESTION-KEY` header is being sent correctly

### API Errors

- Verify `EXTERNAL_STATS_API_KEY` is set correctly
- Check SportsData.io API documentation for endpoint changes
- Verify API subscription includes the required endpoints

### Database Errors

- Ensure migrations have been applied (`supabase db push`)
- Check that RLS policies allow service-role writes (edge functions use service-role client)

## Future Enhancements

- [ ] Verify and finalize SportsData.io API field mappings
- [ ] Implement API replay mode with cached data
- [ ] Add automatic weekly stats sync (cron job)
- [ ] Add stats linking to league weeks after sync
- [ ] Support for multiple stats providers
- [ ] Add retry logic for failed API calls
- [ ] Add rate limiting and API quota management

