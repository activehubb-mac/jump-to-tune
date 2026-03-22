

## Patch & Lock Stripe + Credit System

Five targeted patches. No rebuilds.

---

### Patch 1 — Fix Subscription Price Display

**Problem**: `SubscriptionRequiredModal.tsx` and `Onboarding.tsx` show $0.99/$4.99/$9.99. `Subscription.tsx` already shows correct $10/$25/$79.

**Files to change**:

| File | Change |
|---|---|
| `src/components/download/SubscriptionRequiredModal.tsx` (lines 20-38) | Update tier names and prices to Creator/$10, Creator Pro/$25, Label/Studio/$79. Update features to match `Subscription.tsx` (AI credits, etc.) |
| `src/pages/Onboarding.tsx` (lines 18-37) | Same — update to Creator/$10, Creator Pro/$25, Label/Studio/$79 with correct features |

`ThemePreview.tsx` $0.99 is a mock download button price, not subscription — leave as-is.

---

### Patch 2 — Unify Credit Cost Source

**Problem**: Backend edge functions hardcode credit costs independently from `aiPricing.ts`.

**Current state** (all match `aiPricing.ts`):
- `ai-cover-art`: 10 ✓
- `ai-identity-builder`: 15/25/40 ✓
- `ai-avatar-edit`: 10/15/25 ✓
- `ai-artist-drop`: 40 ✓
- `ai-video-generator`: 130/180/240/400 ✓
- `ai-viral-generator`: 500/850 ✓

**Status**: Frontend and backend values already match. No code changes needed. Add a comment header to each edge function referencing `aiPricing.ts` as the canonical source, so future devs don't drift:

| File | Change |
|---|---|
| `supabase/functions/ai-cover-art/index.ts` | Add comment: `// Credit cost: 10 — canonical source: src/lib/aiPricing.ts` |
| `supabase/functions/ai-identity-builder/index.ts` | Add comment with vision=15, photo=25, hd=40 |
| `supabase/functions/ai-avatar-edit/index.ts` | Add comment with quick=10, style=15, full=25 |
| `supabase/functions/ai-artist-drop/index.ts` | Add comment: 40 |
| `supabase/functions/ai-video-generator/index.ts` | Add comment with 130/180/240/400 |
| `supabase/functions/ai-viral-generator/index.ts` | Add comment with 500/850 |

---

### Patch 3 — AI Credit Refund Clawback

**Problem**: `charge.refunded` handler only processes store orders. AI credit pack refunds are ignored.

**File**: `supabase/functions/stripe-webhook/index.ts` (around line 749)

After the existing store order lookup fails (`No store order found`), instead of breaking, add:
1. Look up original checkout session via `stripe.paymentIntents.retrieve(paymentIntentId)` to get the checkout session metadata
2. If metadata `type === "ai_credit_pack"`, extract `ai_credits` and `user_id`
3. Call `deduct_ai_credits(user_id, ai_credits)` — if balance is insufficient, the deduction will fail (returns `success: false`)
4. If deduction fails (user already spent credits), insert a record into `notifications` flagging the account: "Credit pack refunded but credits already spent — account flagged for review"
5. Log the reversal event

---

### Patch 4 — Stripe API Version Consistency

**Problem**: Mixed API versions across functions. Most use `2025-11-17.clover`, `purchase-credits` and `refund-store-order` use `2025-08-27.basil`.

Per memory note, `2025-08-27.basil` is the stable version. However, 12 functions already use `2025-11-17.clover` and are working in production. Changing them risks breaking live webhook signature verification and checkout flows.

**Decision**: Standardize on `2025-08-27.basil` (the documented stable version) for the two checkout/payment functions where it matters most, and update the remaining functions:

| File | Current | Change to |
|---|---|---|
| `supabase/functions/create-checkout/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |
| `supabase/functions/stripe-webhook/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |
| `supabase/functions/check-subscription/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |
| `supabase/functions/customer-portal/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |
| `supabase/functions/create-store-checkout/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |
| `supabase/functions/create-superfan-checkout/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |
| `supabase/functions/delete-account/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |
| `supabase/functions/pause-subscription/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |
| `supabase/functions/create-connect-account/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |
| `supabase/functions/process-pending-payouts/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |
| `supabase/functions/artist-payout-status/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |
| `supabase/functions/spend-credits/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |
| `supabase/functions/migrate-legacy-subscriptions/index.ts` | `2025-11-17.clover` | `2025-08-27.basil` |

---

### Patch 5 — Validation Summary

After all patches, confirm:
- SubscriptionRequiredModal + Onboarding show $10/$25/$79 (matching Stripe price IDs)
- All AI tool credit costs in edge functions match `aiPricing.ts`
- `charge.refunded` now handles AI credit pack reversals
- All Stripe functions use `2025-08-27.basil`

---

### Files Changed

| File | Patch |
|---|---|
| `src/components/download/SubscriptionRequiredModal.tsx` | 1 |
| `src/pages/Onboarding.tsx` | 1 |
| `supabase/functions/stripe-webhook/index.ts` | 3, 4 |
| `supabase/functions/create-checkout/index.ts` | 4 |
| `supabase/functions/check-subscription/index.ts` | 4 |
| `supabase/functions/customer-portal/index.ts` | 4 |
| `supabase/functions/create-store-checkout/index.ts` | 4 |
| `supabase/functions/create-superfan-checkout/index.ts` | 4 |
| `supabase/functions/delete-account/index.ts` | 4 |
| `supabase/functions/pause-subscription/index.ts` | 4 |
| `supabase/functions/create-connect-account/index.ts` | 4 |
| `supabase/functions/process-pending-payouts/index.ts` | 4 |
| `supabase/functions/artist-payout-status/index.ts` | 4 |
| `supabase/functions/spend-credits/index.ts` | 4 |
| `supabase/functions/migrate-legacy-subscriptions/index.ts` | 4 |
| 6 AI edge functions | 2 (comments only) |

### Not Touched
- Trial logic, subscription lifecycle
- Webhook event structure
- Credit deduction/refund DB functions
- Store checkout flow
- Any UI flows beyond price display

