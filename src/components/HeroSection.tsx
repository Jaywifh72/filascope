import { useState, useEffect, useMemo, useRef } from "react";
import { Users, RefreshCw } from "lucide-react";
import SearchInputWithHistory from "@/components/search/SearchInputWithHistory";
import { SearchBarGated } from "@/components/search/SearchBarGated";
import { SmartContextBar } from "@/components/SmartContextBar";

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

  // Read cache once on mount
  const cached = useMemo(() => getCachedStats(), []);

  // Resolve display values: live data → cache → hardcoded fallback
  const displayProductCount = productCount > 0 ? productCount : (cached?.productCount ?? null);
  const displayBrandCount = brandCount > 0 ? brandCount : (cached?.brandCount ?? 48);

  // Cache successful live values (all three must be valid)
  useEffect(() => {
    if (filamentCount > 0 && brandCount > 0 && productCount > 0) {
      setCachedStats(filamentCount, productCount, brandCount);
    }
  }, [filamentCount, productCount, brandCount]);

  // Cycle through search suggestions - respects reduced motion preference
  useEffect(() => {
    if (searchTerm) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setCurrentSuggestionIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [searchTerm]);

  return (
    <section className="relative overflow-hidden">
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 pt-2 pb-1 sm:pt-3 sm:pb-1">
        {/* Desktop: H1 + search on one row. Mobile: stacked */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold tracking-tight leading-[1.15] text-white mb-2 lg:mb-0 lg:shrink-0">
            Find Your Perfect Filament
          </h1>

          {/* Search Input — expands to fill remaining space on desktop */}
          <SearchBarGated>
            <div className="w-full lg:max-w-[520px] search-icon-pulse">
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
                className="h-11 sm:h-12"
              />
            </div>
          </SearchBarGated>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
