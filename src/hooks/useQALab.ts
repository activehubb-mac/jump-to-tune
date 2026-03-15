import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_DUMMY_ASSETS } from '@/lib/qaTestSuites';

export interface QADummyAsset {
  id: string;
  asset_type: string;
  name: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface QATestRun {
  id: string;
  suite_name: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  test_user_id: string | null;
  total_steps: number;
  passed_steps: number;
  failed_steps: number;
  error_summary: string | null;
  created_at: string;
}

export interface QATestResult {
  id: string;
  run_id: string;
  step_name: string;
  step_order: number;
  status: string;
  error_message: string | null;
  error_log: string | null;
  action_location: string | null;
  duration_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useQALab() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Dummy Assets
  const fetchDummyAssets = useCallback(async (): Promise<QADummyAsset[]> => {
    const { data, error } = await supabase.from('qa_dummy_assets').select('*').order('asset_type').order('name');
    if (error) throw error;
    return (data || []) as unknown as QADummyAsset[];
  }, []);

  const seedDummyAssets = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const assets = DEFAULT_DUMMY_ASSETS.map(a => ({ ...a, created_by: user.id }));
      const { error } = await supabase.from('qa_dummy_assets').insert(assets as any);
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const resetDummyAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('qa_dummy_assets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Test Runs
  const fetchTestRuns = useCallback(async (limit = 50): Promise<QATestRun[]> => {
    const { data, error } = await supabase.from('qa_test_runs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []) as unknown as QATestRun[];
  }, []);

  const fetchTestResults = useCallback(async (runId: string): Promise<QATestResult[]> => {
    const { data, error } = await supabase.from('qa_test_results').select('*').eq('run_id', runId).order('step_order');
    if (error) throw error;
    return (data || []) as unknown as QATestResult[];
  }, []);

  const archiveTestRuns = useCallback(async () => {
    setIsLoading(true);
    try {
      // Delete all test results first (cascades), then runs
      const { error } = await supabase.from('qa_test_runs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Test Users
  const createTestUser = useCallback(async (role: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('qa-admin', {
        body: { action: 'create-test-user', role },
      });
      if (error) throw error;
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listTestUsers = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('qa-admin', {
      body: { action: 'list-test-users' },
    });
    if (error) throw error;
    return data?.users || [];
  }, []);

  const deleteTestUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('qa-admin', {
        body: { action: 'cleanup-test-user', userId },
      });
      if (error) throw error;
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetAllDummyData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Reset dummy assets
      await supabase.from('qa_dummy_assets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // Reset test runs
      await supabase.from('qa_test_runs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // Cleanup test users
      await supabase.functions.invoke('qa-admin', { body: { action: 'cleanup-all-test-users' } });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    fetchDummyAssets,
    seedDummyAssets,
    resetDummyAssets,
    fetchTestRuns,
    fetchTestResults,
    archiveTestRuns,
    createTestUser,
    listTestUsers,
    deleteTestUser,
    resetAllDummyData,
  };
}
