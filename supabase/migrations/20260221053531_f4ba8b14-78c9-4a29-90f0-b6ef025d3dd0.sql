
-- Phase 1: Idempotency table
CREATE TABLE public.webhook_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS needed - only service role accesses this
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook events"
  ON public.webhook_events FOR ALL
  USING (auth.role() = 'service_role'::text);

-- Phase 1: Atomic inventory decrement
CREATE OR REPLACE FUNCTION public.decrement_inventory_atomic(p_product_id uuid, p_quantity int DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_sold int;
  v_limit int;
  v_title text;
BEGIN
  UPDATE store_products
  SET inventory_sold = inventory_sold + p_quantity,
      status = CASE
        WHEN inventory_limit IS NOT NULL AND inventory_sold + p_quantity >= inventory_limit THEN 'sold_out'
        ELSE status
      END,
      updated_at = now()
  WHERE id = p_product_id
    AND (inventory_limit IS NULL OR inventory_sold + p_quantity <= inventory_limit)
  RETURNING inventory_sold, inventory_limit, title
  INTO v_new_sold, v_limit, v_title;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_inventory');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'new_sold', v_new_sold,
    'limit', v_limit,
    'edition_number', v_new_sold,
    'is_sold_out', v_limit IS NOT NULL AND v_new_sold >= v_limit
  );
END;
$$;

-- Phase 1: Atomic inventory restore
CREATE OR REPLACE FUNCTION public.restore_inventory_atomic(p_product_id uuid, p_quantity int DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_sold int;
  v_was_sold_out boolean;
  v_inv_limit int;
BEGIN
  SELECT (status = 'sold_out'), inventory_limit INTO v_was_sold_out, v_inv_limit
  FROM store_products WHERE id = p_product_id;

  UPDATE store_products
  SET inventory_sold = GREATEST(inventory_sold - p_quantity, 0),
      status = CASE
        WHEN status = 'sold_out' AND inventory_limit IS NOT NULL
             AND GREATEST(inventory_sold - p_quantity, 0) < inventory_limit
        THEN 'active'
        ELSE status
      END,
      updated_at = now()
  WHERE id = p_product_id
  RETURNING inventory_sold INTO v_new_sold;

  RETURN jsonb_build_object(
    'success', true,
    'new_sold', v_new_sold,
    'was_sold_out', COALESCE(v_was_sold_out, false),
    'reactivated', COALESCE(v_was_sold_out, false) AND v_new_sold < COALESCE(v_inv_limit, 2147483647)
  );
END;
$$;
