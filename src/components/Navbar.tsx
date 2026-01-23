import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Shield, Archive, Database, Settings, ChevronDown, Scissors, Box, FolderGit2, Youtube, Sparkles, Puzzle, Wand2, User, GitCompareArrows } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import filascopeLogo from "@/assets/logo-filascope.jpg";
import { CurrencySelector } from "@/components/CurrencySelector";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { TrendingPanel } from "@/components/TrendingPanel";
import { useTrendingPanel } from "@/hooks/useTrendingPanel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const {
    user,
    isAdmin
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Trending panel state
  const trendingPanel = useTrendingPanel();

  // Check if Resources dropdown should be active
  const isResourcesActive = ['/accessories', '/reference', '/wizard'].some(path => location.pathname.startsWith(path));

  // Check active nav link
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      setDisplayName(null);
      return;
    }
    const loadProfile = async () => {
      const {
        data
      } = await supabase.from("profiles").select("avatar_url, display_name").eq("id", user.id).single();
      if (data) {
        setAvatarUrl(data.avatar_url);
        setDisplayName(data.display_name);
      }
    };
    loadProfile();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Lab-style nav link component
  const LabNavLink = ({
    to,
    children,
    end = false
  }: {
    to: string;
    children: React.ReactNode;
    end?: boolean;
  }) => {
    const active = end ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        className={cn(
          "relative py-3 px-3 transition-colors duration-200",
          "text-xs font-bold uppercase tracking-widest",
          "hover:text-white",
          active ? "text-primary" : "text-gray-400"
        )}
      >
        {children}
        <span className={cn(
          "absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-primary transition-all duration-300",
          active ? "w-full" : "w-0"
        )} />
      </Link>
    );
  };

  return (
    <>
      <nav 
        className="sticky top-0 z-50 transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        style={{
          background: 'hsla(220, 20%, 4%, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Bottom border for depth */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        />
        
        <div className="h-16 flex items-center px-6 gap-6">
          {/* Logo - Only icon and wordmark */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img 
              src={filascopeLogo} 
              alt="FilaScope" 
              className="h-9 w-auto object-contain"
            />
            <span className="text-base font-bold tracking-widest text-foreground">
              FILASCOPE
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center flex-1 justify-center gap-6">
            <LabNavLink to="/" end>Materials</LabNavLink>
            <LabNavLink to="/printers">Printers</LabNavLink>
            <LabNavLink to="/brands">Brands</LabNavLink>
            
            {/* Resources Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={cn(
                    "relative flex items-center gap-1.5 py-3 px-3 transition-colors duration-200",
                    "text-xs font-bold uppercase tracking-widest",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    "hover:text-white",
                    isResourcesActive ? 'text-primary' : 'text-gray-400'
                  )}
                >
                  Resources
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                className="bg-[hsl(220,15%,7%)] backdrop-blur-xl border-border min-w-[220px] p-2"
              >
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link to="/accessories" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium">
                    <Puzzle className="w-4 h-4 text-muted-foreground" />
                    Accessories
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2 bg-border/50" />
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link to="/reference/slicers" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium">
                    <Scissors className="w-4 h-4 text-muted-foreground" />
                    Slicers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link to="/reference/cad" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium">
                    <Box className="w-4 h-4 text-muted-foreground" />
                    3D Modeling / CAD
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link to="/reference/repos" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium">
                    <FolderGit2 className="w-4 h-4 text-muted-foreground" />
                    3D Print Repos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link to="/reference/influencers" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium">
                    <Youtube className="w-4 h-4 text-muted-foreground" />
                    YouTube Influencers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link to="/reference/specialty" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    Specialty Tools
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2 bg-border/50" />
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link to="/wizard" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium">
                    <Wand2 className="w-4 h-4 text-muted-foreground" />
                    Material Wizard
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Visual separator */}
            <div className="h-5 w-px bg-border/50 mx-2" />

            {/* Compare Button - Ghost with teal border */}
            <button
              onClick={() => navigate('/compare')}
              className={cn(
                "border border-primary bg-transparent hover:bg-primary/10",
                "rounded-lg px-4 py-2",
                "text-xs font-bold uppercase tracking-widest",
                "flex items-center gap-2",
                "transition-all duration-200",
                isActive('/compare') ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-white"
              )}
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
              Compare
            </button>
          </nav>

          {/* Right-side utilities */}
          <div className="flex items-center gap-4 shrink-0">
            <WishlistButton />
            <CurrencySelector />
            
            {/* User Avatar / Login */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
                    <Avatar className="w-8 h-8 border border-gray-700 hover:border-primary/50 transition-colors cursor-pointer">
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback className="text-xs font-medium bg-gray-800 text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border min-w-[200px]">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback className="text-sm bg-muted">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      {displayName && <span className="text-sm font-medium">{displayName}</span>}
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild>
                    <Link to="/vault" className="flex items-center text-sm">
                      <Archive className="w-4 h-4 mr-2" />
                      My Vault
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center text-sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard" className="flex items-center text-sm">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/maintenance" className="flex items-center text-sm">
                          <Database className="w-4 h-4 mr-2" />
                          Maintenance
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} className="text-sm">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button 
                onClick={() => navigate('/auth')}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
              >
                <Avatar className="w-8 h-8 border border-gray-700 hover:border-primary/50 transition-colors cursor-pointer">
                  <AvatarFallback className="bg-gray-800">
                    <User className="w-4 h-4 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
              </button>
            )}
          </div>
        </div>
      </nav>
      
      {/* Trending Panel */}
      <TrendingPanel 
        isOpen={trendingPanel.isOpen} 
        onClose={trendingPanel.closePanel} 
        selectedTab={trendingPanel.selectedTab} 
        onTabChange={trendingPanel.setSelectedTab} 
        activeTrends={trendingPanel.activeTrends} 
        predictions={trendingPanel.predictions} 
        isLoading={trendingPanel.isLoading} 
        error={trendingPanel.error} 
        viewedTrendIds={trendingPanel.viewedTrendIds} 
      />
    </>
  );
};

export default Navbar;