-- Update league status values to new flow: invites_open, draft, active
-- Migrate existing 'preseason' status to 'invites_open'

-- Update existing leagues with 'preseason' status to 'invites_open'
UPDATE public.leagues
SET status = 'invites_open'
WHERE status = 'preseason';

-- Add check constraint to ensure status values are valid
ALTER TABLE public.leagues
DROP CONSTRAINT IF EXISTS leagues_status_check;

ALTER TABLE public.leagues
ADD CONSTRAINT leagues_status_check 
CHECK (status IN ('invites_open', 'draft', 'active', 'preseason'));

-- Note: Keeping 'preseason' as valid for backward compatibility during migration
-- In production, you may want to remove 'preseason' after all leagues are migrated

