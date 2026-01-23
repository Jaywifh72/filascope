import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, LogOut, Shield, Archive, Database, Settings, ChevronDown, Scissors, Box, FolderGit2, Youtube, Sparkles, Puzzle, Wand2, FlaskConical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import filascopeLogo from "@/assets/logo-filascope.jpg";
import { CurrencySelector } from "@/components/CurrencySelector";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { TrendingTriggerButton } from "@/components/TrendingTriggerButton";
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
  const [isScrolled, setIsScrolled] = useState(false);

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
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
  const getDisplayLabel = () => {
    if (displayName) {
      return displayName;
    }
    return user?.email?.split("@")[0] || 'User';
  };

  // Lab-style nav link component - Uppercase with tracking-widest
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
    return <Link to={to} className={cn("relative py-3 px-4 transition-colors duration-200", "text-xs font-bold uppercase tracking-widest", "hover:text-[#00CFE8]", active ? "text-[#00CFE8]" : "text-foreground/80")}>
        {children}
        {/* Underline indicator */}
        <span className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-[#00CFE8] transition-all duration-300", active ? "w-full" : "w-0 group-hover:w-full")} />
      </Link>;
  };
  return <>
      <nav className="sticky top-0 z-50 transition-all duration-300" style={{
      background: 'hsla(220, 20%, 4%, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid hsla(220, 15%, 18%, 0.5)'
    }}>
        <div className={`flex items-center px-6 gap-6 transition-all duration-300 ${isScrolled ? "h-16 md:h-18" : "h-18 md:h-20"}`}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={filascopeLogo} alt="FilaScope" className={`w-auto object-contain transition-all duration-300 ${isScrolled ? "h-10 md:h-12" : "h-12 md:h-16"}`} />
            
          </Link>

          {/* Navigation Links - Lab Style */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            <LabNavLink to="/" end>Materials</LabNavLink>
            <LabNavLink to="/printers">Printers</LabNavLink>
            <LabNavLink to="/brands">Brands</LabNavLink>
            <LabNavLink to="/compare">Compare</LabNavLink>
            
            {/* Resources Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn("relative flex items-center gap-1.5 py-3 px-4 transition-colors duration-200 group", "text-xs font-bold uppercase tracking-widest", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", "hover:text-[#00CFE8]", isResourcesActive ? 'text-[#00CFE8]' : 'text-foreground/80')}>
                  Resources
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="bg-[hsl(220,15%,7%)] backdrop-blur-xl border-[hsl(220,15%,18%)] min-w-[220px] p-2" style={{
              backdropFilter: 'blur(20px)'
            }}>
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
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <WishlistButton />
            <CurrencySelector />
            {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-border bg-card font-mono text-xs gap-2 pl-1.5 pr-3">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback className="text-[10px] bg-muted">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{getDisplayLabel()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback className="text-sm bg-muted">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      {displayName && <span className="text-sm font-medium">{displayName}</span>}
                      <span className="text-xs text-muted-foreground font-mono">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild>
                    <Link to="/vault" className="flex items-center font-mono text-xs">
                      <Archive className="w-3 h-3 mr-2" />
                      MY VAULT
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center font-mono text-xs">
                      <Settings className="w-3 h-3 mr-2" />
                      SETTINGS
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  {isAdmin && <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard" className="flex items-center font-mono text-xs">
                          <Shield className="w-3 h-3 mr-2" />
                          ADMIN
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/admin/maintenance" className="flex items-center font-mono text-xs">
                          <Database className="w-3 h-3 mr-2" />
                          MAINTENANCE
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                    </>}
                  <DropdownMenuItem onClick={handleSignOut} className="font-mono text-xs">
                    <LogOut className="w-3 h-3 mr-2" />
                    SIGN OUT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : null}
          </div>
        </div>
      </nav>
      
      {/* Trending Panel */}
      <TrendingPanel isOpen={trendingPanel.isOpen} onClose={trendingPanel.closePanel} selectedTab={trendingPanel.selectedTab} onTabChange={trendingPanel.setSelectedTab} activeTrends={trendingPanel.activeTrends} predictions={trendingPanel.predictions} isLoading={trendingPanel.isLoading} error={trendingPanel.error} viewedTrendIds={trendingPanel.viewedTrendIds} />
    </>;
};
export default Navbar;