-- Create league_invites table with fixed RLS policies
-- This migration creates the league_invites table with RLS policies that use
-- SECURITY DEFINER functions to avoid recursion issues when checking league ownership
-- 
-- Note: This replaces the original create_league_invites migration with fixed policies

-- ============================================================================
-- LEAGUE INVITES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.league_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  email TEXT, -- Optional: for email-based invites
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'revoked', 'expired'
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Optional expiration
  email_sent_at TIMESTAMPTZ,
  email_sent_count INTEGER NOT NULL DEFAULT 0,
  last_email_error TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_league_invites_league_id ON public.league_invites(league_id);
CREATE INDEX IF NOT EXISTS idx_league_invites_token ON public.league_invites(token);
CREATE INDEX IF NOT EXISTS idx_league_invites_email ON public.league_invites(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_league_invites_status ON public.league_invites(status);
CREATE INDEX IF NOT EXISTS idx_league_invites_created_by ON public.league_invites(created_by);
CREATE INDEX IF NOT EXISTS idx_league_invites_email_sent_at ON public.league_invites(email_sent_at) WHERE email_sent_at IS NOT NULL;

-- RLS Policies (using SECURITY DEFINER functions to avoid recursion)
ALTER TABLE public.league_invites ENABLE ROW LEVEL SECURITY;

-- Select: League commissioners and global admins can view invites for their leagues
-- Users can also view invites that match their email
CREATE POLICY "Commissioners and admins can view invites for their leagues"
  ON public.league_invites
  FOR SELECT
  USING (
    -- League commissioner (using SECURITY DEFINER function to avoid RLS recursion)
    public.check_league_creator(league_id, auth.uid())
    -- Global admin (using SECURITY DEFINER function to avoid RLS recursion)
    OR public.check_user_is_admin(auth.uid())
    -- User can see invites matching their email
    OR (email IS NOT NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Insert: League commissioners can create invites for their leagues
CREATE POLICY "Commissioners can create invites for their leagues"
  ON public.league_invites
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND public.check_league_creator(league_id, auth.uid())
  );

-- Update: League commissioners can update invites for their leagues (e.g., revoke)
CREATE POLICY "Commissioners can update invites for their leagues"
  ON public.league_invites
  FOR UPDATE
  USING (
    public.check_league_creator(league_id, auth.uid())
  )
  WITH CHECK (
    public.check_league_creator(league_id, auth.uid())
  );

-- ============================================================================
-- ADD is_public and is_joinable COLUMNS TO LEAGUES TABLE (if not already added)
-- ============================================================================
ALTER TABLE public.leagues
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_joinable BOOLEAN NOT NULL DEFAULT false;

-- Index for public/joinable leagues
CREATE INDEX IF NOT EXISTS idx_leagues_is_public ON public.leagues(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_leagues_is_joinable ON public.leagues(is_joinable) WHERE is_joinable = true;
