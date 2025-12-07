-- Create 2025 Season and Make Seasons Globally Accessible
-- This migration:
-- 1. Updates RLS policy to allow all authenticated users to view seasons
-- 2. Creates a 2025 season with status 'preseason' for league creation

-- ============================================================================
-- Update RLS Policy: Allow all authenticated users to view seasons
-- ============================================================================
-- Seasons should be globally accessible to all authenticated users
-- (not just the creator) so that anyone can create leagues for active seasons

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own seasons" ON public.seasons;

-- Create a new policy that allows all authenticated users to view seasons
CREATE POLICY "All authenticated users can view seasons"
  ON public.seasons
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Create 2025 Season
-- ============================================================================
-- Create a 2025 season with status 'preseason' so users can start creating leagues
-- We'll use a SECURITY DEFINER function to bypass RLS for the insert

-- Function to create the 2025 season (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_2025_season()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  season_id UUID;
  admin_user_id UUID;
BEGIN
  -- Try to find an admin user to use as the creator
  -- If no admin exists, we'll use the first user (fallback)
  SELECT id INTO admin_user_id
  FROM public.users
  WHERE is_admin = true
  LIMIT 1;
  
  -- If no admin, use the first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id
    FROM public.users
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  -- If still no user exists, we can't create the season
  -- (This should only happen in a fresh database)
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in database. Cannot create 2025 season.';
  END IF;
  
  -- Check if 2025 season already exists
  SELECT id INTO season_id
  FROM public.seasons
  WHERE year = 2025
  LIMIT 1;
  
  -- If it exists, return it
  IF season_id IS NOT NULL THEN
    RETURN season_id;
  END IF;
  
  -- Create the 2025 season
  INSERT INTO public.seasons (year, status, created_by_user_id)
  VALUES (2025, 'preseason', admin_user_id)
  RETURNING id INTO season_id;
  
  RETURN season_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_2025_season() TO authenticated;

-- Execute the function to create the season
SELECT public.create_2025_season();

-- Clean up: Drop the function after use (optional, but keeps things clean)
-- DROP FUNCTION IF EXISTS public.create_2025_season();

-- ============================================================================
-- Notes
-- ============================================================================
-- The 2025 season is now available for all authenticated users to create leagues
-- Status is set to 'preseason' which allows league creation
-- When the 2025 NFL season starts, update the status to 'active'
-- When the season ends, update the status to 'complete'

