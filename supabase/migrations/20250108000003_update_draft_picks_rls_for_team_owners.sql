-- Update RLS policies for draft_picks to allow team owners to make picks
-- This migration enables team owner participation in drafts

-- Drop the old UPDATE policy that only allowed commissioners
DROP POLICY IF EXISTS "League creators can manage draft picks" ON public.draft_picks;

-- Create separate policies for INSERT and UPDATE

-- INSERT: Only league creators (commissioners) can create draft picks
CREATE POLICY "League creators can insert draft picks"
  ON public.draft_picks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = draft_picks.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- UPDATE: League creators can update any pick, OR team owners can update their team's unpicked picks
CREATE POLICY "League creators and team owners can update draft picks"
  ON public.draft_picks
  FOR UPDATE
  USING (
    -- League creators can update any pick
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = draft_picks.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
    OR
    -- Team owners can update their team's picks that haven't been made yet
    (
      EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = draft_picks.team_id
        AND teams.owner_user_id = auth.uid()
        AND teams.league_id = draft_picks.league_id
      )
      AND draft_picks.player_id IS NULL
    )
  )
  WITH CHECK (
    -- Same conditions for the updated row
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = draft_picks.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = draft_picks.team_id
        AND teams.owner_user_id = auth.uid()
        AND teams.league_id = draft_picks.league_id
      )
      AND draft_picks.player_id IS NOT NULL
    )
  );

-- Add comment explaining the policy
COMMENT ON POLICY "League creators and team owners can update draft picks" ON public.draft_picks IS 
  'Allows league creators to update any pick, and team owners to update their team''s unpicked picks. ' ||
  'Server actions enforce additional business logic (turn order, draft status, etc.).';

