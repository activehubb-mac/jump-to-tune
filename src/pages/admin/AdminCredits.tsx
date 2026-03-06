import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, Zap, Save, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function AdminCredits() {
  const queryClient = useQueryClient();
  const [editedCosts, setEditedCosts] = useState<Record<string, number>>({});

  // Fetch credit costs
  const { data: costs = [], isLoading: costsLoading } = useQuery({
    queryKey: ['admin-ai-credit-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_credit_costs')
        .select('*')
        .order('credit_cost', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch usage aggregation
  const { data: usageStats = [], isLoading: usageLoading } = useQuery({
    queryKey: ['admin-ai-credit-usage-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_credit_usage')
        .select('action, credits_used');
      if (error) throw error;
      // Aggregate by action
      const map = new Map<string, { action: string; total: number; count: number }>();
      for (const row of data ?? []) {
        const existing = map.get(row.action);
        if (existing) {
          existing.total += row.credits_used;
          existing.count += 1;
        } else {
          map.set(row.action, { action: row.action, total: row.credits_used, count: 1 });
        }
      }
      return Array.from(map.values()).sort((a, b) => b.total - a.total);
    },
  });

  // Fetch recent usage feed
  const { data: recentUsage = [] } = useQuery({
    queryKey: ['admin-ai-credit-usage-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_credit_usage')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Update cost mutation
  const updateCostMutation = useMutation({
    mutationFn: async ({ id, credit_cost }: { id: string; credit_cost: number }) => {
      const { error } = await supabase
        .from('ai_credit_costs')
        .update({ credit_cost, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-credit-costs'] });
      toast.success('Credit cost updated');
    },
    onError: () => toast.error('Failed to update cost'),
  });

  const totalCreditsConsumed = usageStats.reduce((sum, s) => sum + s.total, 0);
  const totalGenerations = usageStats.reduce((sum, s) => sum + s.count, 0);

  if (costsLoading || usageLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Zap className="w-3.5 h-3.5" /> Total Credits Used
            </div>
            <p className="text-2xl font-bold">{totalCreditsConsumed.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" /> Total Generations
            </div>
            <p className="text-2xl font-bold">{totalGenerations.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs mb-1">Active Tools</div>
            <p className="text-2xl font-bold">{costs.filter(c => c.is_active).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Breakdown Chart */}
      {usageStats.length > 0 && (
        <Card>
          <CardHeader className="px-4 md:px-6 pb-2">
            <CardTitle className="text-base">Credits by Tool</CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageStats} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="action" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [`${value} credits`, 'Used']}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {usageStats.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editable Credit Costs Table */}
      <Card>
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-base">Credit Costs per Tool</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Cost</TableHead>
                <TableHead className="w-16">Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs.map((cost) => {
                const edited = editedCosts[cost.id];
                const hasChange = edited !== undefined && edited !== cost.credit_cost;
                return (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium text-sm">{cost.label}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {cost.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-20 text-sm"
                        value={edited ?? cost.credit_cost}
                        onChange={(e) => setEditedCosts(prev => ({
                          ...prev,
                          [cost.id]: parseInt(e.target.value) || 0,
                        }))}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={cost.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {cost.is_active ? 'Active' : 'Off'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hasChange && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            updateCostMutation.mutate({ id: cost.id, credit_cost: edited });
                            setEditedCosts(prev => {
                              const next = { ...prev };
                              delete next[cost.id];
                              return next;
                            });
                          }}
                        >
                          <Save className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Usage Feed */}
      <Card>
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Recent AI Usage</span>
            <Badge variant="outline">{recentUsage.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          <div className="space-y-2">
            {recentUsage.map((usage) => (
              <div key={usage.id} className="flex items-center justify-between p-2 rounded-lg glass-card text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-medium truncate">{usage.action}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="outline" className="text-[10px]">{usage.credits_used} cr</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(usage.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
            {recentUsage.length === 0 && (
              <p className="text-center text-muted-foreground py-6">No AI credit usage yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
