-- Create draft_audit_log table for tracking all draft actions
-- This provides an audit trail for debugging, compliance, and security

CREATE TABLE IF NOT EXISTS public.draft_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'pick_made',
    'pick_attempted',
    'pick_failed',
    'draft_started',
    'draft_paused',
    'draft_resumed',
    'draft_completed',
    'timer_extended',
    'queue_added',
    'queue_removed',
    'queue_reordered',
    'auto_pick_triggered'
  )),
  draft_pick_id UUID REFERENCES public.draft_picks(id) ON DELETE SET NULL,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  metadata JSONB, -- Additional context (error messages, retry counts, etc.)
  ip_address TEXT, -- For security tracking
  user_agent TEXT, -- For security tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_draft_audit_log_league_id ON public.draft_audit_log(league_id);
CREATE INDEX IF NOT EXISTS idx_draft_audit_log_user_id ON public.draft_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_draft_audit_log_action_type ON public.draft_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_draft_audit_log_created_at ON public.draft_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_draft_audit_log_draft_pick_id ON public.draft_audit_log(draft_pick_id);
CREATE INDEX IF NOT EXISTS idx_draft_audit_log_league_user_action ON public.draft_audit_log(league_id, user_id, action_type, created_at DESC);

-- RLS Policies
ALTER TABLE public.draft_audit_log ENABLE ROW LEVEL SECURITY;

-- Select: League commissioners and admins can view audit logs
CREATE POLICY "League commissioners can view audit logs"
  ON public.draft_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = draft_audit_log.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Insert: System can insert audit logs (via service role or server actions)
-- Note: Server actions run with service role, so they can insert
-- Regular users cannot insert directly (only via server actions)

-- Add comment for documentation
COMMENT ON TABLE public.draft_audit_log IS 'Audit log for all draft-related actions. Tracks picks, draft state changes, and queue operations for security and debugging.';
COMMENT ON COLUMN public.draft_audit_log.metadata IS 'JSON object containing additional context like error messages, retry attempts, validation failures, etc.';

