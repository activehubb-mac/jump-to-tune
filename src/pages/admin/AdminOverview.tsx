import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Music, DollarSign, TrendingUp, Loader2 } from 'lucide-react';

export default function AdminOverview() {
  // Fetch platform stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: userCount },
        { count: trackCount },
        { count: purchaseCount },
        { data: revenueData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tracks').select('*', { count: 'exact', head: true }),
        supabase.from('purchases').select('*', { count: 'exact', head: true }),
        supabase.from('purchases').select('price_paid, tip_amount'),
      ]);

      const totalRevenue = revenueData?.reduce((sum, p) => 
        sum + Number(p.price_paid || 0) + Number(p.tip_amount || 0), 0
      ) || 0;

      return {
        users: userCount || 0,
        tracks: trackCount || 0,
        purchases: purchaseCount || 0,
        revenue: totalRevenue,
      };
    },
  });

  // Fetch recent activity
  const { data: recentPurchases } = useQuery({
    queryKey: ['admin-recent-purchases'],
    queryFn: async () => {
      const { data } = await supabase
        .from('purchases')
        .select(`
          id,
          price_paid,
          tip_amount,
          purchased_at,
          track_id
        `)
        .order('purchased_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users?.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tracks
            </CardTitle>
            <Music className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tracks?.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Purchases
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.purchases?.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.revenue?.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPurchases && recentPurchases.length > 0 ? (
            <div className="space-y-3">
              {recentPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="text-sm">
                    <span className="text-muted-foreground">Track: </span>
                    <span className="font-mono text-xs">{purchase.track_id.slice(0, 8)}...</span>
                  </div>
                  <div className="text-sm font-medium">
                    ${(Number(purchase.price_paid) + Number(purchase.tip_amount || 0)).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(purchase.purchased_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent purchases</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
