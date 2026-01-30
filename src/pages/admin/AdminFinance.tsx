import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, DollarSign, ArrowUpRight, ArrowDownRight, Clock, Send, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminFinance() {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

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

  // Fetch all earnings with artist info
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

  // Fetch profiles for Stripe status
  const { data: profiles } = useQuery({
    queryKey: ['admin-profiles-stripe'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, stripe_account_id, stripe_payouts_enabled, stripe_account_status');
      if (error) throw error;
      return data;
    },
  });

  // Create profile map for quick lookup
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Process pending payouts
  const handleProcessPayouts = async () => {
    setIsProcessing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('Please sign in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('process-pending-payouts', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;

      toast.success(data.message || 'Payouts processed');
      queryClient.invalidateQueries({ queryKey: ['admin-earnings'] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process payouts';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Notify artists with incomplete Stripe setup
  const handleNotifyArtists = async () => {
    setIsNotifying(true);
    try {
      // Find artists with pending earnings but incomplete Stripe
      const pendingArtistIds = [...new Set(
        earnings?.filter(e => e.status === 'pending').map(e => e.artist_id) || []
      )];

      const artistsToNotify = pendingArtistIds.filter(id => {
        const profile = profileMap.get(id);
        return !profile?.stripe_payouts_enabled;
      });

      if (artistsToNotify.length === 0) {
        toast.info('No artists need notification');
        return;
      }

      // Insert notifications for each artist
      const notifications = artistsToNotify.map(artistId => ({
        user_id: artistId,
        type: 'payout_setup',
        title: '💰 Complete your payout setup!',
        message: 'You have pending earnings waiting! Complete your Stripe Connect setup to receive payouts.',
        metadata: { action_url: '/artist/payouts' },
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;

      toast.success(`Notified ${artistsToNotify.length} artist(s)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send notifications';
      toast.error(message);
    } finally {
      setIsNotifying(false);
    }
  };

  // Calculate totals
  const totalPurchases = purchases?.reduce((sum, p) => 
    sum + Number(p.price_paid) + Number(p.tip_amount || 0), 0
  ) || 0;

  const totalPending = earnings?.filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.artist_payout_cents, 0) || 0;

  const totalPaid = earnings?.filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + e.artist_payout_cents, 0) || 0;

  const pendingCount = earnings?.filter(e => e.status === 'pending').length || 0;

  const isLoading = purchasesLoading || earningsLoading || transactionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="text-xl md:text-2xl font-bold">${totalPurchases.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {purchases?.length || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Pending Payouts
            </CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="px-4 md:px-6 space-y-3">
            <div>
              <div className="text-xl md:text-2xl font-bold">${(totalPending / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {pendingCount} pending
              </p>
            </div>
            {pendingCount > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleProcessPayouts}
                  disabled={isProcessing}
                  className="flex-1 text-xs h-8"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Send className="w-3 h-3 mr-1" />
                  )}
                  Process
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNotifyArtists}
                  disabled={isNotifying}
                  className="flex-1 text-xs h-8"
                >
                  {isNotifying ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Bell className="w-3 h-3 mr-1" />
                  )}
                  Notify
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Paid Out
            </CardTitle>
            <ArrowUpRight className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="text-xl md:text-2xl font-bold">${(totalPaid / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {earnings?.filter(e => e.status === 'paid').length || 0} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="purchases" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="purchases" className="text-xs md:text-sm">Purchases</TabsTrigger>
          <TabsTrigger value="earnings" className="text-xs md:text-sm">Earnings</TabsTrigger>
          <TabsTrigger value="credits" className="text-xs md:text-sm">Credits</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="mt-4">
          <Card>
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-base md:text-lg">Recent Purchases</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="space-y-2">
                {purchases?.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-3 rounded-lg glass-card"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-mono truncate">{purchase.id.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">
                        Edition #{purchase.edition_number}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-medium text-sm md:text-base">
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
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-base md:text-lg">Artist Earnings</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="space-y-2">
                {earnings?.map((earning) => {
                  const profile = profileMap.get(earning.artist_id);
                  return (
                    <div
                      key={earning.id}
                      className="flex items-center justify-between p-3 rounded-lg glass-card"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs md:text-sm font-medium truncate">
                          {profile?.display_name || earning.artist_id.slice(0, 8) + '...'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge 
                            variant={
                              earning.status === 'paid' ? 'default' : 
                              earning.status === 'pending' ? 'secondary' : 'destructive'
                            }
                            className="text-[10px]"
                          >
                            {earning.status}
                          </Badge>
                          {profile && (
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] ${
                                profile.stripe_payouts_enabled 
                                  ? 'border-green-500/50 text-green-500' 
                                  : profile.stripe_account_id 
                                    ? 'border-yellow-500/50 text-yellow-500'
                                    : 'border-muted-foreground/50'
                              }`}
                            >
                              {profile.stripe_payouts_enabled 
                                ? '✓ Stripe' 
                                : profile.stripe_account_id 
                                  ? 'Incomplete'
                                  : 'No Stripe'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-medium text-sm md:text-base">
                          ${(earning.artist_payout_cents / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Fee: ${(earning.platform_fee_cents / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(!earnings || earnings.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">No earnings found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="mt-4">
          <Card>
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-base md:text-lg">Credit Transactions</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6">
              <div className="space-y-2">
                {transactions?.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg glass-card"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {tx.type === 'purchase' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`font-medium text-sm md:text-base ${tx.type === 'purchase' ? 'text-green-500' : 'text-red-500'}`}>
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