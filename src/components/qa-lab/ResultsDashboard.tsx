import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQALab, type QATestRun, type QATestResult } from '@/hooks/useQALab';
import { useFeedbackSafe } from '@/contexts/FeedbackContext';
import { BarChart3, RefreshCw, Trash2, ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertTriangle, Clock, MapPin, Shield, Zap, Database, Globe, CreditCard, Server, HardDrive, Timer, Eye } from 'lucide-react';
import type { FailureCategory } from '@/lib/qaTestRunner';

interface Props {
  refreshKey?: number;
}

// Phase 4: Root cause cluster config
const FAILURE_CATEGORY_CONFIG: Record<FailureCategory, { label: string; color: string; icon: React.ReactNode }> = {
  RLS_DENIED: { label: 'RLS Denied', color: 'bg-red-500/20 text-red-400', icon: <Shield className="w-3.5 h-3.5" /> },
  AUTH_CONTEXT_MISMATCH: { label: 'Auth Mismatch', color: 'bg-orange-500/20 text-orange-400', icon: <Zap className="w-3.5 h-3.5" /> },
  EDGE_PARAMS_INVALID: { label: 'Edge Params Invalid', color: 'bg-yellow-500/20 text-yellow-400', icon: <Globe className="w-3.5 h-3.5" /> },
  RESPONSE_SCHEMA_INVALID: { label: 'Response Schema', color: 'bg-purple-500/20 text-purple-400', icon: <Server className="w-3.5 h-3.5" /> },
  CREDIT_LEDGER_MISMATCH: { label: 'Credit Ledger', color: 'bg-emerald-500/20 text-emerald-400', icon: <CreditCard className="w-3.5 h-3.5" /> },
  WEBHOOK_STATE_MISMATCH: { label: 'Webhook State', color: 'bg-blue-500/20 text-blue-400', icon: <Database className="w-3.5 h-3.5" /> },
  STORAGE_PATH_INVALID: { label: 'Storage Path', color: 'bg-cyan-500/20 text-cyan-400', icon: <HardDrive className="w-3.5 h-3.5" /> },
  ASYNC_TIMEOUT: { label: 'Timeout', color: 'bg-amber-500/20 text-amber-400', icon: <Timer className="w-3.5 h-3.5" /> },
  NULL_UI_STATE: { label: 'Null State', color: 'bg-pink-500/20 text-pink-400', icon: <Eye className="w-3.5 h-3.5" /> },
  UNKNOWN: { label: 'Unknown', color: 'bg-muted text-muted-foreground', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

export function ResultsDashboard({ refreshKey }: Props) {
  const [runs, setRuns] = useState<QATestRun[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [stepResults, setStepResults] = useState<Record<string, QATestResult[]>>({});
  const [loading, setLoading] = useState(true);
  const { fetchTestRuns, fetchTestResults, archiveTestRuns, isLoading } = useQALab();
  const { showFeedback } = useFeedbackSafe();

  const loadRuns = async () => {
    setLoading(true);
    try {
      const data = await fetchTestRuns();
      setRuns(data);
    } catch {
      showFeedback({ type: 'error', title: 'Error', message: 'Failed to load test runs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRuns(); }, [refreshKey]);

  const toggleExpand = async (runId: string) => {
    if (expandedRun === runId) {
      setExpandedRun(null);
      return;
    }
    setExpandedRun(runId);
    if (!stepResults[runId]) {
      try {
        const results = await fetchTestResults(runId);
        setStepResults(prev => ({ ...prev, [runId]: results }));
      } catch {
        showFeedback({ type: 'error', title: 'Error', message: 'Failed to load step results' });
      }
    }
  };

  const handleArchive = async () => {
    try {
      await archiveTestRuns();
      showFeedback({ type: 'success', title: 'Archived', message: 'All test runs cleared' });
      setRuns([]);
      setStepResults({});
      setExpandedRun(null);
    } catch {
      showFeedback({ type: 'error', title: 'Error', message: 'Failed to archive test runs' });
    }
  };

  // Phase 4: Compute root cause clusters from all loaded step results
  const rootCauseClusters = useMemo(() => {
    const clusters: Record<string, { count: number; suites: Set<string> }> = {};
    for (const [runId, steps] of Object.entries(stepResults)) {
      const run = runs.find(r => r.id === runId);
      for (const step of steps) {
        if (step.status === 'failed') {
          const category = (step.metadata as any)?.failureCategory || 'UNKNOWN';
          if (!clusters[category]) clusters[category] = { count: 0, suites: new Set() };
          clusters[category].count++;
          if (run) clusters[category].suites.add(run.suite_name);
        }
      }
    }
    return clusters;
  }, [stepResults, runs]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'running': return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const stepStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5 text-destructive" />;
      case 'skipped': return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const totalRuns = runs.length;
  const passedRuns = runs.filter(r => r.status === 'completed').length;
  const failedRuns = runs.filter(r => r.status === 'failed').length;

  const hasClusterData = Object.keys(rootCauseClusters).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          QA Results Dashboard
        </h2>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={loadRuns} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" variant="destructive" onClick={handleArchive} disabled={isLoading || runs.length === 0}>
            <Trash2 className="w-4 h-4 mr-1" /> Archive All
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <div className="text-2xl font-bold">{totalRuns}</div>
          <div className="text-xs text-muted-foreground">Total Runs</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-2xl font-bold text-green-500">{passedRuns}</div>
          <div className="text-xs text-muted-foreground">Passed</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-2xl font-bold text-destructive">{failedRuns}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </div>
      </div>

      {/* Phase 4: Root Cause Clusters */}
      {hasClusterData && (
        <div className="glass-card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Root Cause Clusters
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(rootCauseClusters).map(([category, data]) => {
              const config = FAILURE_CATEGORY_CONFIG[category as FailureCategory] || FAILURE_CATEGORY_CONFIG.UNKNOWN;
              return (
                <div key={category} className="flex items-center gap-1.5">
                  <Badge className={`${config.color} text-[10px] gap-1`}>
                    {config.icon}
                    {config.label}: {data.count}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    ({data.suites.size} suite{data.suites.size !== 1 ? 's' : ''})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Runs list */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading results...</div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">No test runs yet. Go to Test Suites to run some tests.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map(run => (
            <div key={run.id} className="glass-card overflow-hidden">
              <button
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
                onClick={() => toggleExpand(run.id)}
              >
                {statusIcon(run.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{run.suite_name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {run.passed_steps}/{run.total_steps} passed
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {run.started_at ? new Date(run.started_at).toLocaleString() : 'Not started'}
                    {run.test_user_id && ` • User: ${run.test_user_id.slice(0, 8)}...`}
                  </div>
                </div>
                {expandedRun === run.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>

              {expandedRun === run.id && (
                <div className="border-t border-border/50 px-4 py-3 space-y-2">
                  {run.error_summary && (
                    <div className="text-xs text-destructive bg-destructive/10 rounded p-2 mb-3">
                      {run.error_summary}
                    </div>
                  )}
                  {stepResults[run.id]?.map(step => {
                    const failCat = (step.metadata as any)?.failureCategory as FailureCategory | undefined;
                    const catConfig = failCat ? FAILURE_CATEGORY_CONFIG[failCat] : null;
                    return (
                      <div key={step.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          {stepStatusIcon(step.status)}
                          <span className={step.status === 'failed' ? 'text-destructive font-medium' : ''}>
                            {step.step_name}
                          </span>
                          {catConfig && (
                            <Badge className={`${catConfig.color} text-[9px] gap-0.5 py-0`}>
                              {catConfig.icon}
                              {catConfig.label}
                            </Badge>
                          )}
                          {step.action_location && (
                            <span className="flex items-center gap-0.5 text-muted-foreground">
                              <MapPin className="w-3 h-3" /> {step.action_location}
                            </span>
                          )}
                          <span className="ml-auto text-muted-foreground">{step.duration_ms}ms</span>
                        </div>
                        {step.error_message && (
                          <div className="ml-5 text-[11px] text-destructive bg-destructive/5 rounded p-1.5 font-mono">
                            {step.error_message}
                          </div>
                        )}
                        {step.error_log && (
                          <details className="ml-5">
                            <summary className="text-[10px] text-muted-foreground cursor-pointer">Stack trace</summary>
                            <pre className="text-[10px] text-muted-foreground bg-muted/30 rounded p-2 mt-1 overflow-x-auto max-h-32">{step.error_log}</pre>
                          </details>
                        )}
                      </div>
                    );
                  }) || (
                    <div className="text-xs text-muted-foreground text-center py-2">Loading steps...</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
