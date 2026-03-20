import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedbackSafe } from '@/contexts/FeedbackContext';
import { QA_TEST_SUITES, QA_SUITE_CATEGORIES } from '@/lib/qaTestSuites';
import { runTestSuite, runAllSuites, type RunResult } from '@/lib/qaTestRunner';
import { Play, PlayCircle, CheckCircle2, XCircle, Loader2, Clock, AlertTriangle } from 'lucide-react';

interface RunProgress {
  suiteId: string;
  currentStep: number;
  totalSteps: number;
  stepName: string;
  stepStatus: string;
}

interface Props {
  onRunComplete?: (results?: RunResult[]) => void;
}

export function TestSuitesTab({ onRunComplete }: Props) {
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const [running, setRunning] = useState<string | 'all' | null>(null);
  const [progress, setProgress] = useState<RunProgress | null>(null);
  const [lastResults, setLastResults] = useState<RunResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredSuites = selectedCategory
    ? QA_TEST_SUITES.filter(s => s.category === selectedCategory)
    : QA_TEST_SUITES;

  const handleRunSingle = async (suiteId: string) => {
    if (!user) return;
    const suite = QA_TEST_SUITES.find(s => s.id === suiteId);
    if (!suite) return;

    setRunning(suiteId);
    setProgress({ suiteId, currentStep: 0, totalSteps: suite.steps.length, stepName: 'Starting...', stepStatus: 'running' });

    try {
      const result = await runTestSuite(suite, user.id, (step, total, name, status) => {
        setProgress({ suiteId, currentStep: step, totalSteps: total, stepName: name, stepStatus: status });
      });
      setLastResults([result]);
      showFeedback({
        type: result.status === 'completed' ? 'success' : 'error',
        title: result.status === 'completed' ? 'All Tests Passed' : 'Some Tests Failed',
        message: `${result.passedSteps}/${result.totalSteps} passed`,
      });
      onRunComplete?.([result]);
    } catch (err) {
      showFeedback({ type: 'error', title: 'Test Error', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setRunning(null);
      setProgress(null);
    }
  };

  const handleRunAll = async () => {
    if (!user) return;
    setRunning('all');
    setLastResults([]);

    try {
      const results = await runAllSuites(
        QA_TEST_SUITES,
        user.id,
        (idx, total, name) => {
          setProgress({ suiteId: 'all', currentStep: idx, totalSteps: total, stepName: `Suite: ${name}`, stepStatus: 'running' });
        }
      );
      setLastResults(results);
      const totalPassed = results.reduce((s, r) => s + r.passedSteps, 0);
      const totalSteps = results.reduce((s, r) => s + r.totalSteps, 0);
      const allPassed = results.every(r => r.status === 'completed');
      showFeedback({
        type: allPassed ? 'success' : 'error',
        title: allPassed ? 'Full Regression Passed' : 'Regression Has Failures',
        message: `${totalPassed}/${totalSteps} steps passed across ${results.length} suites`,
      });
      onRunComplete?.();
    } catch (err) {
      showFeedback({ type: 'error', title: 'Regression Error', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setRunning(null);
      setProgress(null);
    }
  };

  const getCategoryConfig = (cat: string) => QA_SUITE_CATEGORIES.find(c => c.id === cat);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-primary" />
          Test Suites
        </h2>
        <div className="ml-auto">
          <Button onClick={handleRunAll} disabled={!!running} size="sm">
            {running === 'all' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
            Run Full Regression
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {progress && (
        <div className="glass-card-bordered p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="font-medium">{progress.stepName}</span>
            <span className="ml-auto text-muted-foreground">{progress.currentStep}/{progress.totalSteps}</span>
          </div>
          <Progress value={(progress.currentStep / progress.totalSteps) * 100} className="h-2" />
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === null ? 'default' : 'secondary'}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          All ({QA_TEST_SUITES.length})
        </Badge>
        {QA_SUITE_CATEGORIES.map(cat => (
          <Badge
            key={cat.id}
            variant="secondary"
            className={`cursor-pointer ${selectedCategory === cat.id ? cat.color : ''}`}
            onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
          >
            {cat.label} ({QA_TEST_SUITES.filter(s => s.category === cat.id).length})
          </Badge>
        ))}
      </div>

      {/* Suite cards */}
      <div className="grid gap-3">
        {filteredSuites.map(suite => {
          const catConfig = getCategoryConfig(suite.category);
          const isRunning = running === suite.id;
          const lastResult = lastResults.find(r => r.suiteName === suite.name);

          return (
            <div key={suite.id} className="glass-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{suite.name}</span>
                    {catConfig && (
                      <Badge variant="secondary" className={`text-[10px] ${catConfig.color}`}>{catConfig.label}</Badge>
                    )}
                    {lastResult && (
                      <Badge variant={lastResult.status === 'completed' ? 'default' : 'destructive'} className="text-[10px]">
                        {lastResult.status === 'completed' ? <CheckCircle2 className="w-3 h-3 mr-0.5" /> : <XCircle className="w-3 h-3 mr-0.5" />}
                        {lastResult.passedSteps}/{lastResult.totalSteps}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{suite.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {suite.steps.length} steps</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRunSingle(suite.id)}
                  disabled={!!running}
                  className="shrink-0"
                >
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>

              {/* Step list (collapsed) */}
              {lastResult && lastResult.steps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                  {lastResult.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {step.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                      {step.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                      {step.status === 'skipped' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <span className={step.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}>
                        {step.stepName}
                      </span>
                      <span className="ml-auto text-muted-foreground">{step.durationMs}ms</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Safety notice */}
      <div className="glass-card p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Safety Rules</p>
        <p>• All tests use Stripe test mode only</p>
        <p>• Test content is hidden from public discovery</p>
        <p>• Real user notifications are never triggered</p>
        <p>• Real artist balances and fan data are never affected</p>
        <p>• Test users are cleaned up after each run</p>
      </div>
    </div>
  );
}
