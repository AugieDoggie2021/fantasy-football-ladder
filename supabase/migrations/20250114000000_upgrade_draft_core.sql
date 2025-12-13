-- Upgrade draft core schema: statuses, timers, auto-pick flags, user-scoped queues, uniqueness, and feed events

-- Normalize draft_status values to new enum-like set
UPDATE public.leagues
SET draft_status = CASE draft_status
  WHEN 'scheduled' THEN 'pre_draft'
  WHEN 'in_progress' THEN 'live'
  ELSE draft_status
END
WHERE draft_status IN ('scheduled', 'in_progress');

-- Ensure draft_status is limited to allowed values
ALTER TABLE public.leagues
  ADD CONSTRAINT IF NOT EXISTS leagues_draft_status_check
  CHECK (draft_status IS NULL OR draft_status IN ('pre_draft', 'live', 'paused', 'completed'))
  NOT VALID;

-- Add timer/auto-pick metadata to draft_picks
ALTER TABLE public.draft_picks
  ADD COLUMN IF NOT EXISTS pick_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pick_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS is_auto_pick BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_source TEXT;

-- Enforce single drafting of a player per league
CREATE UNIQUE INDEX IF NOT EXISTS idx_draft_picks_unique_player_per_league
  ON public.draft_picks(league_id, player_id)
  WHERE player_id IS NOT NULL;

-- Extend draft_queues to be user-scoped in addition to team-scoped
ALTER TABLE public.draft_queues
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Backfill user_id from team owner for existing queue rows
UPDATE public.draft_queues dq
SET user_id = teams.owner_user_id
FROM public.teams
WHERE dq.team_id = teams.id
  AND dq.user_id IS NULL;

-- New uniqueness to prevent duplicate entries per user/league
CREATE UNIQUE INDEX IF NOT EXISTS idx_draft_queues_user_player_unique
  ON public.draft_queues(league_id, user_id, player_id)
  WHERE user_id IS NOT NULL;

-- Preserve original uniqueness for team-based queues
DROP INDEX IF EXISTS draft_queues_team_id_player_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_draft_queues_team_player_unique
  ON public.draft_queues(team_id, player_id);

-- RLS Policies for queues (drop old if present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'draft_queues' AND policyname = 'Users can view their own team''s draft queue') THEN
    DROP POLICY "Users can view their own team's draft queue" ON public.draft_queues;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'draft_queues' AND policyname = 'Users can add players to their own team''s draft queue') THEN
    DROP POLICY "Users can add players to their own team's draft queue" ON public.draft_queues;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'draft_queues' AND policyname = 'Users can update their own team''s draft queue') THEN
    DROP POLICY "Users can update their own team's draft queue" ON public.draft_queues;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'draft_queues' AND policyname = 'Users can remove players from their own team's draft queue') THEN
    DROP POLICY "Users can remove players from their own team's draft queue" ON public.draft_queues;
  END IF;
END $$;

CREATE POLICY IF NOT EXISTS "Users can view their draft queue"
  ON public.draft_queues
  FOR SELECT
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR EXISTS (
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

CREATE POLICY IF NOT EXISTS "Users can add to their draft queue"
  ON public.draft_queues
  FOR INSERT
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = draft_queues.team_id
      AND teams.owner_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update their draft queue"
  ON public.draft_queues
  FOR UPDATE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = draft_queues.team_id
      AND teams.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = draft_queues.team_id
      AND teams.owner_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can delete from their draft queue"
  ON public.draft_queues
  FOR DELETE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = draft_queues.team_id
      AND teams.owner_user_id = auth.uid()
    )
  );

COMMENT ON COLUMN public.draft_queues.user_id IS 'Owner of the queue entry. User-specific queues take precedence over team-only queues for auto-pick.';

-- =====================================================================
-- Draft feed events table
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.draft_feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  pick_id UUID REFERENCES public.draft_picks(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- pick_made, auto_pick, start, pause, resume, stop, reset, timer_extended
  payload JSONB,
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_auto_pick BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_draft_feed_events_league_created_at
  ON public.draft_feed_events(league_id, created_at DESC);

ALTER TABLE public.draft_feed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Feed events readable to league participants"
  ON public.draft_feed_events
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.leagues WHERE leagues.id = draft_feed_events.league_id AND leagues.created_by_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.teams WHERE teams.league_id = draft_feed_events.league_id AND teams.owner_user_id = auth.uid() AND teams.is_active = true)
  );

GRANT SELECT ON public.draft_feed_events TO authenticated;

-- =====================================================================
-- Transactional pick helper
-- =====================================================================
CREATE OR REPLACE FUNCTION public.draft_make_pick(
  p_league_id UUID,
  p_pick_id UUID,
  p_player_id UUID,
  p_is_auto BOOLEAN DEFAULT false,
  p_actor_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, error TEXT) AS $$
DECLARE
  v_league RECORD;
  v_pick RECORD;
  v_next RECORD;
  v_timer_seconds INTEGER;
  v_due_at TIMESTAMPTZ;
  v_picked_at TIMESTAMPTZ := now();
BEGIN
  -- Lock league row to prevent concurrent status/current_pick updates
  SELECT * INTO v_league FROM public.leagues WHERE id = p_league_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'league_not_found';
    RETURN;
  END IF;

  IF v_league.draft_status <> 'live' THEN
    RETURN QUERY SELECT false, 'draft_not_live';
    RETURN;
  END IF;

  -- Lock the pick row
  SELECT * INTO v_pick FROM public.draft_picks WHERE id = p_pick_id AND league_id = p_league_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'pick_not_found';
    RETURN;
  END IF;

  IF v_pick.player_id IS NOT NULL THEN
    RETURN QUERY SELECT false, 'pick_already_made';
    RETURN;
  END IF;

  IF v_league.current_pick_id IS NOT NULL AND v_league.current_pick_id <> v_pick.id THEN
    RETURN QUERY SELECT false, 'not_current_pick';
    RETURN;
  END IF;

  -- Ensure player is not already drafted in this league
  PERFORM 1 FROM public.draft_picks WHERE league_id = p_league_id AND player_id = p_player_id;
  IF FOUND THEN
    RETURN QUERY SELECT false, 'player_already_drafted';
    RETURN;
  END IF;

  -- Assign pick
  UPDATE public.draft_picks
  SET player_id = p_player_id,
      picked_at = v_picked_at,
      pick_due_at = NULL,
      is_auto_pick = COALESCE(p_is_auto, false),
      auto_source = CASE WHEN p_is_auto THEN 'timer' ELSE NULL END
  WHERE id = v_pick.id;

  -- Create roster entry (benched by default); ignore if already exists
  INSERT INTO public.rosters(team_id, player_id, league_id, slot_type, is_starter)
  VALUES (v_pick.team_id, p_player_id, p_league_id, 'BENCH', false)
  ON CONFLICT DO NOTHING;

  -- Transaction log
  INSERT INTO public.transactions(league_id, team_id, type, player_in_id, notes)
  VALUES (p_league_id, v_pick.team_id, 'add', p_player_id, CONCAT('Drafted in round ', v_pick.round, ', pick ', v_pick.overall_pick));

  -- Feed event
  INSERT INTO public.draft_feed_events(league_id, pick_id, event_type, payload, actor_user_id, is_auto_pick)
  VALUES (p_league_id, v_pick.id, CASE WHEN COALESCE(p_is_auto, false) THEN 'auto_pick' ELSE 'pick_made' END, jsonb_build_object(
    'round', v_pick.round,
    'overall_pick', v_pick.overall_pick,
    'team_id', v_pick.team_id,
    'player_id', p_player_id
  ), p_actor_id, COALESCE(p_is_auto, false));

  -- Find next pick
  SELECT * INTO v_next
  FROM public.draft_picks
  WHERE league_id = p_league_id
    AND player_id IS NULL
  ORDER BY overall_pick ASC
  LIMIT 1;

  IF NOT FOUND THEN
    -- Complete draft
    UPDATE public.leagues
    SET draft_status = 'completed',
        current_pick_id = NULL,
        draft_completed_at = v_picked_at
    WHERE id = p_league_id;

    INSERT INTO public.draft_feed_events(league_id, event_type, payload, actor_user_id)
    VALUES (p_league_id, 'completed', jsonb_build_object('completed_at', v_picked_at), p_actor_id);
  ELSE
    -- Set timer for next pick
    v_timer_seconds := COALESCE((v_league.draft_settings->>'timer_seconds')::INTEGER, 90);
    v_due_at := v_picked_at + make_interval(secs => v_timer_seconds);
    UPDATE public.draft_picks
    SET pick_started_at = v_picked_at,
        pick_duration_seconds = v_timer_seconds,
        pick_due_at = v_due_at
    WHERE id = v_next.id;

    UPDATE public.leagues
    SET current_pick_id = v_next.id
    WHERE id = p_league_id;
  END IF;

  RETURN QUERY SELECT true, NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.draft_make_pick(UUID, UUID, UUID, BOOLEAN, UUID) TO authenticated, service_role;
