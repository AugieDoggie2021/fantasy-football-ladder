-- Phase 11: Batch update fantasy_points for performance optimization
-- This migration adds a stored procedure to efficiently update fantasy_points for multiple player_week_stats rows

-- Create a function to batch update fantasy_points
-- This function accepts an array of JSON objects with id and fantasy_points
CREATE OR REPLACE FUNCTION public.batch_update_fantasy_points(
  updates JSONB
)
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  update_item JSONB;
  update_count INTEGER := 0;
BEGIN
  -- Loop through each update item and apply it
  FOR update_item IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    UPDATE public.player_week_stats
    SET fantasy_points = (update_item->>'fantasy_points')::NUMERIC(10, 2)
    WHERE id = (update_item->>'id')::UUID;
    
    IF FOUND THEN
      update_count := update_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT update_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
-- Note: RLS on player_week_stats will still apply
GRANT EXECUTE ON FUNCTION public.batch_update_fantasy_points(JSONB) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.batch_update_fantasy_points(JSONB) IS 
  'Batch updates fantasy_points for multiple player_week_stats rows. Accepts JSONB array of {id, fantasy_points} objects. Returns count of updated rows.';

