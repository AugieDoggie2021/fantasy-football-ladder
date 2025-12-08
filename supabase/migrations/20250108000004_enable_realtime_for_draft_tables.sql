-- Enable Supabase Realtime for draft-related tables
-- This allows clients to subscribe to changes on draft_picks and leagues tables

-- Enable Realtime for draft_picks table
-- This will publish INSERT, UPDATE, and DELETE events
ALTER PUBLICATION supabase_realtime ADD TABLE public.draft_picks;

-- Enable Realtime for leagues table (specifically for draft_status changes)
-- This will publish UPDATE events for draft status changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.leagues;

-- Note: Realtime is enabled by default for new tables in Supabase,
-- but we explicitly add them to the publication to ensure they're included.
-- If the tables are already in the publication, this will not error.

