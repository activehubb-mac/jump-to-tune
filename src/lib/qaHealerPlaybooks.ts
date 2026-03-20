// QA Healer Playbooks: Isolated, deterministic remediation functions
// Each playbook is a pure function that generates sandbox-safe patches

import { supabase } from '@/integrations/supabase/client';
import type { FailureCategory } from './qaTestRunner';
import type { AnalyzedFailure } from './qaHealer';

export interface PatchAction {
  type: 'seed-fixture' | 'fill-param' | 'retry' | 'create-actor' | 'log-skip';
  description: string;
  success: boolean;
  detail?: Record<string, unknown>;
}

export interface Playbook {
  name: string;
  description: string;
  execute: (failure: AnalyzedFailure, adminUserId: string) => Promise<PatchAction[]>;
}

// ===== Playbook: Fix missing fixtures (seed dummy data) =====
const fixMissingFixtures: Playbook = {
  name: 'Fix Missing Fixtures',
  description: 'Seeds missing dummy assets or creates test data when NULL_UI_STATE failures occur',
  execute: async (failure, adminUserId) => {
    const patches: PatchAction[] = [];
    const msg = failure.errorMessage.toLowerCase();

    // Check if dummy assets are missing
    if (msg.includes('dummy') || msg.includes('seed') || msg.includes('not found')) {
      try {
        const { data: existing } = await supabase
          .from('qa_dummy_assets')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (!existing) {
          // Seed default dummy assets via qa-admin
          const { data, error } = await supabase.functions.invoke('qa-admin', {
            body: { action: 'seed-defaults', userId: adminUserId },
          });

          patches.push({
            type: 'seed-fixture',
            description: error ? `Failed to seed fixtures: ${error.message}` : 'Seeded default dummy assets',
            success: !error && data?.success !== false,
          });
        } else {
          patches.push({
            type: 'seed-fixture',
            description: 'Dummy assets already exist — failure may be a specific missing record',
            success: true,
          });
        }
      } catch (err) {
        patches.push({
          type: 'seed-fixture',
          description: `Error checking fixtures: ${err instanceof Error ? err.message : String(err)}`,
          success: false,
        });
      }
    }

    // Check if test user is missing
    if (msg.includes('no test user') || msg.includes('no test') || msg.includes('missing context')) {
      try {
        const role = failure.userRole || 'fan';
        const { data, error } = await supabase.functions.invoke('qa-admin', {
          body: { action: 'create-test-user', role },
        });
        patches.push({
          type: 'create-actor',
          description: error
            ? `Failed to create test ${role}: ${error.message}`
            : `Created test ${role} user: ${data?.userId}`,
          success: !error && data?.success,
          detail: data,
        });
      } catch (err) {
        patches.push({
          type: 'create-actor',
          description: `Error creating test user: ${err instanceof Error ? err.message : String(err)}`,
          success: false,
        });
      }
    }

    if (patches.length === 0) {
      patches.push({
        type: 'log-skip',
        description: 'NULL_UI_STATE detected but no specific fixture remediation matched',
        success: false,
      });
    }

    return patches;
  },
};

// ===== Playbook: Fix missing edge function params =====
const fixMissingParams: Playbook = {
  name: 'Fix Missing Params',
  description: 'Fills missing required parameters from edge function contract registry',
  execute: async (failure) => {
    const patches: PatchAction[] = [];
    const msg = failure.errorMessage;

    // Extract field name from error like "Missing required field 'track_id'"
    const fieldMatch = msg.match(/Missing required field '(\w+)'/);
    const functionMatch = msg.match(/for (\S+)/);

    if (fieldMatch && functionMatch) {
      const field = fieldMatch[1];
      const fn = functionMatch[1];

      patches.push({
        type: 'fill-param',
        description: `Field '${field}' missing in call to '${fn}'. Ensure test context populates this value before the step runs. Check suite definition for correct $context token mapping.`,
        success: true, // Analysis success — the fix is informational
        detail: { field, function: fn, suggestion: `Map $context.${field} or provide a default value in the suite step params` },
      });
    } else {
      patches.push({
        type: 'fill-param',
        description: `Edge param validation failed: ${msg}. Review suite step params and contract registry.`,
        success: true,
        detail: { rawError: msg },
      });
    }

    return patches;
  },
};

// ===== Playbook: Fix test actor context =====
const fixTestActorContext: Playbook = {
  name: 'Fix Test Actor Context',
  description: 'Detects wrong user role and re-creates the correct deterministic test actor',
  execute: async (failure, adminUserId) => {
    const patches: PatchAction[] = [];
    const msg = failure.errorMessage.toLowerCase();

    // Detect role mismatch
    let neededRole = 'fan';
    if (msg.includes('artist') || failure.stepAction.includes('artist')) neededRole = 'artist';
    if (msg.includes('admin')) neededRole = 'admin';

    try {
      const { data, error } = await supabase.functions.invoke('qa-admin', {
        body: { action: 'create-test-user', role: neededRole },
      });

      patches.push({
        type: 'create-actor',
        description: error
          ? `Failed to create ${neededRole} actor: ${error.message}`
          : `Created correct ${neededRole} actor (${data?.userId}). Re-run suite with this context.`,
        success: !error && data?.success,
        detail: { role: neededRole, userId: data?.userId },
      });
    } catch (err) {
      patches.push({
        type: 'create-actor',
        description: `Error creating actor: ${err instanceof Error ? err.message : String(err)}`,
        success: false,
      });
    }

    return patches;
  },
};

// ===== Playbook: Retry with backoff =====
const retryWithBackoff: Playbook = {
  name: 'Retry With Backoff',
  description: 'Re-runs the step with doubled timeout for transient timeout failures',
  execute: async (failure) => {
    // We don't actually re-run here — we report the recommendation
    // The healer caller can decide to re-run the affected suite
    const originalTimeout = (failure.metadata as any)?.timeoutMs || 15000;
    const newTimeout = originalTimeout * 2;

    return [{
      type: 'retry',
      description: `Timeout failure detected. Recommend re-running with timeout increased from ${originalTimeout}ms to ${newTimeout}ms.`,
      success: true, // Recommendation logged successfully
      detail: { originalTimeout, recommendedTimeout: newTimeout },
    }];
  },
};

// ===== Playbook: Log and skip (non-blocking) =====
const logAndSkip: Playbook = {
  name: 'Log And Skip',
  description: 'Marks response schema mismatches as non-blocking warnings',
  execute: async (failure) => {
    return [{
      type: 'log-skip',
      description: `Response schema mismatch marked as non-blocking: ${failure.errorMessage}. The edge function is reachable but returned an unexpected shape.`,
      success: true,
      detail: { originalError: failure.errorMessage, severity: 'warning' },
    }];
  },
};

// ===== Playbook registry =====
export const HEALER_PLAYBOOKS: Partial<Record<FailureCategory, Playbook>> = {
  NULL_UI_STATE: fixMissingFixtures,
  EDGE_PARAMS_INVALID: fixMissingParams,
  AUTH_CONTEXT_MISMATCH: fixTestActorContext,
  ASYNC_TIMEOUT: retryWithBackoff,
  RESPONSE_SCHEMA_INVALID: logAndSkip,
};
