-- Phase 3: Players, Rosters, Transactions, and Draft Picks
-- This migration creates the player data model, roster management, transaction tracking, and draft system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PLAYERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('QB', 'RB', 'WR', 'TE', 'K', 'DEF')),
  nfl_team TEXT,
  bye_week INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_position ON public.players(position);
CREATE INDEX IF NOT EXISTS idx_players_nfl_team ON public.players(nfl_team);
CREATE INDEX IF NOT EXISTS idx_players_external_id ON public.players(external_id) WHERE external_id IS NOT NULL;

-- RLS Policies
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- All authenticated users can SELECT players (read-only for MVP)
CREATE POLICY "Authenticated users can view players"
  ON public.players
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- MVP: No inserts/updates allowed via RLS (players are system data, seeded/admin-only)
-- Admins can insert/update via service role bypass if needed

-- ============================================================================
-- ROSTERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF', 'BENCH')),
  is_starter BOOLEAN NOT NULL DEFAULT false,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure a player can only be on one roster per league
  UNIQUE(player_id, league_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rosters_team_id ON public.rosters(team_id);
CREATE INDEX IF NOT EXISTS idx_rosters_player_id ON public.rosters(player_id);
CREATE INDEX IF NOT EXISTS idx_rosters_league_id ON public.rosters(league_id);
CREATE INDEX IF NOT EXISTS idx_rosters_slot_type ON public.rosters(slot_type);
CREATE INDEX IF NOT EXISTS idx_rosters_is_starter ON public.rosters(is_starter);

-- Function to derive league_id from team_id (for easier queries)
-- This is a helper that can be used in views/triggers if needed

-- RLS Policies
ALTER TABLE public.rosters ENABLE ROW LEVEL SECURITY;

-- Select: allowed if user owns the team or created the league
CREATE POLICY "Users can view rosters for their teams or leagues they created"
  ON public.rosters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = rosters.team_id
      AND teams.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = rosters.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- Insert: allowed if user owns the team or created the league
CREATE POLICY "Users can add players to rosters for their teams or leagues they created"
  ON public.rosters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = rosters.team_id
      AND teams.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = rosters.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- Update: allowed if user owns the team or created the league
CREATE POLICY "Users can update rosters for their teams or leagues they created"
  ON public.rosters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = rosters.team_id
      AND teams.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = rosters.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- Delete: allowed if user owns the team or created the league
CREATE POLICY "Users can remove players from rosters for their teams or leagues they created"
  ON public.rosters
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = rosters.team_id
      AND teams.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = rosters.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('add', 'drop', 'trade')),
  player_in_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  player_out_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_league_id ON public.transactions(league_id);
CREATE INDEX IF NOT EXISTS idx_transactions_team_id ON public.transactions(team_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_player_in ON public.transactions(player_in_id) WHERE player_in_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_player_out ON public.transactions(player_out_id) WHERE player_out_id IS NOT NULL;

-- RLS Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Select: allowed for users in the league (owners of teams in that league or league creator)
CREATE POLICY "Users can view transactions for leagues they're in"
  ON public.transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = transactions.team_id
      AND teams.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = transactions.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- Insert: allowed for team owners or league creator (commissioner)
CREATE POLICY "Team owners and league creators can create transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = transactions.team_id
      AND teams.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = transactions.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- ============================================================================
-- DRAFT_PICKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.draft_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  overall_pick INTEGER NOT NULL,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure unique overall pick per league
  UNIQUE(league_id, overall_pick),
  
  -- Ensure player is unique per league (once drafted, can't be drafted again)
  UNIQUE(league_id, player_id) WHERE player_id IS NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_draft_picks_league_id ON public.draft_picks(league_id);
CREATE INDEX IF NOT EXISTS idx_draft_picks_team_id ON public.draft_picks(team_id);
CREATE INDEX IF NOT EXISTS idx_draft_picks_player_id ON public.draft_picks(player_id) WHERE player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_draft_picks_overall_pick ON public.draft_picks(league_id, overall_pick);
CREATE INDEX IF NOT EXISTS idx_draft_picks_round ON public.draft_picks(league_id, round);

-- RLS Policies
ALTER TABLE public.draft_picks ENABLE ROW LEVEL SECURITY;

-- Select: allowed for all users in the league
CREATE POLICY "Users can view draft picks for leagues they're in"
  ON public.draft_picks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = draft_picks.team_id
      AND teams.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = draft_picks.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- Insert/Update: allowed for league creator (commissioner)
CREATE POLICY "League creators can manage draft picks"
  ON public.draft_picks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = draft_picks.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = draft_picks.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

