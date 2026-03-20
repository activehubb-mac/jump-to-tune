// QA Healer Engine: Controlled auto-remediation system
// Separates analysis from safe remediation with strict category gates

import type { RunResult, StepResult, FailureCategory } from './qaTestRunner';
import { HEALER_PLAYBOOKS, type PatchAction } from './qaHealerPlaybooks';

// ===== Failure classification categories =====
export const ALLOWED_AUTO_FIX: FailureCategory[] = [
  'EDGE_PARAMS_INVALID',
  'NULL_UI_STATE',
  'ASYNC_TIMEOUT',
  'RESPONSE_SCHEMA_INVALID',
  'AUTH_CONTEXT_MISMATCH',
];

export const RESTRICTED_CATEGORIES: FailureCategory[] = [
  'RLS_DENIED',
  'CREDIT_LEDGER_MISMATCH',
  'WEBHOOK_STATE_MISMATCH',
  'STORAGE_PATH_INVALID',
];

// ===== Report interfaces =====
export interface HealedItem {
  suite: string;
  step: string;
  category: FailureCategory;
  playbook: string;
  patchApplied: string;
  rerunResult: 'passed' | 'failed' | 'skipped';
  durationMs: number;
}

export interface RestrictedItem {
  suite: string;
  step: string;
  category: FailureCategory;
  errorMessage: string;
  suggestedFix: string;
  reason: string;
}

export interface UnresolvedItem {
  suite: string;
  step: string;
  category: FailureCategory;
  errorMessage: string;
  note: string;
}

export interface HealerReport {
  totalFailures: number;
  totalSteps: number;
  alreadyPassed: number;
  autoHealed: HealedItem[];
  pendingApproval: RestrictedItem[];
  unresolved: UnresolvedItem[];
  confidenceScore: number;
  timestamp: string;
  durationMs: number;
}

export interface AnalyzedFailure {
  suite: string;
  step: string;
  stepAction: string;
  category: FailureCategory;
  errorMessage: string;
  metadata?: Record<string, unknown>;
  userRole?: string;
  edgeFunction?: string;
  payload?: Record<string, unknown>;
}

// ===== Suggested fix descriptions for restricted categories =====
const RESTRICTED_SUGGESTIONS: Record<string, string> = {
  RLS_DENIED: 'Review RLS policies for the affected table. Ensure test user has correct ownership/role.',
  CREDIT_LEDGER_MISMATCH: 'Verify credit deduction logic in the edge function. Check atomic balance operations.',
  WEBHOOK_STATE_MISMATCH: 'Check webhook idempotency keys and event ordering. May need state reconciliation.',
  STORAGE_PATH_INVALID: 'Verify storage bucket permissions and path construction. Check bucket public/private settings.',
};

const RESTRICTED_REASONS: Record<string, string> = {
  RLS_DENIED: 'RLS policy changes require manual security review — auto-fix could weaken access controls.',
  CREDIT_LEDGER_MISMATCH: 'Credit/billing logic affects real money flows — auto-fix could cause financial inconsistencies.',
  WEBHOOK_STATE_MISMATCH: 'Webhook state involves external service integration — auto-fix could corrupt transaction state.',
  STORAGE_PATH_INVALID: 'Storage policies affect data access security — auto-fix requires manual review.',
};

// ===== Step A: Analyze all failures from run results =====
export function analyzeFailures(results: RunResult[]): AnalyzedFailure[] {
  const failures: AnalyzedFailure[] = [];

  for (const run of results) {
    for (const step of run.steps) {
      if (step.status !== 'failed') continue;

      const category = step.failureCategory || (step.metadata?.failureCategory as FailureCategory) || 'UNKNOWN';
      const edgeFunction = step.metadata?.functionName as string | undefined;
      const payload = step.metadata?.body as Record<string, unknown> | undefined;

      failures.push({
        suite: run.suiteName,
        step: step.stepName,
        stepAction: step.actionLocation,
        category,
        errorMessage: step.errorMessage || 'Unknown error',
        metadata: step.metadata,
        userRole: step.metadata?.userRole as string | undefined,
        edgeFunction,
        payload,
      });
    }
  }

  return failures;
}

// ===== Step B+C: Classify and match to playbooks =====
function isAutoFixAllowed(category: FailureCategory): boolean {
  return ALLOWED_AUTO_FIX.includes(category);
}

function isRestricted(category: FailureCategory): boolean {
  return RESTRICTED_CATEGORIES.includes(category);
}

// ===== Step D+E+F: Run healer pipeline =====
export async function runHealer(
  results: RunResult[],
  adminUserId: string,
  onProgress?: (message: string) => void
): Promise<HealerReport> {
  const healerStart = performance.now();
  const failures = analyzeFailures(results);

  const totalSteps = results.reduce((sum, r) => sum + r.totalSteps, 0);
  const alreadyPassed = results.reduce((sum, r) => sum + r.passedSteps, 0);

  const autoHealed: HealedItem[] = [];
  const pendingApproval: RestrictedItem[] = [];
  const unresolved: UnresolvedItem[] = [];

  for (const failure of failures) {
    onProgress?.(`Analyzing: ${failure.suite} → ${failure.step}`);

    // Step B: Check if auto-fix is allowed
    if (isRestricted(failure.category)) {
      pendingApproval.push({
        suite: failure.suite,
        step: failure.step,
        category: failure.category,
        errorMessage: failure.errorMessage,
        suggestedFix: RESTRICTED_SUGGESTIONS[failure.category] || 'Manual investigation required.',
        reason: RESTRICTED_REASONS[failure.category] || 'This category requires manual approval for safety.',
      });
      continue;
    }

    if (!isAutoFixAllowed(failure.category)) {
      unresolved.push({
        suite: failure.suite,
        step: failure.step,
        category: failure.category,
        errorMessage: failure.errorMessage,
        note: 'Category not in allowed auto-fix list and not restricted. Requires investigation.',
      });
      continue;
    }

    // Step C: Match to playbook
    const playbook = HEALER_PLAYBOOKS[failure.category];
    if (!playbook) {
      unresolved.push({
        suite: failure.suite,
        step: failure.step,
        category: failure.category,
        errorMessage: failure.errorMessage,
        note: 'No playbook registered for this category.',
      });
      continue;
    }

    // Step D: Generate and apply patch
    onProgress?.(`Applying playbook: ${playbook.name} for ${failure.step}`);
    const patchStart = performance.now();

    try {
      const patches = await playbook.execute(failure, adminUserId);
      const patchDescriptions = patches.map(p => p.description).join('; ');

      // Step E: Check if re-run succeeded (playbooks report their own result)
      const rerunPassed = patches.every(p => p.success);

      autoHealed.push({
        suite: failure.suite,
        step: failure.step,
        category: failure.category,
        playbook: playbook.name,
        patchApplied: patchDescriptions || 'No action needed',
        rerunResult: rerunPassed ? 'passed' : 'failed',
        durationMs: Math.round(performance.now() - patchStart),
      });

      if (!rerunPassed) {
        // Patch was applied but re-run still failed — escalate
        unresolved.push({
          suite: failure.suite,
          step: failure.step,
          category: failure.category,
          errorMessage: failure.errorMessage,
          note: `Playbook "${playbook.name}" applied but re-run still failed: ${patchDescriptions}`,
        });
      }
    } catch (err) {
      unresolved.push({
        suite: failure.suite,
        step: failure.step,
        category: failure.category,
        errorMessage: failure.errorMessage,
        note: `Playbook "${playbook.name}" threw error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  // Confidence score: (auto_healed_passed + already_passed) / total_steps * 100
  // Penalize 15 points per restricted failure
  const healedPassedCount = autoHealed.filter(h => h.rerunResult === 'passed').length;
  const rawScore = totalSteps > 0
    ? ((healedPassedCount + alreadyPassed) / totalSteps) * 100
    : 0;
  const penalty = pendingApproval.length * 15;
  const confidenceScore = Math.max(0, Math.min(100, Math.round(rawScore - penalty)));

  return {
    totalFailures: failures.length,
    totalSteps,
    alreadyPassed,
    autoHealed,
    pendingApproval,
    unresolved,
    confidenceScore,
    timestamp: new Date().toISOString(),
    durationMs: Math.round(performance.now() - healerStart),
  };
}
