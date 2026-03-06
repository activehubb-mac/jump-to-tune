import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Users, Crown, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const TIER_COLORS: Record<string, string> = {
  trial: 'hsl(var(--chart-1))',
  creator: 'hsl(var(--chart-2))',
  creator_pro: 'hsl(var(--chart-3))',
  label: 'hsl(var(--chart-4))',
  free: 'hsl(var(--muted))',
};

export default function AdminSubscriptions() {
  const [migrating, setMigrating] = useState(false);

  // Fetch subscription distribution from subscriptions table
  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ['admin-subscriptions-dist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('tier, status, founding_user, trial_ends_at, current_period_end');
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch migration logs
  const { data: migrationLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['admin-migration-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('migration_logs')
        .select('*')
        .order('migration_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Tier distribution
  const tierCounts = subscriptions.reduce((acc, sub) => {
    const tier = sub.tier || 'free';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(tierCounts).map(([name, value]) => ({ name, value }));
  const foundingCount = subscriptions.filter((s: any) => s.founding_user).length;
  const activeCount = subscriptions.filter((s: any) => s.status === 'active').length;
  const trialCount = subscriptions.filter((s: any) => s.status === 'trialing').length;

  const handleMigration = async (dryRun: boolean) => {
    setMigrating(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-legacy-subscriptions', {
        body: { dry_run: dryRun },
      });
      if (error) throw error;
      toast.success(dryRun ? `Dry run complete: ${data?.migrated ?? 0} users eligible` : `Migration complete: ${data?.migrated ?? 0} users migrated`);
      if (!dryRun) {
        // Refresh logs
      }
    } catch (err) {
      toast.error('Migration failed');
      console.error(err);
    } finally {
      setMigrating(false);
    }
  };

  if (subsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-3.5 h-3.5" /> Total Subscribers
            </div>
            <p className="text-2xl font-bold">{subscriptions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CreditCard className="w-3.5 h-3.5" /> Active
            </div>
            <p className="text-2xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Rocket className="w-3.5 h-3.5" /> On Trial
            </div>
            <p className="text-2xl font-bold">{trialCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Crown className="w-3.5 h-3.5" /> Founding Users
            </div>
            <p className="text-2xl font-bold">{foundingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution Chart */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader className="px-4 md:px-6 pb-2">
            <CardTitle className="text-base">Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={TIER_COLORS[entry.name] || 'hsl(var(--muted))'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Controls */}
      <Card>
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-base">Legacy Migration</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Migrate legacy Stripe subscribers to the AI credit system. Dry run shows eligible users without making changes.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" disabled={migrating} onClick={() => handleMigration(true)}>
              {migrating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Dry Run
            </Button>
            <Button variant="destructive" disabled={migrating} onClick={() => handleMigration(false)}>
              {migrating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Execute Migration
            </Button>
          </div>

          {/* Migration Logs */}
          {!logsLoading && migrationLogs.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Migration History</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Old Tier</TableHead>
                    <TableHead>Old Wallet</TableHead>
                    <TableHead>Credits Added</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {migrationLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-mono truncate max-w-[100px]">
                        {log.user_id.slice(0, 8)}…
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {log.old_subscription_tier || 'none'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">${(log.old_wallet_amount / 100).toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{log.credits_added}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.migration_date), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
