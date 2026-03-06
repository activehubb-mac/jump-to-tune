import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Loader2, Search, CheckCircle, XCircle, User, 
  ShieldCheck, Music, Building2, Shield, ShieldOff, CreditCard, Zap, Plus, Minus
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';

type UserWithRole = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  created_at: string;
  role: string | null;
  isAdmin: boolean;
  stripe_account_id: string | null;
  stripe_account_status: string | null;
  stripe_payouts_enabled: boolean | null;
};

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [creditUserId, setCreditUserId] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, is_verified, created_at, stripe_account_id, stripe_account_status, stripe_payouts_enabled')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map for primary roles and check for admin
      const roleMap = new Map<string, string>();
      const adminSet = new Set<string>();
      
      roles?.forEach(r => {
        if (r.role === 'admin') {
          adminSet.add(r.user_id);
        } else if (!roleMap.has(r.user_id)) {
          roleMap.set(r.user_id, r.role);
        }
      });

      return profiles?.map(profile => ({
        ...profile,
        role: roleMap.get(profile.id) || 'fan',
        isAdmin: adminSet.has(profile.id),
        stripe_account_id: profile.stripe_account_id,
        stripe_account_status: profile.stripe_account_status,
        stripe_payouts_enabled: profile.stripe_payouts_enabled,
      })) as UserWithRole[];
    },
  });

  // Toggle verification
  const verifyMutation = useMutation({
    mutationFn: async ({ userId, verified }: { userId: string; verified: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: verified })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User verification updated');
    },
    onError: (error) => {
      toast.error('Failed to update verification');
      console.error(error);
    },
  });

  // Promote to admin
  const promoteToAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User promoted to admin');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('User is already an admin');
      } else {
        toast.error('Failed to promote user');
      }
      console.error(error);
    },
  });

  // Remove admin role
  const removeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin role removed');
    },
    onError: (error) => {
      toast.error('Failed to remove admin role');
      console.error(error);
    },
  });

  // Add AI credits mutation
  const addCreditsMutation = useMutation({
    mutationFn: async ({ userId, credits }: { userId: string; credits: number }) => {
      const { data, error } = await supabase.rpc('add_ai_credits', { p_user_id: userId, p_credits: credits });
      if (error) throw error;
      const result = data as Record<string, unknown>;
      if (!result?.success) throw new Error('Failed to add credits');
      return result;
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`Added ${vars.credits} AI credits (new balance: ${data.new_credits})`);
      setCreditUserId(null);
      setCreditAmount('');
    },
    onError: (error) => {
      toast.error('Failed: ' + (error instanceof Error ? error.message : 'Unknown'));
    },
  });

  const deductCreditsMutation = useMutation({
    mutationFn: async ({ userId, credits }: { userId: string; credits: number }) => {
      const { data, error } = await supabase.rpc('deduct_ai_credits', { p_user_id: userId, p_credits: credits });
      if (error) throw error;
      const result = data as Record<string, unknown>;
      if (!result?.success) throw new Error(`Insufficient credits. Current: ${result?.current_credits}`);
      return result;
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`Removed ${vars.credits} AI credits (new balance: ${data.new_credits})`);
      setCreditUserId(null);
      setCreditAmount('');
    },
    onError: (error) => {
      toast.error('Failed: ' + (error instanceof Error ? error.message : 'Unknown'));
    },
  });

  const filteredUsers = users?.filter(user =>
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'artist':
        return <Music className="w-3 h-3" />;
      case 'label':
        return <Building2 className="w-3 h-3" />;
      case 'admin':
        return <ShieldCheck className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'artist':
        return 'secondary';
      case 'label':
        return 'outline';
      case 'admin':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Search */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 md:px-6 pb-3">
          <CardTitle className="text-base md:text-lg flex items-center justify-between">
            <span>All Users</span>
            <Badge variant="outline" className="text-xs">{filteredUsers?.length || 0} users</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6">
          <div className="space-y-2">
            {filteredUsers?.map((user) => (
              <div
                key={user.id}
                className="p-3 rounded-lg glass-card hover:bg-primary/5 transition-colors"
              >
                {/* Mobile: Stacked Layout */}
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-sm">
                      {user.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Name & ID */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">
                          {user.display_name || 'Unnamed'}
                        </span>
                        {user.is_verified && (
                          <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {user.id.slice(0, 8)}...
                      </p>
                    </div>
                    
                    {/* Role & Stripe Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge 
                        variant={getRoleBadgeVariant(user.role) as any} 
                        className="text-[10px] px-1.5 py-0.5 h-5"
                      >
                        <span className="flex items-center gap-1">
                          {getRoleIcon(user.role)}
                          {user.role || 'fan'}
                        </span>
                      </Badge>
                      {user.isAdmin && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 h-5">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            admin
                          </span>
                        </Badge>
                      )}
                      {/* Stripe Status Badge - only show for artists/labels */}
                      {(user.role === 'artist' || user.role === 'label') && (
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0.5 h-5 ${
                            user.stripe_payouts_enabled 
                              ? 'border-green-500/50 text-green-500' 
                              : user.stripe_account_id 
                                ? 'border-yellow-500/50 text-yellow-500'
                                : 'border-muted-foreground/30 text-muted-foreground'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-2.5 h-2.5" />
                            {user.stripe_payouts_enabled 
                              ? 'Active' 
                              : user.stripe_account_id 
                                ? 'Pending'
                                : 'Not Set'}
                          </span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Right aligned */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {user.id !== currentUser?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant={user.isAdmin ? "outline" : "destructive"}
                            size="icon"
                            className="h-7 w-7"
                          >
                            {user.isAdmin ? (
                              <ShieldOff className="w-3.5 h-3.5" />
                            ) : (
                              <Shield className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base">
                              {user.isAdmin ? 'Remove Admin Access' : 'Grant Admin Access'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              {user.isAdmin
                                ? `Remove admin privileges from ${user.display_name || 'this user'}?`
                                : `Grant admin privileges to ${user.display_name || 'this user'}?`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="w-full sm:w-auto"
                              onClick={() => user.isAdmin 
                                ? removeAdminMutation.mutate(user.id)
                                : promoteToAdminMutation.mutate(user.id)
                              }
                            >
                              {user.isAdmin ? 'Remove' : 'Make Admin'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant={user.is_verified ? "outline" : "default"}
                          size="icon"
                          className="h-7 w-7"
                        >
                          {user.is_verified ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base">
                            {user.is_verified ? 'Remove Verification' : 'Verify User'}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            {user.is_verified
                              ? `Remove verification from ${user.display_name || 'this user'}?`
                              : `Verify ${user.display_name || 'this user'}?`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="w-full sm:w-auto"
                            onClick={() => verifyMutation.mutate({ 
                              userId: user.id, 
                              verified: !user.is_verified 
                            })}
                          >
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* AI Credits Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setCreditUserId(creditUserId === user.id ? null : user.id)}
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Credit Management Inline Panel */}
                {creditUserId === user.id && (
                  <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 flex-wrap">
                    <Input
                      type="number"
                      placeholder="Credits"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="w-24 h-7 text-xs"
                      min={1}
                    />
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={!creditAmount || parseInt(creditAmount) <= 0 || addCreditsMutation.isPending}
                      onClick={() => addCreditsMutation.mutate({ userId: user.id, credits: parseInt(creditAmount) })}
                    >
                      <Plus className="w-3 h-3" /> Add
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs gap-1"
                      disabled={!creditAmount || parseInt(creditAmount) <= 0 || deductCreditsMutation.isPending}
                      onClick={() => deductCreditsMutation.mutate({ userId: user.id, credits: parseInt(creditAmount) })}
                    >
                      <Minus className="w-3 h-3" /> Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}



            {filteredUsers?.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No users found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}