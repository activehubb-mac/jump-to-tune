-- Function: deduct_credits_atomic
-- Atomically checks balance and deducts credits in a single operation
-- Returns: success boolean, previous_balance, new_balance, current_balance (if failed)

CREATE OR REPLACE FUNCTION public.deduct_credits_atomic(
  p_user_id UUID,
  p_amount_cents INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_previous_balance INTEGER;
  v_new_balance INTEGER;
  v_updated_rows INTEGER;
BEGIN
  -- Attempt atomic update with balance check in WHERE clause
  -- This is atomic because PostgreSQL UPDATE is a single operation
  UPDATE credit_wallets
  SET balance_cents = balance_cents - p_amount_cents,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND balance_cents >= p_amount_cents
  RETURNING balance_cents + p_amount_cents, balance_cents
  INTO v_previous_balance, v_new_balance;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  IF v_updated_rows = 0 THEN
    -- No rows updated = insufficient balance (or wallet doesn't exist)
    SELECT balance_cents INTO v_previous_balance
    FROM credit_wallets
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
      'success', false,
      'current_balance', COALESCE(v_previous_balance, 0),
      'required', p_amount_cents
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_previous_balance,
    'new_balance', v_new_balance
  );
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.deduct_credits_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits_atomic TO service_role;

-- Function: add_credits_atomic
-- Atomically adds credits to a wallet (creates wallet if doesn't exist)
CREATE OR REPLACE FUNCTION public.add_credits_atomic(
  p_user_id UUID,
  p_amount_cents INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_previous_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Try to update existing wallet first
  UPDATE credit_wallets
  SET balance_cents = balance_cents + p_amount_cents,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance_cents - p_amount_cents, balance_cents
  INTO v_previous_balance, v_new_balance;

  -- If no wallet exists, create one
  IF v_new_balance IS NULL THEN
    INSERT INTO credit_wallets (user_id, balance_cents)
    VALUES (p_user_id, p_amount_cents)
    ON CONFLICT (user_id) DO UPDATE
    SET balance_cents = credit_wallets.balance_cents + p_amount_cents,
        updated_at = NOW()
    RETURNING balance_cents - p_amount_cents, balance_cents
    INTO v_previous_balance, v_new_balance;
    
    -- For new wallets, previous balance was 0
    IF v_previous_balance IS NULL THEN
      v_previous_balance := 0;
      v_new_balance := p_amount_cents;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', COALESCE(v_previous_balance, 0),
    'new_balance', v_new_balance
  );
END;
$$;

-- Grant execute permission to service role only (used by webhooks)
GRANT EXECUTE ON FUNCTION public.add_credits_atomic TO service_role;