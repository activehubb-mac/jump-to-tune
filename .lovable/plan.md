

# Add 1.5 AI Credit Cost for Auto Stem Separation

## What Changes

When an artist enables Karaoke Mode without uploading an instrumental file, the system auto-generates stems via Replicate. This should cost **1.5 AI credits**.

## Implementation

### 1. Insert `ai_credit_costs` row
Add a new row for `stem_separation` with `credit_cost = 1.5` (the table uses integer, so we may need to check the column type — if integer, use 2 or adjust to decimal). Looking at the existing costs table schema, `credit_cost` is an integer column. We have two options: round to 2 credits, or alter the column to numeric. Since 1.5 is specifically requested, we'll use a migration to change the column type to `numeric` if needed, then insert the cost row.

Actually, let me reconsider — the `ai_credit_costs` table has `credit_cost integer`. To support 1.5, we'd need to alter to `numeric`. But this could break existing integer-based logic. Simpler approach: store costs in "half-credits" or just use `numeric(5,1)`. Let's alter the column.

### 2. Edge function: Deduct credits before processing
In `stem-separation/index.ts`, call `deduct_ai_credits` RPC before starting the Replicate job. If insufficient credits, return an error.

The `deduct_ai_credits` function uses integer type too. We need to update it to handle decimals, or multiply by 10 and work in tenths. Simplest: keep everything as integers and charge **2 credits** instead of 1.5, OR alter the DB functions to use numeric.

Given complexity, I'll ask the user to clarify.

Wait — actually the simplest approach: store credit_cost as integer cents (e.g., 150 = 1.5 credits) — but that changes the whole system. Too invasive.

**Pragmatic approach**: Change `credit_cost` column and `ai_credits` column to `numeric`, update the `deduct_ai_credits` and `add_ai_credits` functions accordingly. This is clean and supports fractional credits going forward.

### Files to modify:

| File | Change |
|------|--------|
| Migration SQL | Alter `credit_cost` to `numeric`, alter `ai_credits` to `numeric`, update `deduct_ai_credits` and `add_ai_credits` functions, insert `stem_separation` cost row |
| `supabase/functions/stem-separation/index.ts` | Add credit check + deduction before Replicate call |
| `src/components/upload/KaraokeSection.tsx` | Show "1.5 credits" cost info in the auto-generate hint |
| `src/hooks/useAICredits.ts` | Update types to handle `number` (already works since JS numbers handle decimals) |
| `src/integrations/supabase/types.ts` | Auto-updates after migration |

### Edge Function Flow (stem-separation)
1. Check if instrumental file was provided (it won't be if auto-generating)
2. Call `deduct_ai_credits(user_id, 1.5)` via admin RPC
3. If insufficient credits, return 402 error with clear message
4. Proceed with Replicate separation
5. If separation fails, refund credits via `add_ai_credits`

### UI Update (KaraokeSection)
Change the hint text from "We'll automatically generate one using AI stem separation after upload" to include the cost: "We'll automatically generate one using AI stem separation after upload (1.5 AI credits)"

