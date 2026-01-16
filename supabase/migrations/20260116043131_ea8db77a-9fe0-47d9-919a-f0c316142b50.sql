-- Fix the handle_new_user_subscription trigger to properly get user role
-- This prevents race conditions where user_roles isn't committed yet

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
DECLARE
  user_tier app_role;
BEGIN
  -- First try to get role from user_roles (might be available from same transaction)
  SELECT role INTO user_tier FROM public.user_roles WHERE user_id = NEW.id;
  
  -- If not found, try to get from auth.users metadata
  IF user_tier IS NULL THEN
    SELECT COALESCE(
      (raw_user_meta_data ->> 'role')::app_role,
      'fan'::app_role
    ) INTO user_tier
    FROM auth.users WHERE id = NEW.id;
  END IF;
  
  -- Final fallback to 'fan'
  IF user_tier IS NULL THEN
    user_tier := 'fan';
  END IF;
  
  -- Create subscription with 3-month trial
  INSERT INTO public.subscriptions (user_id, tier, status, trial_ends_at)
  VALUES (NEW.id, user_tier, 'trialing', NOW() + INTERVAL '3 months');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix existing mismatched subscription tiers (one-time sync)
UPDATE subscriptions s
SET tier = ur.role, updated_at = NOW()
FROM user_roles ur
WHERE s.user_id = ur.user_id
  AND s.tier != ur.role
  AND s.stripe_subscription_id IS NULL;