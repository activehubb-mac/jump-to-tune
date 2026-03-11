-- Alter credit_cost to numeric to support fractional credits (e.g. 1.5)
ALTER TABLE public.ai_credit_costs ALTER COLUMN credit_cost TYPE numeric USING credit_cost::numeric;

-- Alter ai_credits in credit_wallets to numeric
ALTER TABLE public.credit_wallets ALTER COLUMN ai_credits TYPE numeric USING ai_credits::numeric;

-- Alter credits_used in ai_credit_usage to numeric
ALTER TABLE public.ai_credit_usage ALTER COLUMN credits_used TYPE numeric USING credits_used::numeric;

-- Update deduct_ai_credits to use numeric
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(p_user_id uuid, p_credits numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_previous numeric;
  v_new numeric;
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

-- Update add_ai_credits to use numeric
CREATE OR REPLACE FUNCTION public.add_ai_credits(p_user_id uuid, p_credits numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_previous numeric;
  v_new numeric;
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

-- Insert stem_separation cost row
INSERT INTO public.ai_credit_costs (action_key, credit_cost, label, description)
VALUES ('stem_separation', 1.5, 'Stem Separation', 'AI-powered vocal/instrumental separation for karaoke')
ON CONFLICT (action_key) DO UPDATE SET credit_cost = 1.5;