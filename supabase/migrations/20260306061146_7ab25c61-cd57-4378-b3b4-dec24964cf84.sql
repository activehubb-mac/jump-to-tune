-- Promotion marketplace system
CREATE TABLE public.promotion_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_location text NOT NULL,
  title text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 7,
  is_active boolean NOT NULL DEFAULT true,
  max_concurrent integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.promotion_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.promotion_slots(id),
  artist_id uuid NOT NULL REFERENCES public.profiles(id),
  content_id text NOT NULL,
  content_type text NOT NULL DEFAULT 'track',
  amount_cents integer NOT NULL DEFAULT 0,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prompt studio: track prompts
CREATE TABLE public.track_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL,
  prompt_text text NOT NULL,
  remix_of uuid REFERENCES public.track_prompts(id),
  version integer NOT NULL DEFAULT 1,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI video generation queue
CREATE TABLE public.ai_video_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prompt text NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 10,
  style text NOT NULL DEFAULT 'abstract visualizer',
  status text NOT NULL DEFAULT 'queued',
  result_url text,
  credits_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.promotion_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_video_queue ENABLE ROW LEVEL SECURITY;

-- Promotion slots: public read, admin write
CREATE POLICY "Anyone can view active promo slots" ON public.promotion_slots
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage promo slots" ON public.promotion_slots
  FOR ALL TO authenticated USING (public.has_admin_role(auth.uid()));

-- Promotion purchases: owner read, admin all
CREATE POLICY "Users view own promo purchases" ON public.promotion_purchases
  FOR SELECT TO authenticated USING (artist_id = auth.uid());

CREATE POLICY "Admins manage promo purchases" ON public.promotion_purchases
  FOR ALL TO authenticated USING (public.has_admin_role(auth.uid()));

CREATE POLICY "Users can create promo purchases" ON public.promotion_purchases
  FOR INSERT TO authenticated WITH CHECK (artist_id = auth.uid());

-- Track prompts: public read published, owner write
CREATE POLICY "Anyone can view published prompts" ON public.track_prompts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Artists manage own prompts" ON public.track_prompts
  FOR ALL TO authenticated USING (artist_id = auth.uid());

-- AI video queue: owner read/write
CREATE POLICY "Users view own video queue" ON public.ai_video_queue
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users create video jobs" ON public.ai_video_queue
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_promotion_purchases_artist ON public.promotion_purchases(artist_id);
CREATE INDEX idx_track_prompts_track ON public.track_prompts(track_id);
CREATE INDEX idx_ai_video_queue_user ON public.ai_video_queue(user_id);