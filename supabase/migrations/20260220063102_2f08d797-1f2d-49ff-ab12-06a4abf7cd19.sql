
-- fan_loyalty table
CREATE TABLE public.fan_loyalty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id uuid NOT NULL,
  artist_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'listener',
  show_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fan_id, artist_id)
);

ALTER TABLE public.fan_loyalty ENABLE ROW LEVEL SECURITY;

-- Fans can view their own loyalty rows
CREATE POLICY "Fans can view their own loyalty" ON public.fan_loyalty
  FOR SELECT USING (auth.uid() = fan_id);

-- Fans can insert their own loyalty rows
CREATE POLICY "Fans can insert their own loyalty" ON public.fan_loyalty
  FOR INSERT WITH CHECK (auth.uid() = fan_id);

-- Fans can update their own loyalty rows
CREATE POLICY "Fans can update their own loyalty" ON public.fan_loyalty
  FOR UPDATE USING (auth.uid() = fan_id);

-- Artists can view loyalty rows for their fans
CREATE POLICY "Artists can view fan loyalty" ON public.fan_loyalty
  FOR SELECT USING (auth.uid() = artist_id);

-- Public can view rows where show_public = true
CREATE POLICY "Public can view public loyalty" ON public.fan_loyalty
  FOR SELECT USING (show_public = true);

-- Service role can manage all loyalty rows
CREATE POLICY "Service role can manage fan loyalty" ON public.fan_loyalty
  FOR ALL USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE TRIGGER update_fan_loyalty_updated_at
  BEFORE UPDATE ON public.fan_loyalty
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- artist_superfan_settings table
CREATE TABLE public.artist_superfan_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL UNIQUE,
  loyalty_enabled boolean NOT NULL DEFAULT false,
  public_leaderboard boolean NOT NULL DEFAULT false,
  show_top_supporters boolean NOT NULL DEFAULT true,
  show_founding_fans boolean NOT NULL DEFAULT true,
  custom_level_names jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_superfan_settings ENABLE ROW LEVEL SECURITY;

-- Artists can manage their own settings
CREATE POLICY "Artists can manage their superfan settings" ON public.artist_superfan_settings
  FOR ALL USING (auth.uid() = artist_id);

-- Public can view settings where loyalty is enabled
CREATE POLICY "Public can view enabled settings" ON public.artist_superfan_settings
  FOR SELECT USING (loyalty_enabled = true);

-- Updated_at trigger
CREATE TRIGGER update_artist_superfan_settings_updated_at
  BEFORE UPDATE ON public.artist_superfan_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- activity_feed table
CREATE TABLE public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Public can view all activity feed entries
CREATE POLICY "Public can view activity feed" ON public.activity_feed
  FOR SELECT USING (true);

-- Artists can insert their own activity feed entries
CREATE POLICY "Artists can insert activity feed" ON public.activity_feed
  FOR INSERT WITH CHECK (auth.uid() = artist_id);

-- Artists can update their own activity feed entries
CREATE POLICY "Artists can update activity feed" ON public.activity_feed
  FOR UPDATE USING (auth.uid() = artist_id);

-- Artists can delete their own activity feed entries
CREATE POLICY "Artists can delete activity feed" ON public.activity_feed
  FOR DELETE USING (auth.uid() = artist_id);

-- Service role can manage all activity feed entries
CREATE POLICY "Service role can manage activity feed" ON public.activity_feed
  FOR ALL USING (auth.role() = 'service_role');
