import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQALab } from '@/hooks/useQALab';
import { useFeedbackSafe } from '@/contexts/FeedbackContext';
import { UserPlus, Trash2, RefreshCw, Users, Music, Headphones, Radio } from 'lucide-react';

interface TestUser {
  id: string;
  email: string;
  role: string;
  display_name: string;
  created_at: string;
}

const roleConfig: Record<string, { icon: React.ElementType; color: string }> = {
  artist: { icon: Music, color: 'bg-purple-500/20 text-purple-400' },
  fan: { icon: Headphones, color: 'bg-blue-500/20 text-blue-400' },
  dj: { icon: Radio, color: 'bg-green-500/20 text-green-400' },
};

export function TestUsersTab() {
  const [users, setUsers] = useState<TestUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const { createTestUser, listTestUsers, deleteTestUser, isLoading } = useQALab();
  const { showFeedback } = useFeedbackSafe();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await listTestUsers();
      setUsers(data);
    } catch {
      showFeedback({ type: 'error', title: 'Error', message: 'Failed to load test users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (role: string) => {
    setCreating(role);
    try {
      const result = await createTestUser(role);
      if (result?.success) {
        showFeedback({ type: 'success', title: 'Created', message: `Test ${role} account created: ${result.email}` });
        loadUsers();
      } else {
        showFeedback({ type: 'error', title: 'Error', message: result?.error || 'Failed' });
      }
    } catch {
      showFeedback({ type: 'error', title: 'Error', message: 'Failed to create test user' });
    } finally {
      setCreating(null);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteTestUser(userId);
      showFeedback({ type: 'success', title: 'Deleted', message: 'Test user removed' });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      showFeedback({ type: 'error', title: 'Error', message: 'Failed to delete test user' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Test User Generator
        </h2>
        <div className="ml-auto">
          <Button size="sm" variant="outline" onClick={loadUsers} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Create buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['artist', 'fan', 'dj'] as const).map(role => {
          const config = roleConfig[role] || roleConfig.fan;
          const Icon = config.icon;
          return (
            <button
              key={role}
              onClick={() => handleCreate(role)}
              disabled={!!creating}
              className="glass-card p-4 text-left hover:border-primary/30 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium capitalize">{role} Account</div>
                  <div className="text-xs text-muted-foreground">
                    {creating === role ? 'Creating...' : 'Click to create'}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Creates a sandbox {role} with is_test_user flag, trial subscription, and 15 AI credits
              </div>
            </button>
          );
        })}
      </div>

      {/* Test users list */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading test users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <UserPlus className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">No test users created yet</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => {
                const config = roleConfig[user.role] || roleConfig.fan;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Badge className={`text-xs ${config.color}`}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{user.email}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(user.id)} disabled={isLoading}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="glass-card p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">⚠️ Safety Rules</p>
        <p>• All test users are marked with <code className="bg-muted px-1 rounded">is_test_user: true</code> in metadata</p>
        <p>• Test users use <code className="bg-muted px-1 rounded">@jumtunes-test.internal</code> email domain</p>
        <p>• Test users do not trigger real email notifications</p>
        <p>• Deleting a test user cascades and removes all related data</p>
      </div>
    </div>
  );
}
