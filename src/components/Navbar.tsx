import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Shield, Archive, Database, Settings, ChevronDown, Scissors, FolderGit2, User, GitCompareArrows, Menu, X, MoreHorizontal, BookOpen, Wrench, Search, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
// Logo served from storage at 224px (retina for 112px display) instead of bundling the 885KB source
const filascopeLogo = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/render/image/public/site-assets/logo-filascope.webp?width=224&resize=contain`;

import { RegionSelector } from "@/components/RegionSelector";
import { SearchCommandPalette } from "@/components/search/SearchCommandPalette";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { RecentlyViewedDropdown } from "@/components/RecentlyViewedDropdown";
import { TrendingPanel } from "@/components/TrendingPanel";
import { useTrendingPanel } from "@/hooks/useTrendingPanel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCompare } from "@/hooks/useCompare";
import { preloadRoute } from "@/lib/preloadRoutes";
import { useDealsCount } from "@/hooks/useDealsCount";

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
  const [learnDropdownOpen, setLearnDropdownOpen] = useState(false);
  const learnHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const [hasScrolled, setHasScrolled] = useState(false);
   const [isCompact, setIsCompact] = useState(false);
   const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);

   // Detect scroll for sticky nav border, compaction, + nav search visibility
   useEffect(() => {
     let lastScrollY = window.scrollY;
     let ticking = false;
     const handleScroll = () => {
       const scrollY = window.scrollY;
    setHasScrolled(scrollY > 20);
        setIsCompact(scrollY > 100);
       // showNavSearch removed — using command palette now
       lastScrollY = scrollY;
     };
     const onScroll = () => {
       if (!ticking) {
         requestAnimationFrame(() => { handleScroll(); ticking = false; });
         ticking = true;
       }
     };
     window.addEventListener("scroll", onScroll, { passive: true });
     return () => window.removeEventListener("scroll", onScroll);
   }, []);

  // Cmd+K / "/" shortcut to open search palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchPaletteOpen(true);
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compare tray state
  const { items: compareItems, maxItems: compareMax } = useCompare();
  const compareCount = compareItems.length;
  const prevCountRef = useRef(compareCount);
  const [isCountAnimating, setIsCountAnimating] = useState(false);
  const [isBorderFlashing, setIsBorderFlashing] = useState(false);
  const isFull = compareCount >= (compareMax || 6);

  // Animate badge + border when count increases
  useEffect(() => {
    if (compareCount !== prevCountRef.current) {
      setIsCountAnimating(true);
      if (compareCount > prevCountRef.current) {
        setIsBorderFlashing(true);
        setTimeout(() => setIsBorderFlashing(false), 600);
      }
      const timeout = setTimeout(() => setIsCountAnimating(false), 300);
      prevCountRef.current = compareCount;
      return () => clearTimeout(timeout);
    }
    prevCountRef.current = compareCount;
  }, [compareCount]);

  // Cmd+Shift+C to open compare
  useEffect(() => {
    const handleCompareShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        if (compareCount > 0) navigate("/compare");
      }
    };
    document.addEventListener("keydown", handleCompareShortcut);
    return () => document.removeEventListener("keydown", handleCompareShortcut);
  }, [compareCount, navigate]);

  // Trending panel state
  const trendingPanel = useTrendingPanel();

  // Deals count for badge
  const { data: dealsData, isLoading: dealsLoading } = useDealsCount();

  // Check if Learn dropdown should be active
  const isLearnActive = ['/accessories', '/reference', '/learn', '/guides', '/resources/profiles'].some(path => location.pathname.startsWith(path));

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

  // Lab-style nav link component with keyboard accessibility, enhanced active states, and route preloading
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
    
    // Preload route on mouse enter for faster navigation
    const handleMouseEnter = () => {
      preloadRoute(to);
    };
    
    return (
      <Link 
        to={to} 
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onFocus={handleMouseEnter}
        className={cn(
          "group relative py-2 px-3 rounded-md",
          "text-xs font-bold uppercase tracking-widest",
          "transition-all duration-200",
          "hover:scale-105",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "active:scale-95 active:transition-transform active:duration-100",
          active 
            ? "text-primary font-extrabold bg-foreground/5 [text-shadow:0_0_20px_hsl(var(--primary)/0.3)]" 
            : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
        )}
      >
        {children}
        {/* Active underline */}
        <span 
          className={cn(
            "absolute bottom-0 left-1/2 -translate-x-1/2 bg-primary transition-all duration-300 rounded-full",
            active ? "w-[calc(100%-12px)] h-[2.5px]" : "w-0 h-[2px]"
          )} 
        />
        {/* Hover underline that slides from left */}
        {!active && (
          <span className="absolute bottom-0 left-[6px] h-[2px] w-0 bg-primary/40 transition-all duration-300 rounded-full group-hover:w-[calc(100%-12px)]" />
        )}
      </Link>
    );
  };

  // Mobile nav link component with keyboard accessibility, left border accent, and route preloading
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
    
    // Preload route when link receives focus
    const handleFocus = () => {
      preloadRoute(to);
    };
    
    return (
      <Link 
        to={to} 
        onClick={() => setMobileMenuOpen(false)}
        onFocus={handleFocus}
        className={cn(
          "flex items-center gap-3 px-4 py-3 transition-all duration-200 relative",
          "text-sm font-medium",
          "hover:bg-muted/50 active:bg-muted",
          "focus-visible:outline-none focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
          active 
            ? "text-primary font-semibold bg-primary/10 border-l-2 border-primary" 
            : "text-muted-foreground border-l-2 border-transparent"
        )}
      >
        {Icon && <Icon className={cn("w-4 h-4", active && "text-primary")} />}
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
        { to: '/reference/materials', label: 'Material Knowledge Base', icon: BookOpen },
      ]
    },
    {
      title: 'Tools & Software',
      icon: Wrench,
      items: [
        { to: '/reference/slicers', label: 'Slicer Directory', icon: Scissors },
        { to: '/hueforge-tools', label: 'HueForge Tools', icon: Database },
      ]
    },
    
  ];

  // Flattened items for tablet/mobile "More" dropdown
  const learnItemsFlat = learnMenuSections.flatMap(section => section.items);
  return <>
      <nav className={cn(
         "sticky top-0 z-50 transition-all duration-300 ease-out will-change-transform",
         hasScrolled
           ? "bg-background/95 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-border/40"
           : "bg-transparent border-b border-transparent shadow-none"
      )} aria-label="Main navigation">
        {/* Bottom border for depth */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <div className={cn(
          "flex items-center px-4 md:px-6 gap-4 md:gap-6 transition-[padding] duration-200 ease-out",
          isCompact ? "py-2.5" : "py-4"
        )}>
          {/* Mobile hamburger button with keyboard support */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && mobileMenuOpen) {
                setMobileMenuOpen(false);
              }
            }}
            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>

          {/* Logo - Only icon and wordmark */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded" aria-label="FilaScope home">
            <img
              src={filascopeLogo}
              alt="FilaScope"
              className={cn(
                "w-auto object-contain transition-all duration-200 ease-out",
                isCompact ? "h-6 md:h-7" : "h-8 md:h-9"
              )}
              style={{ maxWidth: '224px' }}
              width={224}
              height={72}
              sizes="112px"
              loading="eager"
              decoding="async"
              // @ts-ignore – fetchpriority valid HTML
              fetchpriority="high"
            />
          </Link>

          {/* Desktop Navigation Links (lg and up) */}
          <div role="navigation" aria-label="Desktop navigation" className="hidden lg:flex items-center flex-1 justify-center gap-6">
            <LabNavLink to="/" end>Filaments</LabNavLink>
            <LabNavLink to="/printers">Printers</LabNavLink>
            <LabNavLink to="/brands">Brands</LabNavLink>
            <LabNavLink to="/deals">
              Deals
              {dealsData && dealsData.totalVariants > 0 ? (
                <span className="inline-flex items-center justify-center ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary/20 text-primary border border-primary/30 group-hover:bg-primary/30 group-hover:scale-110 transition-all" aria-label={`${dealsData.totalVariants.toLocaleString()} active deals`}>
                  {dealsData.totalVariants.toLocaleString()}
                </span>
              ) : dealsLoading ? (
                <span className="w-8 h-4 rounded-full bg-white/10 animate-pulse ml-1.5 inline-block" />
              ) : null}
            </LabNavLink>
            
            {/* Learn Dropdown - Mega Menu with hover support on desktop */}
            <DropdownMenu 
              open={learnDropdownOpen} 
              onOpenChange={setLearnDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <button 
                  onMouseEnter={() => {
                    // Desktop hover with 150ms delay
                    if (window.matchMedia('(min-width: 1024px)').matches) {
                      learnHoverTimeoutRef.current = setTimeout(() => {
                        setLearnDropdownOpen(true);
                      }, 150);
                    }
                  }}
                  onMouseLeave={() => {
                    if (learnHoverTimeoutRef.current) {
                      clearTimeout(learnHoverTimeoutRef.current);
                    }
                  }}
                  className={cn(
                    "group relative flex items-center gap-1.5 py-2 px-3 transition-all duration-200 rounded-md",
                    "text-xs font-bold uppercase tracking-widest",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    "hover:text-foreground hover:bg-foreground/5",
                    isLearnActive ? 'text-primary bg-foreground/5' : 'text-muted-foreground'
                  )}
                >
                  Learn
                  <ChevronDown className={cn(
                    "w-3.5 h-3.5 transition-all duration-200",
                    learnDropdownOpen 
                      ? "rotate-180 text-primary" 
                      : "text-muted-foreground/60 group-hover:text-muted-foreground"
                  )} />
                  <span 
                    className={cn(
                      "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-primary transition-all duration-300 rounded-full",
                      isLearnActive ? "w-[calc(100%-12px)]" : "w-0"
                    )} 
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="center" 
                className="bg-popover backdrop-blur-xl border-border min-w-[400px] p-4"
                onMouseEnter={() => {
                  // Keep dropdown open when hovering over content
                  if (learnHoverTimeoutRef.current) {
                    clearTimeout(learnHoverTimeoutRef.current);
                  }
                }}
                onMouseLeave={() => {
                  // Close with slight delay when leaving content
                  learnHoverTimeoutRef.current = setTimeout(() => {
                    setLearnDropdownOpen(false);
                  }, 100);
                }}
              >
                {learnMenuSections.map((section, sectionIndex) => (
                  <div key={section.title}>
                    {/* Section Header */}
                    <div className="flex items-center gap-2 px-2 py-2">
                      <section.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
                        {section.title}
                      </span>
                    </div>
                    
                    {/* Section Items */}
                    {section.items.map(item => (
                      <DropdownMenuItem 
                        key={item.to} 
                        asChild 
                        className="rounded-lg"
                        onClick={() => setLearnDropdownOpen(false)}
                      >
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

            {/* Search trigger button — opens Cmd+K palette */}
            <button
              onClick={() => setSearchPaletteOpen(true)}
              className="flex items-center gap-1.5 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
              aria-label="Search (⌘K)"
            >
              <Search className="w-5 h-5" />
              <kbd className="hidden xl:inline-flex items-center px-1 py-0.5 text-[10px] font-mono text-muted-foreground/60 bg-muted/30 rounded">
                ⌘K
              </kbd>
            </button>

            {/* Compare Button - Desktop */}
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => compareCount > 0 ? navigate('/compare') : undefined} 
                  className={cn(
                    "relative border rounded-lg px-3.5 py-2",
                    "text-sm font-semibold tracking-wide",
                    "flex items-center gap-2",
                    "transition-all duration-200",
                    "motion-reduce:transition-none",
                    compareCount > 0
                      ? cn(
                          "border-primary/60 text-primary bg-primary/5 cursor-pointer",
                          "hover:bg-primary/10 hover:border-primary",
                          "shadow-[0_0_8px_hsl(var(--primary)/0.15)]",
                          isBorderFlashing && "animate-compare-ring-pulse",
                        )
                      : "border-border/30 text-muted-foreground/60 bg-transparent hover:border-border/50 hover:text-muted-foreground hover:bg-muted/20 cursor-default",
                    isFull && "border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
                    isActive('/compare') && compareCount > 0 && "bg-primary/10 border-primary"
                  )}
                >
                  <GitCompareArrows className="w-4 h-4" />
                  {isFull ? "Compare Now" : "Compare"}
                  {isFull && <ArrowRight className="w-3.5 h-3.5" />}
                  {compareCount > 0 && (
                    <span 
                      className={cn(
                        "absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1",
                        "flex items-center justify-center",
                        "text-xs font-bold rounded-full",
                        "transition-all duration-200",
                        "motion-reduce:animate-none",
                        isFull
                          ? "bg-emerald-500 text-white"
                          : "bg-primary text-primary-foreground",
                        isCountAnimating && "animate-compare-badge-pop"
                      )}
                    >
                      {compareCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded-md shadow-md max-w-[200px] text-center">
                {compareCount === 0 
                  ? <span>Add filaments to compare<br/><kbd className="text-[10px] text-muted-foreground/60 font-mono">⌘⇧C</kbd></span>
                  : isFull
                    ? <span>Compare list full — click to compare now!<br/><kbd className="text-[10px] text-muted-foreground/60 font-mono">⌘⇧C</kbd></span>
                    : <span>Compare {compareCount} filament{compareCount !== 1 ? 's' : ''} — add up to {compareMax || 6}<br/><kbd className="text-[10px] text-muted-foreground/60 font-mono">⌘⇧C</kbd></span>
                }
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Tablet Navigation (md to lg) */}
          <div role="navigation" aria-label="Tablet navigation" className="hidden md:flex lg:hidden items-center flex-1 justify-center gap-4">
            <LabNavLink to="/" end>Filaments</LabNavLink>
            <LabNavLink to="/printers">Printers</LabNavLink>
            <LabNavLink to="/brands">Brands</LabNavLink>
            <LabNavLink to="/deals">
              Deals
              {dealsData && dealsData.totalVariants > 0 ? (
                <span className="inline-flex items-center justify-center ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary/20 text-primary border border-primary/30 group-hover:bg-primary/30 transition-colors" aria-label={`${dealsData.totalVariants.toLocaleString()} active deals`}>
                  {dealsData.totalVariants.toLocaleString()}
                </span>
              ) : dealsLoading ? (
                <span className="w-8 h-4 rounded-full bg-white/10 animate-pulse ml-1.5 inline-block" />
              ) : null}
            </LabNavLink>
            
            {/* More Dropdown (Learn collapsed) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={cn(
                    "group relative flex items-center gap-1.5 py-2 px-3 transition-all duration-200 rounded-md",
                    "text-xs font-bold uppercase tracking-widest",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    "hover:text-foreground hover:bg-foreground/5",
                    isLearnActive ? 'text-primary bg-foreground/5' : 'text-muted-foreground'
                  )}
                >
                  <MoreHorizontal className="w-4 h-4" />
                  More
                  <span 
                    className={cn(
                      "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-primary transition-all duration-300 rounded-full",
                      isLearnActive ? "w-[calc(100%-12px)]" : "w-0"
                    )} 
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="bg-popover backdrop-blur-xl border-border min-w-[220px] p-2">
                {learnItemsFlat.map(item => (
                  <DropdownMenuItem key={item.to} asChild className="rounded-lg">
                    <Link to={item.to} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Compare Button - Tablet */}
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => compareCount > 0 ? navigate('/compare') : undefined}
                  className={cn(
                    "relative border rounded-lg px-3 py-1.5",
                    "text-sm font-semibold",
                    "flex items-center gap-2",
                    "transition-all duration-200",
                    "motion-reduce:transition-none",
                    compareCount > 0
                      ? cn(
                          "border-primary/60 text-primary bg-primary/5 cursor-pointer",
                          "hover:bg-primary/10 hover:border-primary",
                          isBorderFlashing && "animate-compare-ring-pulse",
                        )
                      : "border-border/30 text-muted-foreground/60 bg-transparent hover:border-border/50 hover:text-muted-foreground cursor-default",
                    isFull && "border-emerald-500/60",
                    isActive('/compare') && compareCount > 0 && "bg-primary/10 border-primary"
                  )}
                >
                  <GitCompareArrows className="w-3.5 h-3.5" />
                  {isFull ? "Compare Now" : "Compare"}
                  {compareCount > 0 && (
                    <span 
                      className={cn(
                        "absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1",
                        "flex items-center justify-center",
                        "text-xs font-bold rounded-full",
                        "transition-all duration-200",
                        "motion-reduce:animate-none",
                        isFull
                          ? "bg-emerald-500 text-white"
                          : "bg-primary text-primary-foreground",
                        isCountAnimating && "animate-compare-badge-pop"
                      )}
                    >
                      {compareCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-md">
                {compareCount === 0 
                  ? "Add filaments to compare"
                  : isFull
                    ? "Compare list full — click to compare!"
                    : `Compare ${compareCount} — add up to ${compareMax || 6}`}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Region Selector - Prominent position */}
          <RegionSelector />

          {/* Right-side utilities */}
          <div className="hidden md:block w-px h-5 bg-border/40 mx-1.5" />
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <WishlistButton />
            <RecentlyViewedDropdown />
            <ThemeToggle />
            
            <div className="w-px h-5 bg-border/40 mx-1.5" />
            
            {/* User Avatar / Login */}
            {user ? <DropdownMenu>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button className="p-0.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group" aria-label="Account">
                        <Avatar className="w-8 h-8 border border-border group-hover:ring-2 group-hover:ring-primary/30 transition-all duration-150 cursor-pointer">
                          <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                          <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-150">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-md">
                    Account
                  </TooltipContent>
                </Tooltip>
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
                        <Link to="/admin" className="flex items-center text-sm">
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
              </DropdownMenu> : <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <button onClick={() => navigate('/auth')} className="p-0.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group" aria-label="Sign in">
                    <Avatar className="w-8 h-8 border border-border group-hover:ring-2 group-hover:ring-primary/30 transition-all duration-150 cursor-pointer">
                      <AvatarFallback className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-150">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-md">
                  Sign in
                </TooltipContent>
              </Tooltip>}
          </div>
        </div>

        {/* Mobile Menu - Slide down animation */}
        <div 
          id="mobile-navigation"
          role="navigation"
          aria-label="Mobile navigation"
          className={cn("lg:hidden overflow-hidden transition-all duration-300 ease-out bg-background", mobileMenuOpen ? "max-h-[calc(100vh-4rem)] opacity-100" : "max-h-0 opacity-0")}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="py-4 border-t border-border/30">
            {/* Compare Button - Prominent at top */}
            <div className="px-4 pb-4">
              <button onClick={() => {
              navigate('/compare');
              setMobileMenuOpen(false);
            }} className={cn("relative w-full border border-teal-500 bg-transparent hover:bg-teal-500/10", "rounded-lg px-4 py-3", "text-sm font-bold uppercase tracking-widest", "flex items-center justify-center gap-2", "transition-all duration-200", "text-teal-400")}>
                <GitCompareArrows className="w-4 h-4" />
                Compare Filaments
                {compareCount > 0 && (
                  <span 
                    className={cn(
                      "absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5",
                      "flex items-center justify-center",
                      "bg-primary text-primary-foreground text-xs font-bold rounded-full",
                      "transition-transform duration-200",
                      isCountAnimating && "animate-[pulse_0.3s_ease-out]"
                    )}
                  >
                    {compareCount}
                  </span>
                )}
              </button>
            </div>

            <div className="border-t border-border/30" />

            {/* Main nav links */}
            <MobileNavLink to="/" end>Filaments</MobileNavLink>
            <MobileNavLink to="/printers">Printers</MobileNavLink>
            <MobileNavLink to="/brands">Brands</MobileNavLink>
            <MobileNavLink to="/deals">
              Deals
              {dealsData && dealsData.totalVariants > 0 ? (
                <span className="inline-flex items-center justify-center ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" aria-label={`${dealsData.totalVariants.toLocaleString()} active deals`}>
                  {dealsData.totalVariants.toLocaleString()}
                </span>
              ) : dealsLoading ? (
                <span className="w-8 h-4 rounded-full bg-white/10 animate-pulse ml-1.5 inline-block" />
              ) : null}
            </MobileNavLink>

            <div className="border-t border-border/30 my-2" />

            {/* Learn Sections */}
            {learnMenuSections.map((section, sectionIndex) => (
              <div key={section.title}>
                <div className="px-4 py-2 flex items-center gap-2">
                  <section.icon className="w-4 h-4 text-muted-foreground/60" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
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

            {/* More coming soon note */}
            <div className="px-4 py-3 mt-1">
              <span className="text-xs text-muted-foreground/50 italic">More resources coming soon...</span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Trending Panel */}
      <TrendingPanel isOpen={trendingPanel.isOpen} onClose={trendingPanel.closePanel} selectedTab={trendingPanel.selectedTab} onTabChange={trendingPanel.setSelectedTab} activeTrends={trendingPanel.activeTrends} predictions={trendingPanel.predictions} isLoading={trendingPanel.isLoading} error={trendingPanel.error} viewedTrendIds={trendingPanel.viewedTrendIds} />
      <SearchCommandPalette open={searchPaletteOpen} onClose={() => setSearchPaletteOpen(false)} />
    </>;
};
export default Navbar;