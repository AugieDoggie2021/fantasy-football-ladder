-- ============================================================================
-- Add DELETE policy for leagues table
-- ============================================================================
-- This allows league commissioners to delete their own leagues
-- Without this policy, RLS blocks all DELETE operations on leagues

CREATE POLICY "Commissioners can delete their own leagues"
  ON public.leagues
  FOR DELETE
  USING (created_by_user_id = auth.uid());

