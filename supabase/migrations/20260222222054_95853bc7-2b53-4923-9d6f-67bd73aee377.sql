
-- Create admin_home_settings table
CREATE TABLE public.admin_home_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_home_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings (homepage needs this)
CREATE POLICY "Public can read home settings"
  ON public.admin_home_settings FOR SELECT
  USING (true);

-- Admins can manage settings
CREATE POLICY "Admins can manage home settings"
  ON public.admin_home_settings FOR ALL
  TO authenticated
  USING (has_admin_role(auth.uid()))
  WITH CHECK (has_admin_role(auth.uid()));

-- Service role full access
CREATE POLICY "Service role can manage home settings"
  ON public.admin_home_settings FOR ALL
  USING (auth.role() = 'service_role'::text);

-- Auto-update timestamp trigger
CREATE TRIGGER update_admin_home_settings_updated_at
  BEFORE UPDATE ON public.admin_home_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default data
INSERT INTO public.admin_home_settings (setting_key, setting_value) VALUES
  ('new_releases_enabled', 'true'::jsonb),
  ('new_releases_lookback_days', '7'::jsonb),
  ('new_releases_limit', '6'::jsonb),
  ('trending_enabled', 'true'::jsonb),
  ('trending_limit', '12'::jsonb),
  ('discover_artists_enabled', 'true'::jsonb),
  ('discover_artists_limit', '6'::jsonb),
  ('spotify_embed_uri', '""'::jsonb);
