import { useState, useRef } from "react";
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
}

export function QuickFilterPills({ activeFilter, onFilterChange }: QuickFilterPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1"
      >
        {QUICK_FILTERS.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(isActive ? null : filter.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap",
                isActive
                  ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-400"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400"
              )}
            >
              <span>{filter.emoji}</span>
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuickFilterPills;
