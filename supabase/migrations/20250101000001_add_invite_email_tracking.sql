-- Add email tracking fields to league_invites table
-- This migration adds fields to track email sending status and history

ALTER TABLE public.league_invites
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_sent_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_email_error TEXT;

-- Index for email tracking queries
CREATE INDEX IF NOT EXISTS idx_league_invites_email_sent_at ON public.league_invites(email_sent_at) WHERE email_sent_at IS NOT NULL;

-- Set default expiration to 7 days if not set
-- Update existing invites without expiration
UPDATE public.league_invites
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL AND status = 'pending';

