-- Create draft_queues table
-- This table allows teams to queue players for auto-pick functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DRAFT_QUEUES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.draft_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure a player can only be in a team's queue once
  UNIQUE(team_id, player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_draft_queues_team_id ON public.draft_queues(team_id);
CREATE INDEX IF NOT EXISTS idx_draft_queues_league_id ON public.draft_queues(league_id);
CREATE INDEX IF NOT EXISTS idx_draft_queues_team_league ON public.draft_queues(team_id, league_id);
CREATE INDEX IF NOT EXISTS idx_draft_queues_priority ON public.draft_queues(team_id, priority DESC);

-- RLS Policies
ALTER TABLE public.draft_queues ENABLE ROW LEVEL SECURITY;

-- Select: Users can view their own team's queue
CREATE POLICY "Users can view their own team's draft queue"
  ON public.draft_queues
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = draft_queues.team_id
      AND teams.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = draft_queues.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- Insert: Users can add players to their own team's queue
CREATE POLICY "Users can add players to their own team's draft queue"
  ON public.draft_queues
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = draft_queues.team_id
      AND teams.owner_user_id = auth.uid()
    )
  );

-- Update: Users can update their own team's queue (for priority changes)
CREATE POLICY "Users can update their own team's draft queue"
  ON public.draft_queues
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = draft_queues.team_id
      AND teams.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = draft_queues.team_id
      AND teams.owner_user_id = auth.uid()
    )
  );

-- Delete: Users can remove players from their own team's queue
CREATE POLICY "Users can remove players from their own team's draft queue"
  ON public.draft_queues
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = draft_queues.team_id
      AND teams.owner_user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.draft_queues IS 'Player queue for auto-pick functionality. Teams can queue players with priorities, and the system will auto-pick from the queue when the timer expires.';
COMMENT ON COLUMN public.draft_queues.priority IS 'Higher numbers = higher priority. When auto-picking, the system selects the highest priority available player.';

