import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { runHealer, analyzeFailures, type HealerReport, type HealedItem, type RestrictedItem, type UnresolvedItem, type NonBlockingItem } from '@/lib/qaHealer';
import type { RunResult } from '@/lib/qaTestRunner';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedbackSafe } from '@/contexts/FeedbackContext';
import { Activity, ShieldAlert, ShieldCheck, ShieldX, Zap, Clock, AlertTriangle, CheckCircle2, XCircle, Loader2, Globe } from 'lucide-react';

interface HealerDashboardProps {
  lastResults: RunResult[];
}

export function HealerDashboard({ lastResults }: HealerDashboardProps) {
  const [report, setReport] = useState<HealerReport | null>(null);
  const [running, setRunning] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const { user } = useAuth();
  const { showFeedback } = useFeedbackSafe();

  const handleRunHealer = useCallback(async () => {
    if (!user || lastResults.length === 0) return;
    setRunning(true);
    setProgressMsg('Starting healer analysis...');
    try {
      const healerReport = await runHealer(lastResults, user.id, setProgressMsg);
      setReport(healerReport);
      showFeedback({
        type: healerReport.confidenceScore >= 80 ? 'success' : 'info',
        title: 'Healer Complete',
        message: `Confidence: ${healerReport.confidenceScore}% — ${healerReport.autoHealed.length} auto-healed, ${healerReport.pendingApproval.length} need approval`,
      });
    } catch (err) {
      showFeedback({ type: 'error', title: 'Healer Error', message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setRunning(false);
      setProgressMsg('');
    }
  }, [user, lastResults, showFeedback]);

  const failures = analyzeFailures(lastResults);
  const hasFailures = failures.length > 0;

  // Group failures by category for preview
  const failuresByCategory = failures.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={<Activity className="w-4 h-4" />}
          label="Total Failures"
          value={report ? report.totalFailures : failures.length}
          color="text-destructive"
        />
        <SummaryCard
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Auto-Healed"
          value={report?.autoHealed.filter(h => h.rerunResult === 'passed').length ?? 0}
          color="text-emerald-500"
        />
        <SummaryCard
          icon={<ShieldAlert className="w-4 h-4" />}
          label="Need Approval"
          value={report?.pendingApproval.length ?? 0}
          color="text-amber-500"
        />
        <SummaryCard
          icon={<Zap className="w-4 h-4" />}
          label="Confidence"
          value={report ? `${report.confidenceScore}%` : '—'}
          color={report && report.confidenceScore >= 80 ? 'text-emerald-500' : report && report.confidenceScore >= 50 ? 'text-amber-500' : 'text-muted-foreground'}
        />
      </div>

      {/* Confidence bar */}
      {report && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>System Confidence</span>
            <span>{report.confidenceScore}%</span>
          </div>
          <Progress value={report.confidenceScore} className="h-2" />
          <p className="text-[11px] text-muted-foreground">
            Healer ran in {report.durationMs}ms • {report.alreadyPassed} steps already passing • {report.totalSteps} total
          </p>
        </div>
      )}

      {/* Run button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleRunHealer}
          disabled={running || !hasFailures}
          size="sm"
          className="gap-1.5"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          {running ? 'Analyzing...' : 'Run Healer'}
        </Button>
        {running && <span className="text-xs text-muted-foreground animate-pulse">{progressMsg}</span>}
        {!hasFailures && <span className="text-xs text-muted-foreground">No failures to analyze — run test suites first</span>}
      </div>

      {/* Failure category preview (before healer runs) */}
      {!report && hasFailures && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3">Failure Breakdown (Pre-Analysis)</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(failuresByCategory).map(([cat, count]) => (
              <Badge key={cat} variant="outline" className="text-xs gap-1">
                {cat} <span className="font-bold">{count}</span>
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Healer report sections */}
      {report && (
        <Accordion type="multiple" defaultValue={['auto-healed', 'pending', 'non-blocking', 'unresolved']} className="space-y-2">
          {/* Auto-healed */}
          {report.autoHealed.length > 0 && (
            <AccordionItem value="auto-healed" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Auto-Healed ({report.autoHealed.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Suite</TableHead>
                      <TableHead className="text-xs">Step</TableHead>
                      <TableHead className="text-xs">Playbook</TableHead>
                      <TableHead className="text-xs">Patch</TableHead>
                      <TableHead className="text-xs">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.autoHealed.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{item.suite}</TableCell>
                        <TableCell className="text-xs">{item.step}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">{item.playbook}</Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{item.patchApplied}</TableCell>
                        <TableCell>
                          {item.rerunResult === 'passed'
                            ? <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">Healed</Badge>
                            : <Badge variant="destructive" className="text-[10px]">Still Failing</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Pending approval */}
          {report.pendingApproval.length > 0 && (
            <AccordionItem value="pending" className="border border-amber-500/30 rounded-lg px-4">
              <AccordionTrigger className="text-sm py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Requires Approval ({report.pendingApproval.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {report.pendingApproval.map((item, i) => (
                    <Card key={i} className="p-3 border-amber-500/20">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs">
                          <div className="font-medium">{item.suite} → {item.step}</div>
                          <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                          <p className="text-muted-foreground">{item.errorMessage}</p>
                          <div className="border-t pt-1 mt-1">
                            <p className="text-amber-400/80 font-medium">Suggested fix:</p>
                            <p className="text-muted-foreground">{item.suggestedFix}</p>
                          </div>
                          <p className="text-destructive/70 italic">{item.reason}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Unresolved */}
          {report.unresolved.length > 0 && (
            <AccordionItem value="unresolved" className="border border-destructive/30 rounded-lg px-4">
              <AccordionTrigger className="text-sm py-3">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  Unresolved ({report.unresolved.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {report.unresolved.map((item, i) => (
                    <Card key={i} className="p-3 border-destructive/20">
                      <div className="flex items-start gap-2">
                        <ShieldX className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs">
                          <div className="font-medium">{item.suite} → {item.step}</div>
                          <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                          <p className="text-muted-foreground">{item.errorMessage}</p>
                          <p className="text-muted-foreground italic">{item.note}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </Card>
  );
}
