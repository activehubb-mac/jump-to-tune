import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useQALab } from '@/hooks/useQALab';
import { useFeedbackSafe } from '@/contexts/FeedbackContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAICredits } from '@/hooks/useAICredits';
import { supabase } from '@/integrations/supabase/client';
import { DummyDataTab } from '@/components/qa-lab/DummyDataTab';
import { TestUsersTab } from '@/components/qa-lab/TestUsersTab';
import { TestSuitesTab } from '@/components/qa-lab/TestSuitesTab';
import { ResultsDashboard } from '@/components/qa-lab/ResultsDashboard';
import { FlaskConical, Database, Users, PlayCircle, BarChart3, RotateCcw, AlertTriangle, Coins, Zap } from 'lucide-react';

export default function AdminQALab() {
  const [resultsKey, setResultsKey] = useState(0);
  const [addingCredits, setAddingCredits] = useState(false);
  const { resetAllDummyData, isLoading } = useQALab();
  const { showFeedback } = useFeedbackSafe();
  const { user } = useAuth();
  const { aiCredits, isLoading: isLoadingCredits, refetch } = useAICredits();

  const handleAddCredits = async () => {
    if (!user) return;
    setAddingCredits(true);
    try {
      const { data, error } = await supabase.functions.invoke('qa-admin', {
        body: { action: 'add-credits', userId: user.id, credits: 500 }
      });
      if (error || !data?.success) throw new Error(data?.error || 'Failed');
      await refetch();
      showFeedback({ type: 'success', title: 'Credits Added', message: '500 AI credits added to your wallet' });
    } catch {
      showFeedback({ type: 'error', title: 'Error', message: 'Failed to add credits' });
    } finally {
      setAddingCredits(false);
    }
  };

  const handleResetAll = async () => {
    if (!confirm('This will delete ALL dummy assets, test runs, and test users. Continue?')) return;
    try {
      await resetAllDummyData();
      showFeedback({ type: 'success', title: 'Reset Complete', message: 'All QA data has been cleared' });
      setResultsKey(prev => prev + 1);
    } catch {
      showFeedback({ type: 'error', title: 'Error', message: 'Failed to reset data' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">QA Lab</h2>
            <p className="text-xs text-muted-foreground">End-to-end platform testing with sandbox data</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 text-sm">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">{isLoadingCredits ? '...' : aiCredits}</span>
            <span className="text-muted-foreground">credits</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleAddCredits} disabled={addingCredits}>
            <Coins className="w-4 h-4 mr-1" /> {addingCredits ? 'Adding...' : 'Add 500 Credits'}
          </Button>
          <Button size="sm" variant="destructive" onClick={handleResetAll} disabled={isLoading}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset All Data
          </Button>
        </div>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-3 glass-card-bordered border-amber-500/30 p-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p className="font-medium text-foreground">Sandbox Environment</p>
          <p>All operations use test data only. Stripe test mode, hidden content, no real user impact.</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="suites" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="data" className="text-xs gap-1">
            <Database className="w-3.5 h-3.5" /> Data
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs gap-1">
            <Users className="w-3.5 h-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="suites" className="text-xs gap-1">
            <PlayCircle className="w-3.5 h-3.5" /> Tests
          </TabsTrigger>
          <TabsTrigger value="results" className="text-xs gap-1">
            <BarChart3 className="w-3.5 h-3.5" /> Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-4">
          <DummyDataTab />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <TestUsersTab />
        </TabsContent>

        <TabsContent value="suites" className="mt-4">
          <TestSuitesTab onRunComplete={() => setResultsKey(prev => prev + 1)} />
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <ResultsDashboard refreshKey={resultsKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
