
-- Badge system tables
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_type text NOT NULL,         -- 'platform' or 'artist'
  badge_key text NOT NULL,          -- e.g. 'first_purchase', 'repeat_buyer_3', 'drop_owner', 'v1_holder', 'multi_drop_3'
  tier text NOT NULL DEFAULT 'silver', -- 'gold' (platform) or 'silver' (artist)
  artist_id uuid,                   -- NULL for platform badges
  product_id uuid,                  -- for drop_owner / version badges
  metadata jsonb DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT true,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key, artist_id, product_id)
);

-- Index for fast lookups
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_artist ON public.user_badges(artist_id) WHERE artist_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view public badges"
  ON public.user_badges FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update badge visibility"
  ON public.user_badges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage badges"
  ON public.user_badges FOR ALL
  USING (auth.role() = 'service_role'::text);

CREATE POLICY "Admins can manage badges"
  ON public.user_badges FOR ALL
  USING (has_admin_role(auth.uid()));

-- Platform settings table for early adopter threshold etc.
CREATE TABLE public.badge_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badge_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage badge settings"
  ON public.badge_settings FOR ALL
  USING (auth.role() = 'service_role'::text);

CREATE POLICY "Admins can manage badge settings"
  ON public.badge_settings FOR ALL
  USING (has_admin_role(auth.uid()));

CREATE POLICY "Public can read badge settings"
  ON public.badge_settings FOR SELECT
  USING (true);

-- Seed early adopter threshold
INSERT INTO public.badge_settings (setting_key, setting_value)
VALUES ('early_adopter_threshold', '{"max_users": 100}'::jsonb);
