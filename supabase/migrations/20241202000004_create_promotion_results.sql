-- Phase 5: Promotion/Relegation Results Tracking
-- This migration creates the promotion_results table to track team movements between seasons

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROMOTION_RESULTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.promotion_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_group_id UUID NOT NULL REFERENCES public.promotion_groups(id) ON DELETE CASCADE,
  from_season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  to_season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  from_league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  to_league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  new_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('promoted', 'relegated', 'stayed')),
  from_tier INTEGER NOT NULL,
  to_tier INTEGER NOT NULL,
  reason JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promotion_results_promotion_group_id ON public.promotion_results(promotion_group_id);
CREATE INDEX IF NOT EXISTS idx_promotion_results_from_season_id ON public.promotion_results(from_season_id);
CREATE INDEX IF NOT EXISTS idx_promotion_results_to_season_id ON public.promotion_results(to_season_id);
CREATE INDEX IF NOT EXISTS idx_promotion_results_team_id ON public.promotion_results(team_id);
CREATE INDEX IF NOT EXISTS idx_promotion_results_new_team_id ON public.promotion_results(new_team_id);

-- RLS Policies
ALTER TABLE public.promotion_results ENABLE ROW LEVEL SECURITY;

-- SELECT: allowed for any user who is in that promotion group (owns a team in any league of either from_season or to_season) or the group creator
CREATE POLICY "Users can view promotion results for their promotion groups"
  ON public.promotion_results
  FOR SELECT
  USING (
    -- User is the promotion group creator
    EXISTS (
      SELECT 1 FROM public.promotion_groups
      WHERE promotion_groups.id = promotion_results.promotion_group_id
      AND promotion_groups.created_by_user_id = auth.uid()
    )
    -- OR user owns a team in a league in the from_season
    OR EXISTS (
      SELECT 1 FROM public.teams
      INNER JOIN public.leagues ON leagues.id = teams.league_id
      WHERE teams.owner_user_id = auth.uid()
      AND leagues.season_id = promotion_results.from_season_id
      AND leagues.promotion_group_id = promotion_results.promotion_group_id
    )
    -- OR user owns a team in a league in the to_season
    OR EXISTS (
      SELECT 1 FROM public.teams
      INNER JOIN public.leagues ON leagues.id = teams.league_id
      WHERE teams.owner_user_id = auth.uid()
      AND leagues.season_id = promotion_results.to_season_id
      AND leagues.promotion_group_id = promotion_results.promotion_group_id
    )
  );

-- INSERT/UPDATE/DELETE: restricted - only server logic (service role) can modify
-- For MVP, we'll use service role in edge functions, so regular users can't directly insert
CREATE POLICY "Only service role can modify promotion results"
  ON public.promotion_results
  FOR ALL
  USING (false)
  WITH CHECK (false);

