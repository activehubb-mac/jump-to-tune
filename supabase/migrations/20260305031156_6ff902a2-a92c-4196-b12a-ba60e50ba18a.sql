
-- Add AI credits to credit_wallets
ALTER TABLE public.credit_wallets 
  ADD COLUMN IF NOT EXISTS ai_credits integer NOT NULL DEFAULT 0;

-- AI credit usage log
CREATE TABLE IF NOT EXISTS public.ai_credit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL, -- e.g. 'release_builder', 'cover_art', 'prompt_analysis'
  credits_used integer NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_credit_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can view own AI credit usage"
  ON public.ai_credit_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role handles inserts (via edge functions)

-- AI credit cost configuration table (admin-managed)
CREATE TABLE IF NOT EXISTS public.ai_credit_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key text UNIQUE NOT NULL,
  credit_cost integer NOT NULL,
  label text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_credit_costs ENABLE ROW LEVEL SECURITY;

-- Public read for credit costs
CREATE POLICY "Anyone can view AI credit costs"
  ON public.ai_credit_costs FOR SELECT
  TO anon, authenticated
  USING (true);

-- Seed default credit costs
INSERT INTO public.ai_credit_costs (action_key, credit_cost, label, description) VALUES
  ('prompt_analysis', 1, 'Prompt Analysis', 'Analyze and enhance your AI music prompt'),
  ('cover_art', 3, 'Cover Art Generation', 'Generate album/single cover artwork'),
  ('cover_regeneration', 1, 'Cover Art Regeneration', 'Regenerate cover art with tweaks'),
  ('release_builder', 5, 'AI Release Builder', 'Full AI release packaging: title, description, tags, cover'),
  ('playlist_builder', 3, 'AI Playlist Builder', 'AI-generated playlist with artwork'),
  ('dj_mix_assist', 5, 'AI DJ Mix Assist', 'AI-assisted DJ mix building'),
  ('artist_identity', 5, 'AI Artist Identity Builder', 'Generate artist name, avatar, bio, visual theme'),
  ('video_10s', 20, 'AI Video (10s)', '10-second AI music video'),
  ('video_30s', 50, 'AI Video (30s)', '30-second AI music video'),
  ('video_60s', 100, 'AI Video (60s)', '60-second AI music video'),
  ('visualizer', 10, 'AI Visualizer', 'Looping social media visualizer')
ON CONFLICT (action_key) DO NOTHING;

-- Function to deduct AI credits atomically
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(p_user_id uuid, p_credits integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_previous integer;
  v_new integer;
  v_updated integer;
BEGIN
  UPDATE credit_wallets
  SET ai_credits = ai_credits - p_credits,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND ai_credits >= p_credits
  RETURNING ai_credits + p_credits, ai_credits
  INTO v_previous, v_new;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    SELECT ai_credits INTO v_previous
    FROM credit_wallets
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
      'success', false,
      'current_credits', COALESCE(v_previous, 0),
      'required', p_credits
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'previous_credits', v_previous,
    'new_credits', v_new
  );
END;
$$;

-- Function to add AI credits
CREATE OR REPLACE FUNCTION public.add_ai_credits(p_user_id uuid, p_credits integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_previous integer;
  v_new integer;
BEGIN
  UPDATE credit_wallets
  SET ai_credits = ai_credits + p_credits,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING ai_credits - p_credits, ai_credits
  INTO v_previous, v_new;

  IF v_new IS NULL THEN
    INSERT INTO credit_wallets (user_id, balance_cents, ai_credits)
    VALUES (p_user_id, 0, p_credits)
    ON CONFLICT (user_id) DO UPDATE
    SET ai_credits = credit_wallets.ai_credits + p_credits,
        updated_at = NOW()
    RETURNING credit_wallets.ai_credits - p_credits, credit_wallets.ai_credits
    INTO v_previous, v_new;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'previous_credits', COALESCE(v_previous, 0),
    'new_credits', COALESCE(v_new, p_credits)
  );
END;
$$;

-- Grant new users 50 trial AI credits
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.credit_wallets (user_id, balance_cents, ai_credits)
  VALUES (NEW.id, 0, 50);
  RETURN NEW;
END;
$$;
