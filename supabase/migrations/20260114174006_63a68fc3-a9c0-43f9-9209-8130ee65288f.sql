-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'canceled', 'past_due');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL UNIQUE,
  tier app_role NOT NULL DEFAULT 'fan',
  status subscription_status NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Service role can insert/update for webhook handling
CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions FOR ALL
USING (auth.role() = 'service_role');

-- Create collection_bookmarks table for "Add to Collection" feature
CREATE TABLE public.collection_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  track_id UUID REFERENCES public.tracks(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Enable RLS on collection_bookmarks
ALTER TABLE public.collection_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies for collection_bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.collection_bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add bookmarks"
ON public.collection_bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove bookmarks"
ON public.collection_bookmarks FOR DELETE
USING (auth.uid() = user_id);

-- Add tip_amount column to purchases table
ALTER TABLE public.purchases ADD COLUMN tip_amount NUMERIC DEFAULT 0;

-- Create trigger for auto-creating trial subscription on new user
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
DECLARE
  user_tier app_role;
BEGIN
  -- Get the user's role, default to 'fan'
  SELECT role INTO user_tier FROM public.user_roles WHERE user_id = NEW.id;
  IF user_tier IS NULL THEN
    user_tier := 'fan';
  END IF;
  
  -- Create subscription with 3-month trial
  INSERT INTO public.subscriptions (user_id, tier, status, trial_ends_at)
  VALUES (NEW.id, user_tier, 'trialing', NOW() + INTERVAL '3 months');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create subscription after profile is created
CREATE TRIGGER on_profile_created_create_subscription
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_subscription();

-- Add updated_at trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();