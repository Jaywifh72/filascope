import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface QuickFilter {
  id: string;
  label: string;
  emoji: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  { id: "popular", emoji: "🔥", label: "Popular This Week" },
  { id: "deals", emoji: "💰", label: "Best Deals" },
  { id: "new", emoji: "🆕", label: "New Arrivals" },
  { id: "hueforge", emoji: "🎨", label: "Best for HueForge" },
  { id: "highspeed", emoji: "⚡", label: "High Speed PLA" },
  { id: "silk", emoji: "🌈", label: "Silk & Shimmer" },
];

interface QuickFilterPillsProps {
  activeFilter: string | null;
  onFilterChange: (filterId: string | null) => void;
  counts?: Record<string, number>;
  filteredCount?: number;
}

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (target <= 0) { setValue(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

export function QuickFilterPills({ activeFilter, onFilterChange, counts, filteredCount }: QuickFilterPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showCount, setShowCount] = useState(false);
  const [countTarget, setCountTarget] = useState(0);
  const animatedCount = useCountUp(showCount ? countTarget : 0);

  // Show count animation when filter activates
  useEffect(() => {
    if (activeFilter && filteredCount !== undefined) {
      setCountTarget(filteredCount);
      setShowCount(true);
      const timer = setTimeout(() => setShowCount(false), 2500);
      return () => clearTimeout(timer);
    } else {
      setShowCount(false);
    }
  }, [activeFilter, filteredCount]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3">
      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 w-12 h-full bg-gradient-to-r from-background to-transparent pointer-events-none z-10 sm:hidden" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 w-12 h-full bg-gradient-to-l from-background to-transparent pointer-events-none z-10 sm:hidden" />

        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {QUICK_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            const hasActive = activeFilter !== null;
            const count = counts?.[filter.id];
            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(isActive ? null : filter.id)}
                style={{ scrollSnapAlign: "center" }}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-all duration-150 cursor-pointer whitespace-nowrap",
                  isActive
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 ring-2 ring-cyan-500/20"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400",
                  hasActive && !isActive && "opacity-70"
                )}
              >
                <span>{filter.emoji}</span>
                <span>{filter.label}</span>
                {count !== undefined && count > 0 && (
                  <span className="text-xs font-medium text-cyan-400">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count animation */}
      <div
        className={cn(
          "text-center text-sm text-muted-foreground mt-2 transition-all duration-300",
          showCount ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none h-0 mt-0"
        )}
      >
        Showing {animatedCount.toLocaleString()} filaments
      </div>
    </div>
  );
}

export default QuickFilterPills;
