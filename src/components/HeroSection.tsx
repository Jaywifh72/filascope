import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, Target, Columns3, Tag, Users, RefreshCw, Palette, ArrowRight, X } from "lucide-react";
import SearchInputWithHistory from "@/components/search/SearchInputWithHistory";
import { useDealsCount } from "@/hooks/useDealsCount";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getBrandLogoUrl } from "@/lib/brandLogos";

const QUICK_MATCH_DISMISSED_KEY = "filascope_hero_quickmatch_dismissed";

const CACHE_KEY = "hero_stats_cache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedStats {
  filamentCount: number;
  productCount: number;
  brandCount: number;
  timestamp: number;
}

function getCachedStats(): CachedStats | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedStats = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCachedStats(filamentCount: number, productCount: number, brandCount: number) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      filamentCount,
      productCount,
      brandCount,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage unavailable, silently ignore
  }
}

/**
 * Smoothly animated stat number that transitions between values.
 * Renders a shimmer skeleton when value is null (no cache, still loading).
 */
function AnimatedStat({ value, suffix = "+" }: { value: number | null; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === null) return;

    // First real value — set immediately (no animation from skeleton)
    if (prevValue.current === null) {
      setDisplayValue(value);
      prevValue.current = value;
      return;
    }

    // Same value — skip animation
    if (value === prevValue.current) return;

    // Animate from previous to new value
    const start = prevValue.current;
    const end = value;
    const duration = 400;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * easeOut));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    prevValue.current = value;
  }, [value]);

  if (displayValue === null) {
    return <span className="inline-block w-10 h-4 bg-primary/20 rounded animate-pulse align-middle" />;
  }

  return <span className="text-primary tabular-nums">{displayValue.toLocaleString()}{suffix}</span>;
}

interface HeroSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filamentCount: number;
  productCount: number;
  brandCount: number;
  compatibleCount: number;
  isLoading?: boolean;
}

const searchSuggestions = [
  "Try 'PETG for outdoor use'",
  "Try 'best budget PLA'",
  "Try 'Bambu Lab filament'",
  "Try 'carbon fiber PETG'",
  "Try 'flexible TPU'",
];

const HeroSection = ({ searchTerm, onSearchChange, filamentCount, productCount, brandCount, compatibleCount, isLoading = false }: HeroSectionProps) => {
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [quickMatchDismissed, setQuickMatchDismissed] = useState(() => {
    try { return localStorage.getItem(QUICK_MATCH_DISMISSED_KEY) === "true"; } catch { return false; }
  });

  // Use shared deals count hook for consistency with Deals page
  const { data: dealsData, isLoading: isDealsLoading } = useDealsCount();
  const dealsCount = dealsData?.uniqueProducts || 0;

  // Read cache once on mount
  const cached = useMemo(() => getCachedStats(), []);

  // Resolve display values: live data → cache → hardcoded fallback
  const displayProductCount = productCount > 0 ? productCount : (cached?.productCount ?? null);
  const displayVariantCount = filamentCount > 0 ? filamentCount : (cached?.filamentCount ?? null);
  // For brand count: live → cache → fallback of 25 (never show skeleton forever)
  const displayBrandCount = brandCount > 0 ? brandCount : (cached?.brandCount ?? 48);

  // Cache successful live values (all three must be valid)
  useEffect(() => {
    if (filamentCount > 0 && brandCount > 0 && productCount > 0) {
      setCachedStats(filamentCount, productCount, brandCount);
    }
  }, [filamentCount, productCount, brandCount]);

  // Dynamic quick start paths
  const quickStartPaths = useMemo(() => [
    {
      title: "Quick Match",
      description: "Answer 5 questions, get your perfect filament",
      icon: Target,
      href: "/wizard",
      color: "purple",
    },
    {
      title: "Browse Filaments",
      description: displayProductCount != null ? `Explore ${displayProductCount.toLocaleString()}+ products` : 'Explore all products',
      icon: Search,
      href: "#system-config",
      color: "primary",
      isScroll: true,
    },
    {
      title: "Material Reference",
      description: "Explore material properties & settings",
      icon: Columns3,
      href: "/compare",
      color: "blue",
    },
    {
      title: "Find by Color",
      description: "Match any color to real filaments",
      icon: Palette,
      href: "/colors",
      color: "pink",
    },
    {
      title: "Today's Deals",
      description: isDealsLoading ? "Loading deals..." : (
        <>{dealsCount > 0 && <span className="text-amber-400 font-semibold">{dealsCount}</span>}{dealsCount > 0 ? " active deals" : "Active deals"}</>
      ),
      icon: Tag,
      href: "/deals",
      color: "green",
      hasLiveBadge: !isDealsLoading && dealsCount > 0,
    },
  ], [displayProductCount, dealsCount, isDealsLoading]);

  // Cycle through search suggestions - respects reduced motion preference
  useEffect(() => {
    if (searchTerm) return; // Don't cycle when has value
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return; // Don't animate for users who prefer reduced motion
    
    const interval = setInterval(() => {
      setCurrentSuggestionIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [searchTerm]);

  const getCardClasses = (path: typeof quickStartPaths[number]) => {
    const isBrowse = path.title === "Browse Filaments";
    const isDeals = path.title === "Today's Deals";
    const isPrimary = isBrowse || isDeals;

    const base = "group relative flex flex-col items-center text-center p-3 sm:p-4 rounded-xl border transition-all duration-200 ease-out min-h-[100px] sm:min-h-[120px] touch-manipulation";
    const hover = "hover:scale-[1.03] hover:shadow-lg hover:shadow-cyan-500/10 hover:border-white/20 hover:bg-white/[0.06]";
    const active = "active:scale-[0.98] active:duration-100";

    let accent = "";
    let iconColor = "";
    let bg = "";

    if (isBrowse) {
      accent = "border-l-2 border-l-cyan-400 border-white/10 bg-primary/5";
      iconColor = "text-cyan-400";
    } else if (isDeals) {
      accent = "border-l-2 border-l-emerald-400 border-white/10 bg-emerald-500/5";
      iconColor = "text-emerald-400";
    } else {
      // Secondary cards
      accent = "border-white/10 bg-white/[0.03]";
      switch (path.color) {
        case 'purple': iconColor = "text-purple-400"; break;
        case 'blue': iconColor = "text-blue-400"; break;
        case 'pink': iconColor = "text-pink-400"; break;
        default: iconColor = "text-gray-400"; break;
      }
    }

    return { className: `${base} ${hover} ${active} ${accent}`, iconColor, isPrimary };
  };

  return (
    <section className="relative overflow-hidden">
      {/* Main content */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 pt-4 pb-1 sm:pt-6 sm:pb-2 md:pt-8 md:pb-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <div className="flex flex-col items-start text-left order-1">
            {/* Headline */}
            <h1 
              className="animate-fade-in mb-4"
            >
              <span className="block text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] uppercase text-white">
                Find Your Perfect{' '}
              </span>
              <span className="block text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] uppercase text-primary">
                3D Printer Filament.
              </span>
            </h1>
            
            {/* Subheadline */}
            <div className="mb-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <p className="text-lg md:text-xl text-gray-300 font-medium">
                <AnimatedStat value={displayProductCount} /> materials indexed from <AnimatedStat value={displayBrandCount} />+ manufacturers.
              </p>
              <p className="text-base text-gray-400 mt-1">
                Compare properties, specs, and pricing in one unified data hub.
              </p>
            </div>

            {/* Social proof / Trust badges */}
            <div 
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400 mb-6 animate-fade-in border-t border-white/10 pt-4 mt-4"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary/70" />
                <span>Trusted by <span className="text-primary font-semibold">10,000+</span> makers</span>
              </div>
              <span className="text-gray-600 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 text-primary/70" />
                <span>Updated daily from <span className="text-foreground font-medium">15+</span> retailers</span>
              </div>
            </div>
            
            {/* Search Input with History & Suggestions */}
            <div 
              className="w-full max-w-full sm:max-w-[500px] mb-6 animate-fade-in search-icon-pulse"
              style={{ animationDelay: "0.25s" }}
            >
              <style>{`
                .search-icon-pulse svg:first-child {
                  animation: searchPulse 5s ease-in-out infinite;
                }
                @keyframes searchPulse {
                  0%, 90%, 100% { opacity: 0.5; transform: translateY(-50%) scale(1); }
                  95% { opacity: 1; transform: translateY(-50%) scale(1.15); }
                }
              `}</style>
              <SearchInputWithHistory
                value={searchTerm}
                onChange={onSearchChange}
                placeholder={searchSuggestions[currentSuggestionIndex]}
                context="filaments"
                className="h-12 sm:h-14"
              />
            </div>

            {/* Quick Match Inline Banner — dismissable */}
            {!quickMatchDismissed && (
              <div
                className="w-full max-w-full sm:max-w-[600px] mb-4 animate-fade-in bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg px-4 py-2.5 flex items-center justify-between gap-3"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Target className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-slate-300">
                    New to filaments? Quick Match finds your perfect filament in 60 seconds.
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to="/wizard"
                    className="bg-primary/80 hover:bg-primary text-sm text-primary-foreground px-3 py-1 rounded-md font-medium transition-colors"
                  >
                    Start <ArrowRight className="w-3 h-3 inline ml-0.5" />
                  </Link>
                  <button
                    onClick={() => {
                      setQuickMatchDismissed(true);
                      try { localStorage.setItem(QUICK_MATCH_DISMISSED_KEY, "true"); } catch {}
                    }}
                    className="text-slate-500 hover:text-foreground transition-colors"
                    aria-label="Dismiss Quick Match banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Start Paths - 5 cards */}
            <div 
              className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 w-full max-w-[720px] animate-fade-in mb-8 sm:mb-10 md:mb-12"
              style={{ animationDelay: "0.35s" }}
            >
              {quickStartPaths.map((path) => {
                const Icon = path.icon;
                const { className: cardClasses, iconColor } = getCardClasses(path);
                
                const cardContent = (
                  <>
                    {/* LIVE badge for deals card */}
                    {path.hasLiveBadge && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[8px] font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live
                      </div>
                    )}
                    <Icon className={`h-7 w-7 mb-2 transition-transform group-hover:scale-110 ${iconColor}`} />
                    <span className="text-sm font-medium text-foreground mb-0.5">{path.title}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">{path.description}</span>
                  </>
                );
                
                if (path.isScroll) {
                  return (
                    <button
                      key={path.title}
                      onClick={() => {
                        const element = document.getElementById('system-config');
                        if (element) {
                          const headerOffset = 80;
                          const elementPosition = element.getBoundingClientRect().top;
                          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                          // Respect reduced motion preference
                          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                          window.scrollTo({ top: offsetPosition, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
                        }
                      }}
                      className={cardClasses}
                      aria-label={`${path.title}: ${path.description}`}
                    >
                      {cardContent}
                    </button>
                  );
                }
                
                return (
                  <Link
                    key={path.title}
                    to={path.href}
                    className={cardClasses}
                    data-tour={path.title === "Quick Match" ? "quick-match" : undefined}
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Right: Brand Logo Marquee */}
          <div 
            className="hidden xl:flex justify-end items-center animate-fade-in order-2"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="w-[320px] overflow-hidden">
              <div className="grid grid-cols-3 gap-3 group/marquee">
                {[
                  { name: "Bambu Lab" },
                  { name: "Polymaker" },
                  { name: "eSun" },
                  { name: "Prusament" },
                  { name: "Hatchbox" },
                  { name: "Overture" },
                ].map((brand) => (
                  <Link
                    key={brand.name}
                    to={`/brands/${brand.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3 flex items-center justify-center h-20 opacity-70 brightness-75 hover:brightness-100 hover:opacity-100 hover:scale-105 transition-all duration-200"
                  >
                    <BrandLogo
                      src={getBrandLogoUrl(brand.name, 80)}
                      brandName={brand.name}
                      size="md"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
