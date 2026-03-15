import { useEffect } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, Music, DollarSign, Shield, LayoutDashboard, Flag, BarChart3, Star, Home, Store, Zap, CreditCard, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { path: '/admin/home', label: 'Home', icon: Home },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/tracks', label: 'Tracks', icon: Music },
  { path: '/admin/featured', label: 'Featured', icon: Star },
  { path: '/admin/stores', label: 'Stores', icon: Store },
  { path: '/admin/credits', label: 'AI Credits', icon: Zap },
  { path: '/admin/subscriptions', label: 'Subs', icon: CreditCard },
  { path: '/admin/finance', label: 'Finance', icon: DollarSign },
  { path: '/admin/reports', label: 'Reports', icon: Flag },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/qa-lab', label: 'QA Lab', icon: FlaskConical },
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
      <div className="container mx-auto px-3 sm:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate">Admin Dashboard</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Platform management & oversight</p>
          </div>
        </div>

        {/* Navigation Tabs - Responsive */}
        <div className="mb-6 md:mb-8">
          {/* Mobile: Grid layout */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 md:hidden">
            {adminNavItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path) && item.path !== '/admin';
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-colors",
                    isActive
                      ? "glass-card-bordered border-primary/30 text-primary"
                      : "glass-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="truncate max-w-full">{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Desktop: Horizontal tabs */}
          <div className="hidden md:flex gap-1 p-1 glass-card-bordered w-fit">
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
                      ? "bg-primary/20 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <Outlet />
      </div>
    </Layout>
  );
}
