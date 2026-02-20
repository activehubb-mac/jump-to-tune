
-- 1. Add social_links to profiles
ALTER TABLE public.profiles ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb;

-- 2. Add columns to store_products
ALTER TABLE public.store_products ADD COLUMN visibility text DEFAULT 'public';
ALTER TABLE public.store_products ADD COLUMN visibility_expires_at timestamptz;
ALTER TABLE public.store_products ADD COLUMN is_featured boolean DEFAULT false;
ALTER TABLE public.store_products ADD COLUMN shipping_price_cents integer DEFAULT 0;

-- 3. Add columns to store_orders
ALTER TABLE public.store_orders ADD COLUMN tracking_number text;
ALTER TABLE public.store_orders ADD COLUMN download_count integer DEFAULT 0;
ALTER TABLE public.store_orders ADD COLUMN max_downloads integer DEFAULT 5;

-- 4. Add columns to superfan_messages
ALTER TABLE public.superfan_messages ADD COLUMN is_pinned boolean DEFAULT false;
ALTER TABLE public.superfan_messages ADD COLUMN is_hidden boolean DEFAULT false;
ALTER TABLE public.superfan_messages ADD COLUMN message_type text DEFAULT 'chat';

-- 5. Add columns to artist_superfan_settings
ALTER TABLE public.artist_superfan_settings ADD COLUMN message_price_credits integer DEFAULT 1;
ALTER TABLE public.artist_superfan_settings ADD COLUMN messaging_enabled boolean DEFAULT true;
ALTER TABLE public.artist_superfan_settings ADD COLUMN response_window_hours integer DEFAULT 72;

-- 6. Create message_credits table
CREATE TABLE public.message_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_id uuid NOT NULL,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.message_credits ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_message_credits_fan_id ON public.message_credits (fan_id);

CREATE POLICY "Fans can view their own credits" ON public.message_credits FOR SELECT USING (auth.uid() = fan_id);
CREATE POLICY "Service role can manage message credits" ON public.message_credits FOR ALL USING (auth.role() = 'service_role'::text);

CREATE TRIGGER update_message_credits_updated_at BEFORE UPDATE ON public.message_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create message_threads table
CREATE TABLE public.message_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_id uuid NOT NULL,
  artist_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open',
  credit_cost integer NOT NULL DEFAULT 1,
  message text NOT NULL,
  reply text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  replied_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  refunded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_message_threads_fan_artist ON public.message_threads (fan_id, artist_id);
CREATE INDEX idx_message_threads_status ON public.message_threads (status);
CREATE INDEX idx_message_threads_expires ON public.message_threads (expires_at) WHERE status = 'open';

CREATE POLICY "Fans can view their own threads" ON public.message_threads FOR SELECT USING (auth.uid() = fan_id);
CREATE POLICY "Artists can view threads sent to them" ON public.message_threads FOR SELECT USING (auth.uid() = artist_id);
CREATE POLICY "Artists can update threads (reply)" ON public.message_threads FOR UPDATE USING (auth.uid() = artist_id);
CREATE POLICY "Service role can manage message threads" ON public.message_threads FOR ALL USING (auth.role() = 'service_role'::text);

-- 8. Create ai_feature_flags table
CREATE TABLE public.ai_feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage ai flags" ON public.ai_feature_flags FOR ALL USING (auth.role() = 'service_role'::text);

-- Pre-populate AI flags (disabled)
INSERT INTO public.ai_feature_flags (feature_key, enabled, metadata) VALUES
  ('ai_voice_welcome', false, '{"description": "AI-generated voice welcome message for new superfans"}'),
  ('ai_thank_you_video', false, '{"description": "AI personalized superfan thank-you video"}'),
  ('ai_loyalty_tracking', false, '{"description": "AI-powered fan loyalty behavior tracking"}');

-- 9. Update profiles_public view to include social_links
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
  SELECT id, display_name, display_name_font, avatar_url, banner_image_url, bio, website_url, social_links, is_verified, onboarding_completed, created_at, updated_at
  FROM public.profiles;
