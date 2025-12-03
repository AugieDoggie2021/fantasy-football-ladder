-- Phase 4: Matchups, Scoring, and Week Management
-- This migration creates tables for league weeks, matchups, and player week stats

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LEAGUE_WEEKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.league_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure unique week number per league
  UNIQUE(league_id, week_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_league_weeks_league_id ON public.league_weeks(league_id);
CREATE INDEX IF NOT EXISTS idx_league_weeks_league_week_number ON public.league_weeks(league_id, week_number);
CREATE INDEX IF NOT EXISTS idx_league_weeks_is_current ON public.league_weeks(league_id, is_current) WHERE is_current = true;

-- Partial unique index to ensure only one current week per league
CREATE UNIQUE INDEX IF NOT EXISTS idx_league_weeks_one_current_per_league 
  ON public.league_weeks(league_id) 
  WHERE is_current = true;

-- RLS Policies
ALTER TABLE public.league_weeks ENABLE ROW LEVEL SECURITY;

-- Select: allowed for users in that league (team owner or league creator)
CREATE POLICY "Users can view league weeks for leagues they're in"
  ON public.league_weeks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.league_id = league_weeks.league_id
      AND teams.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = league_weeks.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- Insert/Update: allowed for league creator (commissioner) only
CREATE POLICY "League creators can manage league weeks"
  ON public.league_weeks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = league_weeks.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = league_weeks.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- ============================================================================
-- MATCHUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.matchups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  league_week_id UUID NOT NULL REFERENCES public.league_weeks(id) ON DELETE CASCADE,
  home_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  home_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  away_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'final')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure teams don't play themselves
  CHECK (home_team_id != away_team_id)
  -- Note: Ensuring teams are in the same league is enforced via application logic
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matchups_league_id ON public.matchups(league_id);
CREATE INDEX IF NOT EXISTS idx_matchups_league_week_id ON public.matchups(league_week_id);
CREATE INDEX IF NOT EXISTS idx_matchups_league_week ON public.matchups(league_id, league_week_id);
CREATE INDEX IF NOT EXISTS idx_matchups_home_team_id ON public.matchups(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matchups_away_team_id ON public.matchups(away_team_id);

-- RLS Policies
ALTER TABLE public.matchups ENABLE ROW LEVEL SECURITY;

-- Select: allowed for users in that league
CREATE POLICY "Users can view matchups for leagues they're in"
  ON public.matchups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.league_id = matchups.league_id
      AND teams.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = matchups.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- Insert/Update: allowed for league creator (commissioner) only
CREATE POLICY "League creators can manage matchups"
  ON public.matchups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = matchups.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = matchups.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- ============================================================================
-- PLAYER_WEEK_STATS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.player_week_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  league_week_id UUID NOT NULL REFERENCES public.league_weeks(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  passing_yards INTEGER NOT NULL DEFAULT 0,
  passing_tds INTEGER NOT NULL DEFAULT 0,
  interceptions INTEGER NOT NULL DEFAULT 0,
  rushing_yards INTEGER NOT NULL DEFAULT 0,
  rushing_tds INTEGER NOT NULL DEFAULT 0,
  receiving_yards INTEGER NOT NULL DEFAULT 0,
  receiving_tds INTEGER NOT NULL DEFAULT 0,
  receptions INTEGER NOT NULL DEFAULT 0,
  kicking_points INTEGER NOT NULL DEFAULT 0,
  defense_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure one stat row per player per league-week
  UNIQUE(league_id, league_week_id, player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_player_week_stats_league_id ON public.player_week_stats(league_id);
CREATE INDEX IF NOT EXISTS idx_player_week_stats_league_week_id ON public.player_week_stats(league_week_id);
CREATE INDEX IF NOT EXISTS idx_player_week_stats_player_id ON public.player_week_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_week_stats_league_week_player ON public.player_week_stats(league_id, league_week_id, player_id);

-- RLS Policies
ALTER TABLE public.player_week_stats ENABLE ROW LEVEL SECURITY;

-- Select: allowed for users in that league
CREATE POLICY "Users can view player week stats for leagues they're in"
  ON public.player_week_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.league_id = player_week_stats.league_id
      AND teams.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = player_week_stats.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- Insert/Update/Upsert: allowed for league creator (commissioner) only
CREATE POLICY "League creators can manage player week stats"
  ON public.player_week_stats
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = player_week_stats.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = player_week_stats.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

