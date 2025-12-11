-- Allow league creators (commissioners) to insert bot/test teams with null owner_user_id
-- Existing insert policy only permits owner_user_id = auth.uid(), so bots were blocked by RLS.

DROP POLICY IF EXISTS "League creators can create bot teams" ON public.teams;

CREATE POLICY "League creators can create bot teams"
  ON public.teams
  FOR INSERT
  WITH CHECK (
    is_bot = true
    AND owner_user_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = teams.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

COMMENT ON POLICY "League creators can create bot teams" ON public.teams IS
  'Commissioners can insert bot/test teams (owner_user_id null, is_bot true) for their leagues.';
