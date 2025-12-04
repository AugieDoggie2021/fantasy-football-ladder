-- Phase 10: Add fantasy_points caching to player_week_stats
-- This migration adds a fantasy_points column to cache computed scores

-- Add fantasy_points column to player_week_stats
ALTER TABLE public.player_week_stats
  ADD COLUMN IF NOT EXISTS fantasy_points NUMERIC(10, 2);

-- Create index for faster lookups when reading cached scores
CREATE INDEX IF NOT EXISTS idx_player_week_stats_fantasy_points 
  ON public.player_week_stats(league_week_id, fantasy_points) 
  WHERE fantasy_points IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.player_week_stats.fantasy_points IS 
  'Cached computed fantasy points for this player/week. Set when scoring is applied. NULL means not yet computed.';

