
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.credit_wallets (user_id, balance_cents, ai_credits)
  VALUES (NEW.id, 0, 15);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_tier app_role;
BEGIN
  SELECT role INTO user_tier FROM public.user_roles WHERE user_id = NEW.id;
  
  IF user_tier IS NULL THEN
    SELECT COALESCE(
      (raw_user_meta_data ->> 'role')::app_role,
      'fan'::app_role
    ) INTO user_tier
    FROM auth.users WHERE id = NEW.id;
  END IF;
  
  IF user_tier IS NULL THEN
    user_tier := 'fan';
  END IF;
  
  INSERT INTO public.subscriptions (user_id, tier, status, trial_ends_at)
  VALUES (NEW.id, user_tier, 'trialing', NOW() + INTERVAL '30 days');
  
  RETURN NEW;
END;
$function$;
