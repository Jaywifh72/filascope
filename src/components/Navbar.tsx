import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Shield, Archive, Database, Settings, ChevronDown, Scissors, Box, FolderGit2, Youtube, Puzzle, User, GitCompareArrows, Menu, X, MoreHorizontal, BookOpen, Wrench, Globe, SlidersHorizontal, AlertCircle, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import filascopeLogo from "@/assets/logo-filascope.jpg";
import { CurrencySelector } from "@/components/CurrencySelector";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { TrendingPanel } from "@/components/TrendingPanel";
import { useTrendingPanel } from "@/hooks/useTrendingPanel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
const Navbar = () => {
  const {
    user,
    isAdmin
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Trending panel state
  const trendingPanel = useTrendingPanel();

  // Check if Learn dropdown should be active
  const isLearnActive = ['/accessories', '/reference', '/learn', '/compare', '/guides', '/resources/profiles'].some(path => location.pathname.startsWith(path));

  // Check active nav link
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);
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

  // Lab-style nav link component with keyboard accessibility
  const LabNavLink = ({
    to,
    children,
    end = false,
    onClick
  }: {
    to: string;
    children: React.ReactNode;
    end?: boolean;
    onClick?: () => void;
  }) => {
    const active = end ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        onClick={onClick} 
        className={cn(
          "relative py-3 px-3 transition-colors duration-200",
          "text-xs font-bold uppercase tracking-widest",
          "hover:text-white",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded",
          active ? "text-primary" : "text-gray-400"
        )}
      >
        {children}
        <span 
          className={cn(
            "absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-primary transition-all duration-300",
            active ? "w-full" : "w-0"
          )} 
        />
      </Link>
    );
  };

  // Mobile nav link component with keyboard accessibility
  const MobileNavLink = ({
    to,
    children,
    icon: Icon,
    end = false
  }: {
    to: string;
    children: React.ReactNode;
    icon?: React.ComponentType<{
      className?: string;
    }>;
    end?: boolean;
  }) => {
    const active = end ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        onClick={() => setMobileMenuOpen(false)} 
        className={cn(
          "flex items-center gap-3 px-4 py-3 transition-colors duration-200",
          "text-sm font-medium",
          "hover:bg-gray-800/50",
          "focus-visible:outline-none focus-visible:bg-gray-800/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
          active ? "text-primary bg-primary/10" : "text-gray-300"
        )}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </Link>
    );
  };

  // Learn menu sections for mega-menu
  const learnMenuSections = [
    {
      title: 'Guides & References',
      icon: BookOpen,
      items: [
        { to: '/compare', label: 'Material Encyclopedia', icon: BookOpen },
        { to: '/guides/print-settings', label: 'Print Settings Guide', icon: SlidersHorizontal },
        { to: '/guides/troubleshooting', label: 'Troubleshooting', icon: AlertCircle },
      ]
    },
    {
      title: 'Tools & Software',
      icon: Wrench,
      items: [
        { to: '/reference/slicers', label: 'Slicer Directory', icon: Scissors },
        { to: '/reference/cad', label: '3D Modeling Software', icon: Box },
        { to: '/resources/profiles', label: 'Print Profiles', icon: FileText },
      ]
    },
    {
      title: 'Community',
      icon: Globe,
      items: [
        { to: '/reference/repos', label: 'Model Repositories', icon: FolderGit2 },
        { to: '/reference/influencers', label: 'Creator Spotlights', icon: Youtube },
        { to: '/accessories', label: 'Accessories & Upgrades', icon: Puzzle },
      ]
    }
  ];

  // Flattened items for tablet/mobile "More" dropdown
  const learnItemsFlat = learnMenuSections.flatMap(section => section.items);
  return <>
      <nav className="sticky top-0 z-50 bg-gray-950 shadow-lg">
        {/* Bottom border for depth */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <div className="py-4 flex items-center px-4 md:px-6 gap-4 md:gap-6">
          {/* Mobile hamburger button with keyboard support */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && mobileMenuOpen) {
                setMobileMenuOpen(false);
              }
            }}
            className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo - Only icon and wordmark */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={filascopeLogo} alt="FilaScope" className="h-8 md:h-9 w-auto object-contain" />
            
          </Link>

          {/* Desktop Navigation Links (lg and up) */}
          <nav className="hidden lg:flex items-center flex-1 justify-center gap-6">
            <LabNavLink to="/" end>Filaments</LabNavLink>
            <LabNavLink to="/printers">Printers</LabNavLink>
            <LabNavLink to="/brands">Brands</LabNavLink>
            <LabNavLink to="/deals">Deals</LabNavLink>
            
            {/* Learn Dropdown - Mega Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn("relative flex items-center gap-1.5 py-3 px-3 transition-colors duration-200", "text-xs font-bold uppercase tracking-widest", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", "hover:text-white", isLearnActive ? 'text-primary' : 'text-gray-400')}>
                  Learn
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="bg-[hsl(220,15%,7%)] backdrop-blur-xl border-border min-w-[400px] p-4">
                {learnMenuSections.map((section, sectionIndex) => (
                  <div key={section.title}>
                    {/* Section Header */}
                    <div className="flex items-center gap-2 px-2 py-2">
                      <section.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {section.title}
                      </span>
                    </div>
                    
                    {/* Section Items */}
                    {section.items.map(item => (
                      <DropdownMenuItem key={item.to} asChild className="rounded-lg">
                        <Link to={item.to} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium">
                          <item.icon className="w-4 h-4 text-muted-foreground" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    
                    {/* Divider between sections */}
                    {sectionIndex < learnMenuSections.length - 1 && (
                      <div className="border-t border-border/30 my-2" />
                    )}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Visual separator */}
            <div className="h-5 w-px bg-border/50 mx-2" />

            {/* Compare Button - Ghost with teal border */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button onClick={() => navigate('/compare')} className={cn("border border-teal-500 bg-transparent hover:bg-teal-500/10", "rounded-lg px-4 py-2", "text-xs font-bold uppercase tracking-widest", "flex items-center gap-2", "transition-all duration-200", isActive('/compare') ? "bg-teal-500/10 text-teal-400" : "text-teal-400")}>
                  <GitCompareArrows className="w-3.5 h-3.5" />
                  Compare
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-900 border-border text-sm">
                Compare materials side-by-side
              </TooltipContent>
            </Tooltip>
          </nav>

          {/* Tablet Navigation (md to lg) */}
          <nav className="hidden md:flex lg:hidden items-center flex-1 justify-center gap-4">
            <LabNavLink to="/" end>Filaments</LabNavLink>
            <LabNavLink to="/printers">Printers</LabNavLink>
            <LabNavLink to="/brands">Brands</LabNavLink>
            <LabNavLink to="/deals">Deals</LabNavLink>
            
            {/* More Dropdown (Learn collapsed) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn("relative flex items-center gap-1.5 py-3 px-3 transition-colors duration-200", "text-xs font-bold uppercase tracking-widest", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", "hover:text-white", isLearnActive ? 'text-primary' : 'text-gray-400')}>
                  <MoreHorizontal className="w-4 h-4" />
                  More
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="bg-[hsl(220,15%,7%)] backdrop-blur-xl border-border min-w-[220px] p-2">
                {learnItemsFlat.map(item => <DropdownMenuItem key={item.to} asChild className="rounded-lg">
                    <Link to={item.to} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Compare Button - Tablet */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button onClick={() => navigate('/compare')} className={cn("border border-teal-500 bg-transparent hover:bg-teal-500/10", "rounded-lg px-3 py-1.5", "text-xs font-bold uppercase tracking-widest", "flex items-center gap-2", "transition-all duration-200", isActive('/compare') ? "bg-teal-500/10 text-teal-400" : "text-teal-400")}>
                  <GitCompareArrows className="w-3.5 h-3.5" />
                  Compare
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-900 border-border text-sm">
                Compare materials side-by-side
              </TooltipContent>
            </Tooltip>
          </nav>

          {/* Right-side utilities */}
          <div className="hidden md:block h-6 w-px bg-gray-700" />
          <div className="flex items-center gap-4 shrink-0 ml-auto">
            <WishlistButton />
            <CurrencySelector />
            
            {/* User Avatar / Login */}
            {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
                    <Avatar className="w-9 h-9 border border-gray-700 hover:border-teal-500/50 transition-colors cursor-pointer">
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback className="text-sm font-medium bg-gray-800 text-white">
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
                  {isAdmin && <>
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
                    </>}
                  <DropdownMenuItem onClick={handleSignOut} className="text-sm">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <button onClick={() => navigate('/auth')} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
                <Avatar className="w-9 h-9 border border-gray-700 hover:border-teal-500/50 transition-colors cursor-pointer">
                  <AvatarFallback className="bg-gray-800">
                    <User className="w-4 h-4 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
              </button>}
          </div>
        </div>

        {/* Mobile Menu - Slide down animation */}
        <div className={cn("md:hidden overflow-hidden transition-all duration-300 ease-out", mobileMenuOpen ? "max-h-[calc(100vh-4rem)] opacity-100" : "max-h-0 opacity-0")} style={{
        background: 'hsla(220, 20%, 4%, 0.98)'
      }}>
          <div className="py-4 border-t border-border/30">
            {/* Compare Button - Prominent at top */}
            <div className="px-4 pb-4">
              <button onClick={() => {
              navigate('/compare');
              setMobileMenuOpen(false);
            }} className={cn("w-full border border-teal-500 bg-transparent hover:bg-teal-500/10", "rounded-lg px-4 py-3", "text-sm font-bold uppercase tracking-widest", "flex items-center justify-center gap-2", "transition-all duration-200", "text-teal-400")}>
                <GitCompareArrows className="w-4 h-4" />
                Compare Filaments
              </button>
            </div>

            <div className="border-t border-border/30" />

            {/* Main nav links */}
            <MobileNavLink to="/" end>Filaments</MobileNavLink>
            <MobileNavLink to="/printers">Printers</MobileNavLink>
            <MobileNavLink to="/brands">Brands</MobileNavLink>
            <MobileNavLink to="/deals">Deals</MobileNavLink>

            <div className="border-t border-border/30 my-2" />

            {/* Learn Sections */}
            {learnMenuSections.map((section, sectionIndex) => (
              <div key={section.title}>
                <div className="px-4 py-2 flex items-center gap-2">
                  <section.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    {section.title}
                  </span>
                </div>
                {section.items.map(item => (
                  <MobileNavLink key={item.to} to={item.to} icon={item.icon}>
                    {item.label}
                  </MobileNavLink>
                ))}
                {sectionIndex < learnMenuSections.length - 1 && (
                  <div className="border-t border-border/30 my-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Trending Panel */}
      <TrendingPanel isOpen={trendingPanel.isOpen} onClose={trendingPanel.closePanel} selectedTab={trendingPanel.selectedTab} onTabChange={trendingPanel.setSelectedTab} activeTrends={trendingPanel.activeTrends} predictions={trendingPanel.predictions} isLoading={trendingPanel.isLoading} error={trendingPanel.error} viewedTrendIds={trendingPanel.viewedTrendIds} />
    </>;
};
export default Navbar;