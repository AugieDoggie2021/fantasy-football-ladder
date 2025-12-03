-- Phase 8: External Stats Provider Support (SportsData.io)
-- This migration adds support for external stats providers by adding external_source tracking
-- to players and player_week_stats tables
--
-- NOTE: This migration requires that migrations 20241202000002 (players table) and 
-- 20241202000003 (player_week_stats table) have been applied first.

-- ============================================================================
-- PLAYERS TABLE UPDATES
-- ============================================================================

-- Check if players table exists before modifying it
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'players') THEN
    -- Add external_source column (defaults to 'sportsdata' for now)
    ALTER TABLE public.players
      ADD COLUMN IF NOT EXISTS external_source TEXT NOT NULL DEFAULT 'sportsdata';

    -- Make external_id NOT NULL (since we'll always have it from external sources)
    -- First, set any NULL external_ids to a placeholder for existing rows
    UPDATE public.players
    SET external_id = 'legacy-' || id::text
    WHERE external_id IS NULL;

    -- Now make it NOT NULL (only if column exists and is currently nullable)
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'players' 
               AND column_name = 'external_id'
               AND is_nullable = 'YES') THEN
      ALTER TABLE public.players
        ALTER COLUMN external_id SET NOT NULL;
    END IF;
  ELSE
    RAISE NOTICE 'players table does not exist. Skipping players table updates. Please run migrations in order.';
  END IF;
END $$;

-- Add first_name and last_name columns for better player data
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'players') THEN
    ALTER TABLE public.players
      ADD COLUMN IF NOT EXISTS first_name TEXT,
      ADD COLUMN IF NOT EXISTS last_name TEXT;

    -- Add status column for player availability
    ALTER TABLE public.players
      ADD COLUMN IF NOT EXISTS status TEXT;

    -- Drop old single-column index on external_id
    DROP INDEX IF EXISTS idx_players_external_id;

    -- Create composite index for external source + external_id lookups
    CREATE INDEX IF NOT EXISTS idx_players_external_source_external_id 
      ON public.players(external_source, external_id);
  END IF;
END $$;

-- ============================================================================
-- PLAYER_WEEK_STATS TABLE UPDATES
-- ============================================================================

-- Check if player_week_stats table exists before modifying it
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'player_week_stats') THEN
    -- Make league_id and league_week_id nullable to support external stats that aren't linked to leagues yet
    -- External stats can be synced before league weeks are created, then linked later
    -- Only alter if columns exist and are currently NOT NULL
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'player_week_stats' 
               AND column_name = 'league_id'
               AND is_nullable = 'NO') THEN
      ALTER TABLE public.player_week_stats
        ALTER COLUMN league_id DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'player_week_stats' 
               AND column_name = 'league_week_id'
               AND is_nullable = 'NO') THEN
      ALTER TABLE public.player_week_stats
        ALTER COLUMN league_week_id DROP NOT NULL;
    END IF;

    -- Add external_source column
    ALTER TABLE public.player_week_stats
      ADD COLUMN IF NOT EXISTS external_source TEXT NOT NULL DEFAULT 'sportsdata';

    -- Add external_stat_key for traceability/debugging
    ALTER TABLE public.player_week_stats
      ADD COLUMN IF NOT EXISTS external_stat_key TEXT;

    -- Add season_year and nfl_week columns for direct week linkage (independent of league_week_id)
    -- This allows stats to be synced before league weeks are created
    ALTER TABLE public.player_week_stats
      ADD COLUMN IF NOT EXISTS season_year INTEGER,
      ADD COLUMN IF NOT EXISTS nfl_week INTEGER;

    -- Create index for season_year + nfl_week lookups
    CREATE INDEX IF NOT EXISTS idx_player_week_stats_season_week 
      ON public.player_week_stats(season_year, nfl_week) 
      WHERE season_year IS NOT NULL AND nfl_week IS NOT NULL;

    -- Create index for external_source + external_stat_key lookups
    CREATE INDEX IF NOT EXISTS idx_player_week_stats_external_key 
      ON public.player_week_stats(external_source, external_stat_key) 
      WHERE external_stat_key IS NOT NULL;
  ELSE
    RAISE NOTICE 'player_week_stats table does not exist. Skipping player_week_stats table updates. Please run migrations in order.';
  END IF;
END $$;

-- ============================================================================
-- RLS POLICY UPDATES
-- ============================================================================

-- Note: The existing RLS policies should still work, but we need to ensure
-- service-role can insert/update for the edge functions.
-- The edge functions will use service-role client, so they bypass RLS.
-- For MVP, we keep the existing policies as-is.

