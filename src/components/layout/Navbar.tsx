import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, Home, Search, User, Building2, Menu, X, LogOut, Library, LayoutDashboard, Upload, Settings, Crown, Bell, Check, ArrowUp, ArrowDown, Sparkles, Wallet, Heart, AlertTriangle, UserPlus, DollarSign, Mic2, Shield, Store } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { CreditBalanceChip } from "@/components/wallet/CreditBalanceChip";
import { SubscriptionCountdownChip } from "@/components/subscription/SubscriptionCountdownChip";
import { QuickTopupModal } from "@/components/wallet/QuickTopupModal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { formatDistanceToNow } from "date-fns";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/browse", label: "Browse", icon: Search },
  { href: "/for-you", label: "For You", icon: Sparkles, authRequired: true },
  { href: "/karaoke", label: "Sing-Along", icon: Mic2 },
  { href: "/artists", label: "Artists", icon: User },
  { href: "/labels", label: "Labels", icon: Building2 },
  { href: "/library", label: "Library", icon: Library, authRequired: true },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [isMobileNotificationsOpen, setIsMobileNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, signOut, isLoading } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { isAdmin } = useAdminAccess();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (role === "artist") return "/artist/dashboard";
    if (role === "label") return "/label/dashboard";
    return "/fan/dashboard";
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getNotificationIcon = (notification: { type: string; metadata?: Record<string, unknown> }) => {
    switch (notification.type) {
      case "role_change": {
        const changeType = notification.metadata?.change_type;
        if (changeType === "upgrade") return <ArrowUp className="w-4 h-4 text-green-500" />;
        if (changeType === "downgrade") return <ArrowDown className="w-4 h-4 text-orange-500" />;
        return <Sparkles className="w-4 h-4 text-primary" />;
      }
      case "subscription_canceled":
        return <Crown className="w-4 h-4 text-destructive" />;
      case "credit_purchase":
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case "track_purchase":
        return <Music className="w-4 h-4 text-primary" />;
      case "track_sale":
        return <Sparkles className="w-4 h-4 text-green-500" />;
      case "new_follower":
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case "track_liked":
        return <Heart className="w-4 h-4 text-pink-500" />;
      case "low_balance":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      <nav 
        className="fixed top-0 left-0 right-0 z-50 glass"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img 
                src="/images/jumtunes-logo-test.png" 
                alt="JumTunes" 
                className="h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                // Skip auth-required links for non-authenticated users
                if (link.authRequired && !user) return null;
                
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary/20 text-primary neon-glow-subtle"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Auth Buttons / User Menu */}
            <div className="hidden md:flex items-center gap-3">
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <>
                  {/* Subscription Countdown Chip */}
                  <SubscriptionCountdownChip />

                  {/* Credit Balance Chip */}
                  <CreditBalanceChip onClick={() => setShowTopupModal(true)} />

                  {/* Notifications Bell */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                          >
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 glass" align="end">
                      <div className="flex items-center justify-between p-2 border-b border-border">
                        <span className="font-semibold text-foreground">Notifications</span>
                        {unreadCount > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => markAllAsRead()}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark all read
                          </Button>
                        )}
                      </div>
                      <ScrollArea className="h-[300px]">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={cn(
                                "p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors",
                                !notification.read && "bg-primary/5"
                              )}
                              onClick={() => {
                                if (!notification.read) markAsRead(notification.id);
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {getNotificationIcon(notification)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-sm",
                                    !notification.read ? "font-medium text-foreground" : "text-muted-foreground"
                                  )}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground/60 mt-1">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </ScrollArea>
                      <div className="p-2 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-primary"
                          asChild
                        >
                          <Link to="/notifications">
                            View All Notifications
                          </Link>
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10 border-2 border-primary/50">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 glass" align="end">
                      <div className="flex items-center gap-2 p-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {profile?.display_name || "User"}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {role || "Fan"}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={`/profile/${user.id}`} className="flex items-center gap-2 cursor-pointer">
                          <User className="w-4 h-4" />
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={getDashboardLink()} className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="w-4 h-4" />
                          {role === "fan" ? "My Dashboard" : "Dashboard"}
                        </Link>
                      </DropdownMenuItem>
                      {(role === "artist" || role === "label") && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/upload" className="flex items-center gap-2 cursor-pointer">
                              <Upload className="w-4 h-4" />
                              Upload Music
                            </Link>
                          </DropdownMenuItem>
                          {role === "artist" && (
                            <DropdownMenuItem asChild>
                              <Link to="/artist/store" className="flex items-center gap-2 cursor-pointer">
                                <Store className="w-4 h-4" />
                                My Store
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/library" className="flex items-center gap-2 cursor-pointer">
                          <Library className="w-4 h-4" />
                          Library
                        </Link>
                      </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                        <Link to="/wallet" className="flex items-center gap-2 cursor-pointer">
                          <Wallet className="w-4 h-4" />
                          Wallet
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/subscription" className="flex items-center gap-2 cursor-pointer">
                          <Crown className="w-4 h-4" />
                          Subscription
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-destructive">
                              <Shield className="w-4 h-4" />
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="w-4 h-4" />
                          Account Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleSignOut}
                        className="flex items-center gap-2 cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button className="gradient-accent neon-glow-subtle hover:neon-glow transition-all duration-300" asChild>
                    <Link to="/auth?mode=signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground touch-manipulation"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div 
              className="md:hidden py-4 overflow-y-auto overscroll-contain touch-pan-y"
              style={{ 
                maxHeight: 'calc(100vh - 4rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  // Skip auth-required links for non-authenticated users
                  if (link.authRequired && !user) return null;
                  
                  const Icon = link.icon;
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  );
                })}
                
                {user ? (
                  <>
                    <div className="flex flex-col gap-2 border-t border-glass-border mt-2 pt-4">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{profile?.display_name || "User"}</p>
                          <p className="text-sm text-muted-foreground capitalize">{role || "Fan"}</p>
                        </div>
                        {unreadCount > 0 && (
                          <Sheet open={isMobileNotificationsOpen} onOpenChange={setIsMobileNotificationsOpen}>
                            <SheetTrigger asChild>
                              <Badge variant="destructive" className="ml-auto cursor-pointer">
                                {unreadCount} new
                              </Badge>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-full sm:w-[400px] glass">
                              <SheetHeader>
                                <SheetTitle className="flex items-center justify-between">
                                  <span>Notifications</span>
                                  {unreadCount > 0 && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-xs"
                                      onClick={() => {
                                        markAllAsRead();
                                      }}
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      Mark all read
                                    </Button>
                                  )}
                                </SheetTitle>
                              </SheetHeader>
                              <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                                {notifications.length === 0 ? (
                                  <div className="p-4 text-center text-muted-foreground">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No notifications yet</p>
                                  </div>
                                ) : (
                                  notifications.map((notification) => (
                                    <div
                                      key={notification.id}
                                      className={cn(
                                        "p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors",
                                        !notification.read && "bg-primary/5"
                                      )}
                                      onClick={() => {
                                        if (!notification.read) markAsRead(notification.id);
                                      }}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="mt-0.5">
                                          {getNotificationIcon(notification)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={cn(
                                            "text-sm",
                                            !notification.read ? "font-medium text-foreground" : "text-muted-foreground"
                                          )}>
                                            {notification.title}
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                            {notification.message}
                                          </p>
                                          <p className="text-xs text-muted-foreground/60 mt-1">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                          </p>
                                        </div>
                                        {!notification.read && (
                                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </ScrollArea>
                            </SheetContent>
                          </Sheet>
                        )}
                      </div>
                      {/* Mobile Subscription Countdown */}
                      <div className="px-4">
                        <SubscriptionCountdownChip />
                      </div>
                    </div>
                    <Link
                      to={`/profile/${user.id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    >
                      <User className="w-5 h-5" />
                      My Profile
                    </Link>
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      {role === "fan" ? "My Dashboard" : "Dashboard"}
                    </Link>
                    {(role === "artist" || role === "label") && (
                      <Link
                        to="/upload"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                      >
                        <Upload className="w-5 h-5" />
                        Upload Music
                      </Link>
                    )}
                    <Link
                      to="/wallet"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    >
                      <Wallet className="w-5 h-5" />
                      Wallet
                    </Link>
                    <Link
                      to="/subscription"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    >
                      <Crown className="w-5 h-5" />
                      Subscription
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Shield className="w-5 h-5" />
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    >
                      <Settings className="w-5 h-5" />
                      Account Settings
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    >
                      <Bell className="w-5 h-5" />
                      Notifications
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Link>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setIsProfileOpen(true);
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg w-full text-left"
                    >
                      <User className="w-5 h-5" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-lg w-full text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-glass-border">
                    <Button variant="ghost" asChild className="justify-start">
                      <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
                    </Button>
                    <Button className="gradient-accent" asChild>
                      <Link to="/auth?mode=signup" onClick={() => setIsOpen(false)}>Get Started</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Profile Edit Modal */}
      <ProfileEditModal open={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <QuickTopupModal open={showTopupModal} onOpenChange={setShowTopupModal} />
    </>
  );
}
