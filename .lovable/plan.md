

# Secure Payment and Ownership System -- Hardening Plan

## Current State Assessment

The existing system covers the happy path well but has critical gaps in idempotency, refund automation, atomic inventory, and message credit confirmation.

## Gap Analysis

### Gap 1: No Idempotency (Critical)
The webhook processes every event it receives with no deduplication. If Stripe retries a webhook (which it does regularly), the system will:
- Create duplicate orders
- Double-decrement inventory
- Double-award loyalty points

**Fix:** Create a `webhook_events` table to track processed Stripe event IDs. Check before processing; skip if already seen.

### Gap 2: Non-Atomic Inventory Decrement (Critical)
The webhook reads `inventory_sold`, adds 1 in JavaScript, then writes back. Two concurrent purchases can both read `sold=9`, both write `sold=10`, causing overselling.

**Fix:** Create a Postgres function `decrement_inventory_atomic(p_product_id, p_quantity)` that uses `UPDATE ... WHERE inventory_sold + p_quantity <= inventory_limit RETURNING ...`. This guarantees no overselling at the database level.

### Gap 3: No Webhook-Driven Refund Handling (Critical)
The `refund-store-order` function creates a Stripe refund and updates order status, but:
- Does NOT restore inventory
- Does NOT remove ownership/badges
- Does NOT reactivate sold-out products
- The webhook doesn't listen for `charge.refunded` events at all

**Fix:** Add `charge.refunded` handler to the webhook that:
1. Finds the order by `stripe_payment_intent_id`
2. Updates order status to `refunded`
3. Restores inventory atomically
4. Re-evaluates loyalty points (subtract)
5. If product was `sold_out` and inventory is now available, set status back to `active`

### Gap 4: Message Credits Not Confirmed via Webhook
The `purchase-message-credits` function creates a Stripe checkout with `metadata.type = "message_credits"`, but the webhook has no handler for this type. Credits are never actually added after payment.

**Fix:** Add `message_credits` handler to the webhook's `checkout.session.completed` branch that upserts the `message_credits` table balance.

### Gap 5: Loyalty Points Not Triggered on Store Purchases
The webhook's store purchase handler creates orders and earnings but never calls `award-loyalty-points`. Badge evaluation is missing.

**Fix:** Add a non-blocking call to `award-loyalty-points` after successful store order creation in the webhook.

### Gap 6: Refund Function Incomplete
The `refund-store-order` edge function only updates order status. It should also restore inventory and trigger badge re-evaluation, as a defense-in-depth measure alongside the webhook handler.

**Fix:** Update `refund-store-order` to restore inventory and subtract loyalty points.

## Implementation Plan

### Phase 1: Database Migration

**New table: `webhook_events`**
- `id` text PK (Stripe event ID like `evt_xxx`)
- `type` text (event type)
- `processed_at` timestamptz default now()
- No RLS needed (only service role accesses this)

**New function: `decrement_inventory_atomic`**
```sql
CREATE FUNCTION decrement_inventory_atomic(p_product_id uuid, p_quantity int DEFAULT 1)
RETURNS jsonb AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**New function: `restore_inventory_atomic`**
```sql
CREATE FUNCTION restore_inventory_atomic(p_product_id uuid, p_quantity int DEFAULT 1)
RETURNS jsonb AS $$
DECLARE
  v_new_sold int;
  v_was_sold_out boolean;
BEGIN
  SELECT (status = 'sold_out') INTO v_was_sold_out
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
    'reactivated', COALESCE(v_was_sold_out, false) AND v_new_sold < (
      SELECT inventory_limit FROM store_products WHERE id = p_product_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Phase 2: Webhook Hardening (stripe-webhook/index.ts)

**Changes:**
1. Add idempotency check at the top of event processing (after signature verification, before switch):
   - Query `webhook_events` for `event.id`
   - If found, return 200 immediately (already processed)
   - If not found, insert the event ID, then proceed

2. Replace JavaScript inventory math with `decrement_inventory_atomic` RPC call in the store purchase handler

3. Add `charge.refunded` event handler:
   - Look up order by `payment_intent` from the charge
   - Update order to `refunded`
   - Call `restore_inventory_atomic`
   - Subtract loyalty points (call award-loyalty-points with negative event or direct DB update)
   - Notify artist

4. Add `message_credits` handler in `checkout.session.completed`:
   - Read `metadata.type === "message_credits"` and `metadata.credits`
   - Upsert `message_credits` table (increment balance)
   - Notify fan

5. Add `award-loyalty-points` call after store order creation

### Phase 3: Refund Edge Function Enhancement (refund-store-order/index.ts)

**Changes:**
- After updating order status to `refunded`, call `restore_inventory_atomic` RPC
- Subtract loyalty points from `fan_loyalty` for the buyer
- This provides defense-in-depth alongside the webhook handler

### Phase 4: Message Credit Checkout Isolation

The `purchase-message-credits` function already uses a separate `metadata.type = "message_credits"`. The webhook handler (Phase 2) will process this independently from store purchases. No changes needed to the checkout function itself.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/stripe-webhook/index.ts` | Add idempotency, atomic inventory, refund handler, message credits handler, loyalty points trigger |
| `supabase/functions/refund-store-order/index.ts` | Add inventory restoration and loyalty point subtraction |

## Files to Create

None -- all changes are to existing files plus a database migration.

## What This Does NOT Change

- Music player logic (untouched)
- Upload flow (untouched)
- Frontend checkout flow (untouched)
- Stripe Connect onboarding (untouched)
- create-store-checkout edge function (untouched -- pre-checkout validation stays as-is)
- spend-credits edge function (untouched -- already uses atomic deduction)

## Security Summary

- Webhook signature verification: already implemented (kept)
- Idempotency: NEW -- prevents duplicate processing
- Atomic inventory: NEW -- prevents overselling via Postgres function
- Refund reversal: NEW -- ownership and inventory restored on refund
- Message credits isolated: NEW -- separate flow from store purchases
- 15% fee hardcoded: already enforced (kept)
- All analytics derived from confirmed payments only: enforced by webhook-only processing

