-- Phase 2: Seasons, Promotion Groups, Leagues, and Teams
-- This migration creates the core data model for multi-tiered fantasy football leagues

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SEASONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'preseason',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Ensure unique year per creator (or could be global - adjust as needed)
  UNIQUE(year, created_by_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seasons_created_by_user_id ON public.seasons(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_seasons_year ON public.seasons(year);

-- RLS Policies
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Select: allowed if created_by_user_id = auth.uid()
CREATE POLICY "Users can view their own seasons"
  ON public.seasons
  FOR SELECT
  USING (created_by_user_id = auth.uid());

-- Insert: allowed if auth.uid() IS NOT NULL
CREATE POLICY "Authenticated users can create seasons"
  ON public.seasons
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by_user_id = auth.uid());

-- ============================================================================
-- PROMOTION GROUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.promotion_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promotion_groups_season_id ON public.promotion_groups(season_id);
CREATE INDEX IF NOT EXISTS idx_promotion_groups_created_by_user_id ON public.promotion_groups(created_by_user_id);

-- RLS Policies
ALTER TABLE public.promotion_groups ENABLE ROW LEVEL SECURITY;

-- Select: allowed if created_by_user_id = auth.uid()
CREATE POLICY "Users can view their own promotion groups"
  ON public.promotion_groups
  FOR SELECT
  USING (created_by_user_id = auth.uid());

-- Insert: allowed if auth.uid() IS NOT NULL
CREATE POLICY "Authenticated users can create promotion groups"
  ON public.promotion_groups
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by_user_id = auth.uid());

-- ============================================================================
-- LEAGUES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  promotion_group_id UUID REFERENCES public.promotion_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  tier INTEGER,
  max_teams INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'preseason',
  scoring_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft_type TEXT NOT NULL DEFAULT 'snake',
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leagues_season_id ON public.leagues(season_id);
CREATE INDEX IF NOT EXISTS idx_leagues_promotion_group_id ON public.leagues(promotion_group_id);
CREATE INDEX IF NOT EXISTS idx_leagues_tier ON public.leagues(tier) WHERE tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leagues_created_by_user_id ON public.leagues(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_leagues_promotion_group_tier ON public.leagues(promotion_group_id, tier) WHERE promotion_group_id IS NOT NULL AND tier IS NOT NULL;

-- RLS Policies
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

-- Insert: allowed if auth.uid() IS NOT NULL and created_by_user_id = auth.uid()
CREATE POLICY "Authenticated users can create leagues"
  ON public.leagues
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by_user_id = auth.uid());

-- Select: allowed if:
-- - created_by_user_id = auth.uid(), OR
-- - the user owns a team in the league
CREATE POLICY "Users can view their own leagues or leagues they have teams in"
  ON public.leagues
  FOR SELECT
  USING (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.league_id = leagues.id
      AND teams.owner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  draft_position INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure one team per user per league
  UNIQUE(league_id, owner_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teams_league_id ON public.teams(league_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner_user_id ON public.teams(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_teams_league_active ON public.teams(league_id, is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Insert: allowed if owner_user_id = auth.uid()
CREATE POLICY "Users can create their own teams"
  ON public.teams
  FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

-- Select: allowed if:
-- - owner_user_id = auth.uid(), OR
-- - the user is the league creator for the league_id
CREATE POLICY "Users can view their own teams or teams in leagues they created"
  ON public.teams
  FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = teams.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- Update: Users can update their own teams
CREATE POLICY "Users can update their own teams"
  ON public.teams
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

