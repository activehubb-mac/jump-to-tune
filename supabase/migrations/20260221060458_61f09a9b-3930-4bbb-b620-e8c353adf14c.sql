
-- ══════════════════════════════════════════════════════════════════════════
-- PERFORMANCE LAYER: Caching, Rate Limiting, Indexes
-- ══════════════════════════════════════════════════════════════════════════

-- 1. TRENDING CACHE TABLE
CREATE TABLE public.trending_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL DEFAULT 'global',
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '60 seconds'),
  UNIQUE(cache_key)
);

ALTER TABLE public.trending_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read trending cache"
  ON public.trending_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage trending cache"
  ON public.trending_cache FOR ALL
  USING (auth.role() = 'service_role'::text);

-- 2. ANALYTICS CACHE TABLE (pre-aggregated artist stats)
CREATE TABLE public.analytics_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type text NOT NULL DEFAULT 'artist',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(entity_id, entity_type)
);

ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own analytics cache"
  ON public.analytics_cache FOR SELECT
  USING (auth.uid() = entity_id);

CREATE POLICY "Admins can read all analytics cache"
  ON public.analytics_cache FOR SELECT
  USING (has_admin_role(auth.uid()));

CREATE POLICY "Service role can manage analytics cache"
  ON public.analytics_cache FOR ALL
  USING (auth.role() = 'service_role'::text);

-- 3. RATE LIMIT TABLE
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limits FOR ALL
  USING (auth.role() = 'service_role'::text);

-- Index for fast rate limit lookups
CREATE INDEX idx_rate_limits_user_action ON public.rate_limits(user_id, action, window_start);

-- Auto-cleanup old rate limit entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 hour';
END;
$$;

-- 4. BACKGROUND JOB QUEUE TABLE
CREATE TABLE public.job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  error text
);

ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage job queue"
  ON public.job_queue FOR ALL
  USING (auth.role() = 'service_role'::text);

CREATE INDEX idx_job_queue_status ON public.job_queue(status, created_at);
CREATE INDEX idx_job_queue_type ON public.job_queue(job_type, status);

-- 5. RATE LIMIT CHECK FUNCTION (atomic)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_requests integer,
  p_window_seconds integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamp with time zone;
  v_count integer;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;
  
  -- Count requests in window
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM public.rate_limits
  WHERE user_id = p_user_id
    AND action = p_action
    AND window_start >= v_window_start;
  
  IF v_count >= p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'current', v_count,
      'limit', p_max_requests,
      'retry_after', p_window_seconds
    );
  END IF;
  
  -- Record this request
  INSERT INTO public.rate_limits (user_id, action, window_start, request_count)
  VALUES (p_user_id, p_action, now(), 1);
  
  RETURN jsonb_build_object(
    'allowed', true,
    'current', v_count + 1,
    'limit', p_max_requests
  );
END;
$$;

-- 6. CRITICAL DATABASE INDEXES
-- Store orders (high-read for analytics and webhook lookups)
CREATE INDEX IF NOT EXISTS idx_store_orders_artist_status ON public.store_orders(artist_id, status);
CREATE INDEX IF NOT EXISTS idx_store_orders_buyer ON public.store_orders(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_store_orders_payment_intent ON public.store_orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_product ON public.store_orders(product_id, status);
CREATE INDEX IF NOT EXISTS idx_store_orders_created ON public.store_orders(created_at DESC);

-- Store products (trending, browse)
CREATE INDEX IF NOT EXISTS idx_store_products_artist_active ON public.store_products(artist_id, is_active);
CREATE INDEX IF NOT EXISTS idx_store_products_active_status ON public.store_products(is_active, status);

-- Purchases (badge eval, analytics)
CREATE INDEX IF NOT EXISTS idx_purchases_user ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_track ON public.purchases(track_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(purchased_at DESC);

-- Artist earnings
CREATE INDEX IF NOT EXISTS idx_artist_earnings_artist ON public.artist_earnings(artist_id, status);

-- Follows
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);

-- Likes (trending calc)
CREATE INDEX IF NOT EXISTS idx_likes_track ON public.likes(track_id);
CREATE INDEX IF NOT EXISTS idx_likes_created ON public.likes(created_at DESC);

-- Fan loyalty
CREATE INDEX IF NOT EXISTS idx_fan_loyalty_artist ON public.fan_loyalty(artist_id);
CREATE INDEX IF NOT EXISTS idx_fan_loyalty_fan ON public.fan_loyalty(fan_id);

-- User badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_artist ON public.user_badges(artist_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- Tracks
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON public.tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_draft ON public.tracks(is_draft);
CREATE INDEX IF NOT EXISTS idx_tracks_created ON public.tracks(created_at DESC);

-- Drop waitlists
CREATE INDEX IF NOT EXISTS idx_waitlists_product ON public.drop_waitlists(product_id);
CREATE INDEX IF NOT EXISTS idx_waitlists_user ON public.drop_waitlists(user_id);

-- Webhook events
CREATE INDEX IF NOT EXISTS idx_webhook_events_id ON public.webhook_events(id);
