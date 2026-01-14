import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, Home, Search, User, Building2, Menu, X, LogOut, Library, LayoutDashboard, Upload, Settings, Crown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/browse", label: "Browse", icon: Search },
  { href: "/artists", label: "Artists", icon: User },
  { href: "/labels", label: "Labels", icon: Building2 },
  { href: "/collection", label: "Collection", icon: Library, authRequired: true },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, signOut, isLoading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (role === "artist") return "/artist/dashboard";
    if (role === "label") return "/label/dashboard";
    return "/collection";
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center neon-glow-subtle group-hover:neon-glow transition-all duration-300">
                <Music className="w-6 h-6 text-foreground" />
              </div>
              <span className="text-xl font-bold text-gradient">JumTunes</span>
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
                      <Link to={getDashboardLink()} className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="w-4 h-4" />
                        {role === "fan" ? "My Collection" : "Dashboard"}
                      </Link>
                    </DropdownMenuItem>
                    {(role === "artist" || role === "label") && (
                      <DropdownMenuItem asChild>
                        <Link to="/upload" className="flex items-center gap-2 cursor-pointer">
                          <Upload className="w-4 h-4" />
                          Upload Music
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/collection" className="flex items-center gap-2 cursor-pointer">
                        <Library className="w-4 h-4" />
                        Collection
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/subscription" className="flex items-center gap-2 cursor-pointer">
                        <Crown className="w-4 h-4" />
                        Subscription
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setIsProfileOpen(true)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden py-4">
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
                    <div className="flex items-center gap-3 px-4 py-3 border-t border-glass-border mt-2 pt-4">
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
                    </div>
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      {role === "fan" ? "My Collection" : "Dashboard"}
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
                      to="/subscription"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                    >
                      <Crown className="w-5 h-5" />
                      Subscription
                    </Link>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setIsProfileOpen(true);
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg w-full text-left"
                    >
                      <Settings className="w-5 h-5" />
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
    </>
  );
}
