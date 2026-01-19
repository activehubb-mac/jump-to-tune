import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Users, DollarSign, Music } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

export default function AdminAnalytics() {
  // Fetch user growth data
  const { data: userGrowth, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-user-growth'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      // Group by day
      const days = eachDayOfInterval({
        start: subDays(new Date(), 30),
        end: new Date(),
      });

      return days.map((day) => {
        const dayStart = startOfDay(day);
        const count = data?.filter((u) => {
          const created = startOfDay(new Date(u.created_at));
          return created.getTime() === dayStart.getTime();
        }).length || 0;

        return {
          date: format(day, 'MMM dd'),
          users: count,
        };
      });
    },
  });

  // Fetch revenue data
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['admin-revenue-trend'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from('purchases')
        .select('purchased_at, price_paid, tip_amount')
        .gte('purchased_at', thirtyDaysAgo)
        .order('purchased_at', { ascending: true });

      const days = eachDayOfInterval({
        start: subDays(new Date(), 30),
        end: new Date(),
      });

      return days.map((day) => {
        const dayStart = startOfDay(day);
        const dayPurchases = data?.filter((p) => {
          const purchased = startOfDay(new Date(p.purchased_at));
          return purchased.getTime() === dayStart.getTime();
        }) || [];

        const revenue = dayPurchases.reduce(
          (sum, p) => sum + Number(p.price_paid) + Number(p.tip_amount || 0),
          0
        );

        return {
          date: format(day, 'MMM dd'),
          revenue: Number(revenue.toFixed(2)),
        };
      });
    },
  });

  // Fetch track uploads data
  const { data: trackData, isLoading: loadingTracks } = useQuery({
    queryKey: ['admin-track-uploads'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from('tracks')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      const days = eachDayOfInterval({
        start: subDays(new Date(), 30),
        end: new Date(),
      });

      return days.map((day) => {
        const dayStart = startOfDay(day);
        const count = data?.filter((t) => {
          const created = startOfDay(new Date(t.created_at));
          return created.getTime() === dayStart.getTime();
        }).length || 0;

        return {
          date: format(day, 'MMM dd'),
          tracks: count,
        };
      });
    },
  });

  // Fetch activity data (likes + follows)
  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const [{ data: likes }, { data: follows }] = await Promise.all([
        supabase
          .from('likes')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('follows')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo),
      ]);

      const days = eachDayOfInterval({
        start: subDays(new Date(), 30),
        end: new Date(),
      });

      return days.map((day) => {
        const dayStart = startOfDay(day);
        
        const likeCount = likes?.filter((l) => {
          const created = startOfDay(new Date(l.created_at));
          return created.getTime() === dayStart.getTime();
        }).length || 0;

        const followCount = follows?.filter((f) => {
          const created = startOfDay(new Date(f.created_at));
          return created.getTime() === dayStart.getTime();
        }).length || 0;

        return {
          date: format(day, 'MMM dd'),
          likes: likeCount,
          follows: followCount,
        };
      });
    },
  });

  const isLoading = loadingUsers || loadingRevenue || loadingTracks || loadingActivity;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const chartConfig = {
    users: { label: 'New Users', color: 'hsl(var(--primary))' },
    revenue: { label: 'Revenue', color: 'hsl(var(--chart-2))' },
    tracks: { label: 'Tracks', color: 'hsl(var(--chart-3))' },
    likes: { label: 'Likes', color: 'hsl(var(--chart-4))' },
    follows: { label: 'Follows', color: 'hsl(var(--chart-5))' },
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 md:px-6">
            <CardTitle className="text-sm md:text-base font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="truncate">User Growth (30d)</span>
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ChartContainer config={chartConfig} className="h-[200px] md:h-[250px] w-full">
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="hsl(var(--primary))"
                  fill="url(#userGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 md:px-6">
            <CardTitle className="text-sm md:text-base font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="truncate">Revenue (30d)</span>
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ChartContainer config={chartConfig} className="h-[200px] md:h-[250px] w-full">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                  width={40}
                />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(v) => `$${v}`} />}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Track Uploads Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 md:px-6">
            <CardTitle className="text-sm md:text-base font-medium flex items-center gap-2">
              <Music className="w-4 h-4 text-purple-500" />
              <span className="truncate">Track Uploads (30d)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ChartContainer config={chartConfig} className="h-[200px] md:h-[250px] w-full">
              <BarChart data={trackData}>
                <XAxis
                  dataKey="date"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="tracks"
                  fill="hsl(var(--chart-3))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Activity Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 md:px-6">
            <CardTitle className="text-sm md:text-base font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="truncate">User Activity (30d)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ChartContainer config={chartConfig} className="h-[200px] md:h-[250px] w-full">
              <LineChart data={activityData}>
                <XAxis
                  dataKey="date"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis fontSize={10} tickLine={false} axisLine={false} width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="likes"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="follows"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}