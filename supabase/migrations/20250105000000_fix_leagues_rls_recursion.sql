-- Fix infinite recursion in RLS policies for leagues table
-- The issue: leagues SELECT policy checks teams, teams SELECT policy checks leagues
-- This creates infinite recursion when inserting a league

-- Drop existing policies that cause circular dependency
DROP POLICY IF EXISTS "Users can view their own leagues or leagues they have teams in" ON public.leagues;
DROP POLICY IF EXISTS "Users can view their own teams or teams in leagues they created" ON public.teams;

-- Create SECURITY DEFINER function to check league ownership without triggering RLS
-- This function bypasses RLS to check if a user created a league
CREATE OR REPLACE FUNCTION public.check_league_creator(league_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.leagues
    WHERE id = league_id_param
    AND created_by_user_id = user_id_param
  );
END;
$$;

-- Create SECURITY DEFINER function to check team ownership without triggering RLS
-- This function bypasses RLS to check if a user owns a team in a league
CREATE OR REPLACE FUNCTION public.check_user_has_team_in_league(league_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teams
    WHERE league_id = league_id_param
    AND owner_user_id = user_id_param
  );
END;
$$;

-- Recreate leagues SELECT policy using the function to avoid circular dependency
CREATE POLICY "Users can view their own leagues or leagues they have teams in"
  ON public.leagues
  FOR SELECT
  USING (
    created_by_user_id = auth.uid()
    OR public.check_user_has_team_in_league(id, auth.uid())
  );

-- Recreate teams SELECT policy using the function to avoid circular dependency
CREATE POLICY "Users can view their own teams or teams in leagues they created"
  ON public.teams
  FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR public.check_league_creator(league_id, auth.uid())
  );

