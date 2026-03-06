
-- Create migration_logs table for tracking legacy migrations
CREATE TABLE IF NOT EXISTS public.migration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_wallet_amount integer NOT NULL DEFAULT 0,
  credits_added integer NOT NULL DEFAULT 0,
  old_subscription_tier text,
  stripe_subscription_id text,
  migration_date timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(user_id)
);

ALTER TABLE public.migration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage migration logs" ON public.migration_logs
  FOR ALL USING (has_admin_role(auth.uid()));

CREATE POLICY "Service role can manage migration logs" ON public.migration_logs
  FOR ALL USING (auth.role() = 'service_role'::text);

CREATE POLICY "Users can view own migration log" ON public.migration_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Add founding_user and legacy fields to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS founding_user boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS legacy_subscription_ended boolean NOT NULL DEFAULT false;
