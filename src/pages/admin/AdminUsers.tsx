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
  ShieldCheck, Music, Building2 
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

type UserWithRole = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  created_at: string;
  role: string | null;
};

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, is_verified, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      return profiles?.map(profile => ({
        ...profile,
        role: roleMap.get(profile.id) || 'fan',
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
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>All Users</span>
            <Badge variant="outline">{filteredUsers?.length || 0} users</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredUsers?.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {user.display_name || 'Unnamed User'}
                      </span>
                      {user.is_verified && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {user.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={getRoleBadgeVariant(user.role) as any}>
                    <span className="flex items-center gap-1">
                      {getRoleIcon(user.role)}
                      {user.role || 'fan'}
                    </span>
                  </Badge>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={user.is_verified ? "outline" : "default"}
                        size="sm"
                      >
                        {user.is_verified ? (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Unverify
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verify
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {user.is_verified ? 'Remove Verification' : 'Verify User'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {user.is_verified
                            ? `Remove verification badge from ${user.display_name || 'this user'}?`
                            : `Grant verification badge to ${user.display_name || 'this user'}?`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
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
                </div>
              </div>
            ))}

            {filteredUsers?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No users found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
