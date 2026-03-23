CREATE TABLE public.dmca_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  content_url TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dmca_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to insert reports
CREATE POLICY "Anyone can submit DMCA reports"
  ON public.dmca_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view reports
CREATE POLICY "Admins can view DMCA reports"
  ON public.dmca_reports
  FOR SELECT
  TO authenticated
  USING (public.has_admin_role(auth.uid()));