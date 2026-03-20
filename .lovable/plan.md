

## QA Lab Infrastructure Repair — 5-Phase Plan

### Root Cause Analysis

The 10 failing suites share **3 systemic defects**:

1. **RLS Actor Mismatch**: The test runner runs as the logged-in admin. When it inserts rows with `user_id = testUserId` (a different user), RLS `with_check` policies reject because `auth.uid() != testUserId`. Affects: playlist-creation, vault-save, jumtunes-stage, artist-store setup.

2. **Edge Function Payload Mismatch**: The `call-edge-function` action sends `{ _qa_test: true, testUserId }` but each function expects specific required fields (`track_id`, `prompt`, `productId`, etc.). Functions reject with missing-param errors. Affects: all 6 AI tool + commerce suites.

3. **No Actor Authentication**: Tests create users via service-role but never authenticate as those users. The supabase client always uses the admin's session token, so edge functions see the admin user, not the test user.

---

### PHASE 1 — QA Actor + RLS Fix

**Problem**: Admin's `auth.uid()` doesn't match test user IDs in RLS checks.

**Solution**: Add a `proxy-action` system to the `qa-admin` edge function that performs ownership-sensitive DB operations using service-role on behalf of test users — but only for fixture setup/teardown (seeding rows). This is NOT bypassing RLS for user flows; it's using the service role to simulate what the test user's session would do, since we can't sign in as test users from the admin's browser.

**Changes**:

1. **`supabase/functions/qa-admin/index.ts`** — Add 3 new actions:
   - `proxy-insert`: Insert a row into a specified table with given data, using service role. Only allowed for QA tables + playlists/bookmarks. Validates the target user is a test user (has `is_test_user` metadata).
   - `proxy-delete`: Delete rows by match criteria, same safety checks.
   - `proxy-select`: Read rows for verification.

2. **`src/lib/qaTestRunner.ts`** — Update these action handlers to route through proxy:
   - `create-test-playlist` → calls `qa-admin` proxy-insert for `playlists` table
   - `add-track-to-playlist` → calls proxy-insert for `playlist_tracks`
   - `delete-test-playlist` → calls proxy-delete
   - `bookmark-track` → calls proxy-insert for `collection_bookmarks`
   - `verify-bookmark` → calls proxy-select
   - `remove-bookmark` → calls proxy-delete
   - `ensure-test-artist-store` → calls proxy-insert for `artist_stores`

3. **Safety**: Proxy actions only work on allowlisted tables, only for users with `is_test_user: true` metadata, and only from admin-authenticated callers.

**No RLS policy changes. No production policy weakening.**

---

### PHASE 2 — Edge Function Contract Fix

**Problem**: `call-edge-function` sends generic empty body. Each function requires specific params.

**Solution**: Define required payloads per function and merge them into calls.

**Changes**:

1. **`src/lib/qaTestSuites.ts`** — Add `body` param to each `call-edge-function` step:
   - `ai-release-builder`: `{ prompt: "QA test release", genre: "Electronic" }`
   - `ai-cover-art`: `{ prompt: "QA test cover", genre: "Electronic", style: "abstract" }`
   - `ai-identity-builder`: `{ genre: "Electronic", style: "futuristic" }`
   - `ai-video-generator`: `{ prompt: "QA test video", duration_seconds: 15 }`
   - `stem-separation`: `{ track_id: "<from context>" }` (use special `$context.testTrackId` token)
   - `ai-avatar-performance`: `{ track_id: "<from context>" }`
   - `spend-credits`: `{ track_id: "<from context>" }`
   - `create-store-checkout`: `{ productId: "<from context>" }`
   - `check-subscription`: `{}` (no extra params needed)

2. **`src/lib/qaTestRunner.ts`** — Update `call-edge-function` handler:
   - Merge `step.params.body` into the invoke body
   - Resolve `$context.*` references from the test context
   - Add preflight validation: if body has required fields marked, block if missing
   - Normalize response: check for `error` field, distinguish auth errors from payload errors

3. **Add contract registry** as a typed constant in `qaTestRunner.ts`:
   ```
   EDGE_FUNCTION_CONTRACTS = {
     'ai-release-builder': { required: ['prompt'], optional: ['genre'], authRole: 'artist' },
     'spend-credits': { required: ['track_id'], authRole: 'authenticated' },
     ...
   }
   ```
   Validate before calling. Log contract mismatches as `EDGE_PARAMS_INVALID`.

---

### PHASE 3 — Credit + Checkout Integrity Fix

**Problem**: Credit deduction tests don't actually test real deduction; store checkout can't produce a real Stripe session for test users without email.

**Solution**: Make credit tests actually verify balance changes, and add ledger assertions.

**Changes**:

1. **`src/lib/qaTestRunner.ts`** — New action `deduct-ai-credits-via-proxy`:
   - Calls `qa-admin` with a new action `deduct-test-credits` that uses `deduct_ai_credits` RPC via service role for the test user
   - Records `initialCredits` and `finalCredits` in context
   - Asserts the difference matches the expected cost

2. **`supabase/functions/qa-admin/index.ts`** — Add `deduct-test-credits` action:
   - Calls `deduct_ai_credits(p_user_id, p_credits)` RPC
   - Only for test users
   - Returns previous/new balance

3. **`src/lib/qaTestRunner.ts`** — Update `verify-credits-deducted`:
   - Compare `context.initialCredits` with current balance from DB
   - Assert exact expected deduction amount from `step.params.expected`
   - Classify mismatch as `CREDIT_LEDGER_MISMATCH`

4. **`src/lib/qaTestRunner.ts`** — Update `verify-checkout-url`:
   - Actually check `context.lastEdgeFunctionResponse?.url` starts with `https://checkout.stripe.com`
   - If no URL, classify as `RESPONSE_SCHEMA_INVALID`

5. **Idempotency**: The existing `webhook_events` table already prevents duplicate webhook processing. The `deduct_credits_atomic` function prevents double-spend. No changes needed to production logic — just verify these in tests.

---

### PHASE 4 — QA Healer Foundation

**Problem**: Failures are labeled by suite name, not root cause.

**Solution**: Add failure classification to the test runner.

**Changes**:

1. **`src/lib/qaTestRunner.ts`** — Add `failureCategory` to `StepResult`:
   ```
   type FailureCategory = 
     'RLS_DENIED' | 'AUTH_CONTEXT_MISMATCH' | 'EDGE_PARAMS_INVALID' |
     'RESPONSE_SCHEMA_INVALID' | 'CREDIT_LEDGER_MISMATCH' | 
     'WEBHOOK_STATE_MISMATCH' | 'STORAGE_PATH_INVALID' | 
     'ASYNC_TIMEOUT' | 'NULL_UI_STATE' | 'UNKNOWN';
   ```

2. **Auto-classification logic** in the catch block of `executeStep`:
   - Error contains "row-level security" or "policy" → `RLS_DENIED`
   - Error contains "not authenticated" or "auth" → `AUTH_CONTEXT_MISMATCH`
   - Error contains "required" or "missing" → `EDGE_PARAMS_INVALID`
   - Timeout → `ASYNC_TIMEOUT`
   - Credit mismatch → `CREDIT_LEDGER_MISMATCH`
   - Default → `UNKNOWN`

3. **`src/components/qa-lab/ResultsDashboard.tsx`** — Add a "Root Cause Clusters" section:
   - Group failures by `failureCategory`
   - Show count per category with color-coded badges
   - Show which suites are affected by each root cause

4. **Store `failureCategory` in `qa_test_results` metadata** for historical tracking.

---

### PHASE 5 — Retest + Report

After implementation, the user runs all 13 suites from the QA Lab UI. The Results Dashboard will show:
- Root cause cluster per failure
- Which shared fix resolved it
- Pass/fail per suite
- Remaining feature-specific failures
- Confidence level badge

**No code changes needed for this phase** — it's the output of phases 1-4.

---

### Files Changed Summary

| File | Phase | Changes |
|------|-------|---------|
| `supabase/functions/qa-admin/index.ts` | 1