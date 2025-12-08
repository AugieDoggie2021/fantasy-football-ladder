-- Add draft status and management fields to leagues table
-- This migration adds fields needed for full draft kit functionality

-- Add draft status field with check constraint
ALTER TABLE public.leagues
ADD COLUMN IF NOT EXISTS draft_status TEXT DEFAULT 'scheduled'
  CHECK (draft_status IN ('scheduled', 'in_progress', 'paused', 'completed'));

-- Add draft timestamps
ALTER TABLE public.leagues
ADD COLUMN IF NOT EXISTS draft_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS draft_completed_at TIMESTAMPTZ;

-- Add reference to current pick
ALTER TABLE public.leagues
ADD COLUMN IF NOT EXISTS current_pick_id UUID REFERENCES public.draft_picks(id) ON DELETE SET NULL;

-- Add draft settings JSONB field with default values
ALTER TABLE public.leagues
ADD COLUMN IF NOT EXISTS draft_settings JSONB DEFAULT '{
  "timer_seconds": 90,
  "auto_pick_enabled": false,
  "rounds": 14
}'::jsonb;

-- Add index on draft_status for filtering
CREATE INDEX IF NOT EXISTS idx_leagues_draft_status ON public.leagues(draft_status) WHERE draft_status IS NOT NULL;

-- Add index on current_pick_id for lookups
CREATE INDEX IF NOT EXISTS idx_leagues_current_pick_id ON public.leagues(current_pick_id) WHERE current_pick_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.leagues.draft_status IS 'Current state of the draft: scheduled, in_progress, paused, or completed';
COMMENT ON COLUMN public.leagues.draft_started_at IS 'Timestamp when the draft was started';
COMMENT ON COLUMN public.leagues.draft_completed_at IS 'Timestamp when the draft was completed';
COMMENT ON COLUMN public.leagues.current_pick_id IS 'Reference to the draft_pick that is currently on the clock';
COMMENT ON COLUMN public.leagues.draft_settings IS 'JSONB object containing draft configuration: timer_seconds, auto_pick_enabled, rounds';

