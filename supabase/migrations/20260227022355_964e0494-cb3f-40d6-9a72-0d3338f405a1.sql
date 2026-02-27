
-- Fix the overly permissive INSERT policy on go_dj_listens
-- Restrict to: authenticated users insert with their user_id, or anonymous with null user_id
DROP POLICY "Anyone can insert listens" ON public.go_dj_listens;

CREATE POLICY "Authenticated users can insert listens"
  ON public.go_dj_listens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous can insert listens with null user"
  ON public.go_dj_listens FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
