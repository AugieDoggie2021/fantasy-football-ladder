-- Add timer fields to draft_picks table
-- This migration adds fields needed for draft timer functionality

-- Add pick due timestamp (when the pick timer expires)
ALTER TABLE public.draft_picks
ADD COLUMN IF NOT EXISTS pick_due_at TIMESTAMPTZ;

-- Add picked timestamp (when the pick was actually made)
ALTER TABLE public.draft_picks
ADD COLUMN IF NOT EXISTS picked_at TIMESTAMPTZ;

-- Add index on pick_due_at for timer queries (finding expired picks)
CREATE INDEX IF NOT EXISTS idx_draft_picks_pick_due_at ON public.draft_picks(pick_due_at) WHERE pick_due_at IS NOT NULL;

-- Add index on picked_at for analytics/queries
CREATE INDEX IF NOT EXISTS idx_draft_picks_picked_at ON public.draft_picks(picked_at) WHERE picked_at IS NOT NULL;

-- Add composite index for finding active picks (not picked, has due time)
CREATE INDEX IF NOT EXISTS idx_draft_picks_active_timer ON public.draft_picks(league_id, pick_due_at) 
  WHERE player_id IS NULL AND pick_due_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.draft_picks.pick_due_at IS 'Timestamp when the pick timer expires. Used for auto-pick functionality.';
COMMENT ON COLUMN public.draft_picks.picked_at IS 'Timestamp when the pick was actually made. Used for analytics and timing analysis.';

