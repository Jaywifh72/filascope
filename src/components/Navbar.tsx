import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, LogOut, Shield, Archive, Database, Settings, BookOpen, ChevronDown, Scissors, Box, FolderGit2, Youtube, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import filascopeLogo from "@/assets/filascope-logo.png";
import { CurrencySelector } from "@/components/CurrencySelector";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { TrendingTriggerButton } from "@/components/TrendingTriggerButton";
import { TrendingPanel } from "@/components/TrendingPanel";
import { useTrendingPanel } from "@/hooks/useTrendingPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Trending panel state
  const trendingPanel = useTrendingPanel();

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
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("id", user.id)
        .single();

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

  return (
    <>
      <nav 
        className={`sticky top-0 z-50 border-b border-[#333] transition-all duration-300 ${
          isScrolled 
            ? "bg-[#0A0A0A]/98 backdrop-blur-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
            : "bg-[#0A0A0A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0A]/80"
        }`}
      >
        <div className={`flex items-center px-6 gap-4 transition-all duration-300 ${
          isScrolled ? "h-16 md:h-20" : "h-20 md:h-24"
        }`}>
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img 
              src={filascopeLogo} 
              alt="FilaScope" 
              className={`w-auto object-contain transition-all duration-300 ${
                isScrolled ? "h-12 md:h-16" : "h-16 md:h-24"
              }`}
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 flex-1">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary font-mono text-xs">
              <Link to="/printers">PRINTERS</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary font-mono text-xs">
              <Link to="/accessories">ACCESSORIES</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary font-mono text-xs">
              <Link to="/brands">BRANDS</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary font-mono text-xs">
              <Link to="/compare">COMPARE</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-cyan-400 hover:text-cyan-300 font-mono text-xs">
              <Link to="/materials/compare">MATERIALS</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 font-mono text-xs gap-1">
                  <BookOpen className="w-3 h-3" />
                  REFERENCE
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#1A1A1A] border-[#333] min-w-[180px]">
                <DropdownMenuItem asChild>
                  <Link to="/reference/slicers" className="flex items-center font-mono text-xs">
                    <Scissors className="w-3 h-3 mr-2" />
                    SLICERS
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/reference/cad" className="flex items-center font-mono text-xs">
                    <Box className="w-3 h-3 mr-2" />
                    3D MODELING / CAD
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/reference/repos" className="flex items-center font-mono text-xs">
                    <FolderGit2 className="w-3 h-3 mr-2" />
                    3D PRINT REPOS
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/reference/influencers" className="flex items-center font-mono text-xs">
                    <Youtube className="w-3 h-3 mr-2" />
                    YOUTUBE INFLUENCERS
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/reference/specialty" className="flex items-center font-mono text-xs">
                    <Sparkles className="w-3 h-3 mr-2" />
                    SPECIALTY
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" asChild className="text-purple-400 hover:text-purple-300 font-mono text-xs">
              <Link to="/wizard">WIZARD</Link>
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild className="text-amber-400 hover:text-amber-300 font-mono text-xs">
                <Link to="/admin/dashboard">ADMIN</Link>
              </Button>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <TrendingTriggerButton
              onClick={trendingPanel.openPanel}
              newTrendCount={trendingPanel.newTrendCount}
              isOpen={trendingPanel.isOpen}
            />
            <WishlistButton />
            <CurrencySelector />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-[#333] bg-[#1A1A1A] font-mono text-xs gap-2 pl-1.5 pr-3">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback className="text-[10px] bg-muted">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{getDisplayLabel()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-[#333]">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback className="text-sm bg-muted">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      {displayName && (
                        <span className="text-sm font-medium">{displayName}</span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-[#333]" />
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
                  <DropdownMenuSeparator className="bg-[#333]" />
                  {isAdmin && (
                    <>
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
                      <DropdownMenuSeparator className="bg-[#333]" />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} className="font-mono text-xs">
                    <LogOut className="w-3 h-3 mr-2" />
                    SIGN OUT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" asChild className="border-[#333] bg-[#1A1A1A] font-mono text-xs">
                <Link to="/auth">
                  <LogIn className="w-3 h-3 mr-1.5" />
                  LOGIN
                </Link>
              </Button>
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