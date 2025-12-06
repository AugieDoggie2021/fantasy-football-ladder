-- Fix infinite recursion in users table RLS policy
-- The "Admins can view all profiles" policy queries users table, causing recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;

-- Create SECURITY DEFINER function to check if user is admin without triggering RLS
CREATE OR REPLACE FUNCTION public.check_user_is_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id_param
    AND is_admin = true
  );
END;
$$;

-- Recreate the policy using the function
CREATE POLICY "Admins can view all profiles"
  ON public.users
  FOR SELECT
  USING (
    public.check_user_is_admin(auth.uid())
  );

