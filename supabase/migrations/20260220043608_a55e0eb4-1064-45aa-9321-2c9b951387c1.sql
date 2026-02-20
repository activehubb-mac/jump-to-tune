
-- =============================================
-- SUPERFAN ROOM: 3 Tables + RLS Policies
-- =============================================

-- 1. superfan_memberships
CREATE TABLE public.superfan_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id uuid NOT NULL UNIQUE,
  monthly_price_cents integer NOT NULL DEFAULT 499,
  description text,
  perks jsonb NOT NULL DEFAULT '["Early access to new drops", "Exclusive versions & remixes", "Direct message access", "VIP supporter badge"]'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.superfan_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can manage their own membership"
  ON public.superfan_memberships FOR ALL
  USING (auth.uid() = artist_id);

CREATE POLICY "Public can view active memberships"
  ON public.superfan_memberships FOR SELECT
  USING (is_active = true);

CREATE TRIGGER update_superfan_memberships_updated_at
  BEFORE UPDATE ON public.superfan_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. superfan_subscribers
CREATE TABLE public.superfan_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_id uuid NOT NULL REFERENCES public.superfan_memberships(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL,
  fan_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  tier_level text NOT NULL DEFAULT 'bronze',
  lifetime_spent_cents integer NOT NULL DEFAULT 0,
  stripe_subscription_id text,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(artist_id, fan_id)
);

ALTER TABLE public.superfan_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fans can view their own subscriptions"
  ON public.superfan_subscribers FOR SELECT
  USING (auth.uid() = fan_id);

CREATE POLICY "Artists can view their subscribers"
  ON public.superfan_subscribers FOR SELECT
  USING (auth.uid() = artist_id);

CREATE POLICY "Service role can manage subscribers"
  ON public.superfan_subscribers FOR ALL
  USING (auth.role() = 'service_role'::text);

-- 3. superfan_messages
CREATE TABLE public.superfan_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id uuid NOT NULL,
  fan_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.superfan_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view messages"
  ON public.superfan_messages FOR SELECT
  USING (auth.uid() = artist_id OR auth.uid() = fan_id);

CREATE POLICY "Conversation participants can send messages"
  ON public.superfan_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (auth.uid() = artist_id OR auth.uid() = fan_id)
    AND (
      -- Fan must be an active subscriber to send
      auth.uid() = artist_id
      OR EXISTS (
        SELECT 1 FROM public.superfan_subscribers
        WHERE artist_id = superfan_messages.artist_id
          AND fan_id = superfan_messages.fan_id
          AND status = 'active'
      )
    )
  );

CREATE POLICY "Service role can manage messages"
  ON public.superfan_messages FOR ALL
  USING (auth.role() = 'service_role'::text);
