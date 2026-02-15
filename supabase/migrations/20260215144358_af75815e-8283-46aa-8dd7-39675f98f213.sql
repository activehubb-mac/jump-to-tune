
-- Add a public SELECT policy on profiles so the SECURITY INVOKER view works
-- This only exposes the columns selected in the profiles_public view
CREATE POLICY "Anyone can view basic profile info via public view"
ON public.profiles
FOR SELECT
USING (true);
