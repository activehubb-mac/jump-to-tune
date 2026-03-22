-- Add auto-reload columns to credit_wallets
ALTER TABLE public.credit_wallets
  ADD COLUMN IF NOT EXISTS auto_reload_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_reload_threshold integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS auto_reload_pack_product_id text,
  ADD COLUMN IF NOT EXISTS auto_reload_pack_credits integer,
  ADD COLUMN IF NOT EXISTS auto_reload_last_triggered_at timestamptz;

-- Create auto_reload_logs table
CREATE TABLE IF NOT EXISTS public.auto_reload_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false,
  credits_before numeric,
  credits_after numeric,
  stripe_session_id text,
  error_message text
);

ALTER TABLE public.auto_reload_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auto-reload logs"
  ON public.auto_reload_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_auto_reload_logs_user ON public.auto_reload_logs(user_id, triggered_at DESC);