import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, FlaskConical, Target, Columns3, Tag, Users, RefreshCw, Palette } from "lucide-react";
import SearchInputWithHistory from "@/components/search/SearchInputWithHistory";
import { useDealsCount } from "@/hooks/useDealsCount";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getBrandLogoUrl } from "@/lib/brandLogos";

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

  // Use shared deals count hook for consistency with Deals page
  const { data: dealsData, isLoading: isDealsLoading } = useDealsCount();
  const dealsCount = dealsData?.uniqueProducts || 0;

  // Read cache once on mount
  const cached = useMemo(() => getCachedStats(), []);

  // Resolve display values: live data → cache → null (skeleton)
  // Never use hardcoded fallbacks — show skeleton instead of wrong numbers
  const displayProductCount = productCount > 0 ? productCount : (cached?.productCount ?? null);
  const displayVariantCount = filamentCount > 0 ? filamentCount : (cached?.filamentCount ?? null);
  const displayBrandCount = brandCount > 0 ? brandCount : (cached?.brandCount ?? null);

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
      description: isDealsLoading ? "Loading deals..." : `${dealsCount} active deals`,
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

  const getColorClasses = (color: string, title?: string) => {
    // #4: "Quick Match" and "Browse Filaments" get primary tint as primary paths
    const isPrimaryPath = title === "Quick Match" || title === "Browse Filaments";
    if (isPrimaryPath) {
      return 'border-primary/20 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 text-primary hover:shadow-primary/10';
    }
    switch (color) {
      case 'primary':
        return 'border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 text-primary hover:shadow-primary/10';
      case 'blue':
        return 'border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 hover:shadow-blue-500/10';
      case 'purple':
        return 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 hover:shadow-purple-500/10';
      case 'green':
        return 'border-green-500/30 hover:border-green-500/60 bg-green-500/5 hover:bg-green-500/10 text-green-400 hover:shadow-green-500/10';
      case 'pink':
        return 'border-pink-500/30 hover:border-pink-500/60 bg-pink-500/5 hover:bg-pink-500/10 text-pink-400 hover:shadow-pink-500/10';
      default:
        return 'border-gray-500/30 hover:border-gray-500/60 bg-gray-500/5 hover:bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* Main content */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 pt-6 pb-2 sm:pt-10 sm:pb-4 md:pt-12 md:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left: Text Content */}
          <div className="flex flex-col items-start text-left order-1">
            {/* Material Registry Badge */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-5 animate-fade-in"
            >
              <FlaskConical className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-primary">
                Material Registry
              </span>
            </div>

            {/* Headline */}
            <h1 
              className="animate-fade-in mb-4"
            >
              <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold tracking-[0.08em] leading-[1.1] uppercase text-slate-100">
                Find Your Perfect Filament.
              </span>
              <span className="block text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-medium tracking-[0.06em] leading-[1.2] uppercase text-slate-400 mt-2">
                Compare prices from 15+ stores.
              </span>
            </h1>
            
            {/* Subtitle stats line */}
            <p 
              className="text-sm text-slate-500 mb-3 animate-fade-in"
              style={{ animationDelay: "0.15s" }}
            >
              <AnimatedStat value={displayProductCount} /> materials · <AnimatedStat value={displayBrandCount} /> brands · Real-time pricing in your currency
            </p>

            {/* Trust badges */}
            <div 
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 mb-6 animate-fade-in border-t border-slate-700/50 pt-4 mt-4"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary/70" />
                <span>Trusted by <span className="text-foreground font-medium">10,000+</span> makers</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3 w-3 text-primary/70" />
                <span>Updated daily from <span className="text-foreground font-medium">15+</span> retailers</span>
              </div>
            </div>
            
            {/* Search Input with History & Suggestions */}
            <div 
              className="w-full max-w-full sm:max-w-[500px] mb-6 animate-fade-in"
              style={{ animationDelay: "0.25s" }}
            >
              <SearchInputWithHistory
                value={searchTerm}
                onChange={onSearchChange}
                placeholder={searchSuggestions[currentSuggestionIndex]}
                context="filaments"
                className="h-12 sm:h-14"
              />
            </div>

            {/* Quick Start Paths - 4 cards */}
            <div 
              className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 w-full max-w-[720px] animate-fade-in mb-12 sm:mb-16 md:mb-20"
              style={{ animationDelay: "0.35s" }}
            >
              {quickStartPaths.map((path) => {
                const Icon = path.icon;
                const cardClasses = `group relative flex flex-col items-center text-center p-3 sm:p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg min-h-[100px] sm:min-h-[120px] touch-manipulation ${getColorClasses(path.color, path.title)}`;
                
                const cardContent = (
                  <>
                    {/* LIVE badge for deals card */}
                    {path.hasLiveBadge && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[8px] font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live
                      </div>
                    )}
                    <Icon className="h-7 w-7 mb-2 transition-transform group-hover:scale-110" />
                    <span className="text-sm font-medium text-foreground mb-0.5">{path.title}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{path.description}</span>
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
          
          {/* Right: Brand Logo Grid */}
          <div 
            className="hidden xl:flex justify-end items-center animate-fade-in order-2"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="grid grid-cols-3 gap-3 w-[320px]">
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
                  className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3 flex items-center justify-center h-20 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
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
    </section>
  );
};

export default HeroSection;
