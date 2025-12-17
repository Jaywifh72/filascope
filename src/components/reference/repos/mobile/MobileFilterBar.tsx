import { useState } from 'react';
import { Filter, ArrowUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFilterBarProps {
  totalCount: number;
  filteredCount: number;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const MobileFilterBar = ({ totalCount, filteredCount, sortBy, onSortChange }: MobileFilterBarProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const hasActiveFilters = priceFilter !== 'all' || typeFilter !== 'all';

  const clearFilters = () => {
    setPriceFilter('all');
    setTypeFilter('all');
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-white/[0.08]">
      {/* Main Bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] text-sm font-semibold transition-all",
            hasActiveFilters
              ? "bg-cyan-400/15 border border-cyan-400/30 text-cyan-400"
              : "bg-white/5 border border-white/10 text-foreground"
          )}
        >
          <Filter size={16} />
          Filter
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-cyan-400 rounded-full" />
          )}
        </button>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-[10px]">
          <ArrowUpDown size={14} className="text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="rank">By Rank</option>
            <option value="score">By Score</option>
            <option value="name">By Name</option>
            <option value="quality">By Quality</option>
          </select>
        </div>

        {/* Results Count */}
        <span className="ml-auto px-3 py-2 bg-white/5 rounded-full text-[13px] font-semibold text-muted-foreground">
          {filteredCount}/{totalCount}
        </span>
      </div>

      {/* Filter Drawer */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          showFilters ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 space-y-4">
          {/* Price Filter */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2.5">
              Price
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['all', 'free', 'freemium', 'premium'].map((value) => (
                <button
                  key={value}
                  onClick={() => setPriceFilter(value)}
                  className={cn(
                    "px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all",
                    priceFilter === value
                      ? "bg-cyan-400/15 border border-cyan-400/40 text-cyan-400"
                      : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2.5">
              Best For
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['all', 'beginners', 'sellers', 'engineers', 'hobbyists'].map((value) => (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  className={cn(
                    "px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all",
                    typeFilter === value
                      ? "bg-cyan-400/15 border border-cyan-400/40 text-cyan-400"
                      : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              <X size={14} />
              Clear All Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileFilterBar;
