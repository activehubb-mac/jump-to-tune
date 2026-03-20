

## Fixing the 10 Failing QA Lab Tests

### Current State

The infrastructure code for all 4 phases has already been written into the codebase:
- **Phase 1** (proxy operations) — implemented in `qa-admin/index.ts` and `qaTestRunner.ts`
- **Phase 2** (edge function contracts) — implemented in `qaTestRunner.ts` and `qaTestSuites.ts`
- **Phase 3** (credit ledger verification) — implemented in both files
- **Phase 4** (failure classification) — implemented in `qaTestRunner.ts` and `ResultsDashboard.tsx`

### What Needs to Happen

The `qa-admin` edge function needs to be **redeployed** — it has no recent logs, meaning the deployed version likely doesn't include the new proxy actions (`proxy-insert`, `proxy-delete`, `proxy-select`, `deduct-test-credits`, `get-test-credits`). The old deployed version only had `create-test-user`, `list-test-users`, `cleanup-*`, and `add-credits`.

### Implementation Steps

1. **Deploy the updated `qa-admin` edge function** — this is the single action that will unlock all 10 failing suites. The code is already written and correct.

2. **Seed dummy data before running tests** — the karaoke, stage, and store-checkout suites require dummy assets to be seeded first (via the Data tab in QA Lab). Without seeded dummy data, `verify-dummy-track` and `verify-dummy-product` steps will fail.

3. **Run all 13 suites** from the QA Lab UI and review results.

### Expected Outcome After Deploy

| Suite | Root Cause | Fix |
|-------|-----------|-----|
| Playlist Creation | RLS — admin can't insert for test user | Proxy-insert via qa-admin |
| Vault Save | RLS — admin can't insert bookmarks | Proxy-insert via qa-admin |
| JumTunes Stage | Edge params missing | Contract-validated body params |
| Karaoke Sing Mode | Edge params missing | Body includes `track_id` |
| AI Release Builder | Edge params missing | Body includes `prompt`, `genre` |
| Cover Art Generation | Edge params missing | Body includes `prompt`, `genre`, `style` |
| Avatar Generation | Edge params missing | Body includes `genre`, `style` |
| Music Video Generation | Edge params missing | Body includes `prompt`, `duration_seconds` |
| Store Checkout | RLS + edge params | Proxy for store setup + `productId` in body |
| Credit Deduction | RLS on wallet ops | Proxy credit operations via qa-admin |

### Files to Change

No code changes needed — just deploy the existing `qa-admin` edge function.

