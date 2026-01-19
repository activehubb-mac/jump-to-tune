import { useEffect } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, Music, DollarSign, Shield, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/tracks', label: 'Tracks', icon: Music },
  { path: '/admin/finance', label: 'Finance', icon: DollarSign },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminAccess();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  if (authLoading || adminLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Shield className="w-16 h-16 text-destructive/50" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this area.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Platform management & oversight</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-8 p-1 bg-muted/30 rounded-lg w-fit">
          {adminNavItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path) && item.path !== '/admin';
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Content */}
        <Outlet />
      </div>
    </Layout>
  );
}
