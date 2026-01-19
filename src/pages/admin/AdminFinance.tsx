import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, DollarSign, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

export default function AdminFinance() {
  // Fetch all purchases
  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ['admin-purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('purchased_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch all earnings
  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['admin-earnings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_earnings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch all credit transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Calculate totals
  const totalPurchases = purchases?.reduce((sum, p) => 
    sum + Number(p.price_paid) + Number(p.tip_amount || 0), 0
  ) || 0;

  const totalPending = earnings?.filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.artist_payout_cents, 0) || 0;

  const totalPaid = earnings?.filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + e.artist_payout_cents, 0) || 0;

  const isLoading = purchasesLoading || earningsLoading || transactionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPurchases.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {purchases?.length || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payouts
            </CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalPending / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {earnings?.filter(e => e.status === 'pending').length || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Out
            </CardTitle>
            <ArrowUpRight className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalPaid / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {earnings?.filter(e => e.status === 'paid').length || 0} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="purchases" className="w-full">
        <TabsList>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="earnings">Artist Earnings</TabsTrigger>
          <TabsTrigger value="credits">Credit Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {purchases?.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="text-sm font-mono">{purchase.id.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">
                        Edition #{purchase.edition_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${(Number(purchase.price_paid) + Number(purchase.tip_amount || 0)).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(purchase.purchased_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!purchases || purchases.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No purchases found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Artist Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {earnings?.map((earning) => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="text-sm font-mono">{earning.artist_id.slice(0, 8)}...</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={
                            earning.status === 'paid' ? 'default' : 
                            earning.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {earning.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${(earning.artist_payout_cents / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fee: ${(earning.platform_fee_cents / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!earnings || earnings.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No earnings found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Credit Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions?.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      {tx.type === 'purchase' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${tx.type === 'purchase' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'purchase' ? '+' : '-'}${(tx.amount_cents / 100).toFixed(2)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {tx.type}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No transactions found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
