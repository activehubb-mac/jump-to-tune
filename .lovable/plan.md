

## QA Healer System — Controlled Auto-Remediation Architecture

This builds a layered QA Healer that analyzes failures, applies safe auto-fixes from predefined playbooks, and flags restricted issues for manual approval — all within the existing QA Lab infrastructure.

### Architecture Overview

```text
┌─────────────────────────────────────────────────┐
│                  QA Test Runner                  │
│              (existing: qaTestRunner.ts)          │
└──────────────────────┬──────────────────────────┘
                       │ RunResult[]
                       ▼
┌─────────────────────────────────────────────────┐
│            QA Healer Engine (NEW)                 │
│  src/lib/qaHealer.ts                             │
│                                                   │
│  Step A: Classify each failure (existing cats)    │
│  Step B: Check ALLOWED vs RESTRICTED              │
│  Step C: Match to playbook → generate patch       │
│  Step D: Apply patch (sandbox scope only)         │
│  Step E: Re-run affected suites                   │
│  Step F: Build healer report                      │
└──────────────────────┬──────────────────────────┘
                       │ HealerReport
                       ▼
┌─────────────────────────────────────────────────┐
│         Healer Dashboard Tab (NEW)               │
│  src/components/qa-lab/HealerDashboard.tsx       │
│  - Auto-healed items (green)                     │
│  - Pending approval items (amber)                │
│  - Unresolvable items (red)                      │
│  - Confidence score                              │
└─────────────────────────────────────────────────┘
```

### Files to Create/Modify

#### 1. `src/lib/qaHealer.ts` (NEW — core engine)

**Playbook system**: Each allowed category maps to a deterministic remediation function.

```typescript
// Allowed auto-fix playbooks (sandbox-safe only)
PLAYBOOKS = {
  EDGE_PARAMS_INVALID:    fixMissingParams,      // fill from contract registry
  NULL_UI_STATE:          fixMissingFixtures,     // seed dummy data, create test user
  ASYNC_TIMEOUT:          retryWithBackoff,       // re-run step with 2x timeout
  RESPONSE_SCHEMA_INVALID: logAndSkip,           // mark as non-blocking
  AUTH_CONTEXT_MISMATCH:  fixTestActorContext,    // re-create correct actor
}

// Restricted — never auto-fix, flag for approval
RESTRICTED = ['RLS_DENIED', 'CREDIT_LEDGER_MISMATCH', 'WEBHOOK_STATE_MISMATCH']
```

**Healer flow**:
- Takes `RunResult[]` from a full regression
- For each failed step: classify → check allowed → generate patch → apply → re-run
- Patches operate only on test data (proxy-insert/delete via qa-admin)
- Returns `HealerReport` with grouped results + confidence score

**Confidence score**: `(auto_healed + already_passed) / total_steps * 100`

#### 2. `src/lib/qaHealerPlaybooks.ts` (NEW — isolated remediation functions)

Each playbook is a pure function: `(failure, context) => PatchAction[]`

- `fixMissingFixtures`: Seeds dummy assets if missing, creates test user if absent
- `fixMissingParams`: Reads contract registry, fills defaults from context
- `fixTestActorContext`: Detects wrong role, creates correct actor via qa-admin
- `retryWithBackoff`: Returns retry instruction with doubled timeout
- `logAndSkip`: Marks step as non-blocking warning

#### 3. `src/components/qa-lab/HealerDashboard.tsx` (NEW — UI)

New tab in QA Lab showing:
- Summary cards: auto-healed count, pending approval, unresolved, confidence %
- Grouped failure list by root cause category
- For each auto-healed item: what patch was applied, before/after
- For restricted items: amber badge + "Requires Approval" with description
- "Run Healer" button that triggers analysis + remediation on last results

#### 4. `src/pages/admin/AdminQALab.tsx` (MODIFY)

- Add 5th tab "Healer" with the new `HealerDashboard` component
- Pass last run results to healer for analysis
- Update TabsList to `grid-cols-5`

#### 5. `src/lib/qaTestRunner.ts` (MODIFY)

- Export `executeStep` so the healer can re-run individual steps
- Add `runSingleStep` wrapper that creates a mini-run for re-execution
- Expose `EDGE_FUNCTION_CONTRACTS` for the healer to use

### Key Interfaces

```typescript
interface HealerReport {
  totalFailures: number;
  autoHealed: HealedItem[];
  pendingApproval: RestrictedItem[];
  unresolved: UnresolvedItem[];
  confidenceScore: number;  // 0-100
  timestamp: string;
}

interface HealedItem {
  suite: string;
  step: string;
  category: FailureCategory;
  playbook: string;
  patchApplied: string;       // human-readable description
  rerunResult: 'passed' | 'failed';
}

interface RestrictedItem {
  suite: string;
  step: string;
  category: FailureCategory;
  errorMessage: string;
  suggestedFix: string;       // what the healer WOULD do
  reason: string;             // why it's restricted
}
```

### Safety Guarantees

- Healer never modifies RLS policies, auth logic, credit functions, or Stripe flows
- All data mutations go through existing `qa-admin` proxy (service-role, scoped to test users)
- Re-runs only target the specific failed suite, not the whole regression
- Restricted failures are surfaced with suggested fixes but blocked from execution
- Confidence score drops if restricted failures exist (penalized by 15 points each)

### QA Actor System Enhancement

The existing actor system (`ensure-test-artist`, `ensure-test-fan`) already creates deterministic test users. The healer extends this by:
- Detecting when a step failed because the wrong actor was in context
- Re-creating the correct actor before re-running
- Never using admin context to simulate user behavior (admin bypass is only for proxy operations)

### Edge Function Contract Validation

Already exists in `EDGE_FUNCTION_CONTRACTS`. The healer uses this to:
- Detect `EDGE_PARAMS_INVALID` failures
- Auto-fill missing params from context + contract defaults
- Block execution if contract cannot be satisfied (escalate to unresolved)

