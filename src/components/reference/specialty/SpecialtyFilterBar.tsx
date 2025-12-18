import { Filter, X } from 'lucide-react';
import { useSpecialtyFilters, SpecialtyFilterState } from '@/contexts/SpecialtyFilterContext';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  label: string;
  icon: string;
}

const filterOptions: Record<keyof SpecialtyFilterState, FilterOption[]> = {
  category: [
    { id: 'calibration', label: 'Calibration', icon: '🎯' },
    { id: 'mesh-tools', label: 'Mesh Tools', icon: '🔧' },
    { id: 'ai-generation', label: 'AI Generation', icon: '🤖' },
    { id: 'remote-control', label: 'Remote Control', icon: '📡' },
    { id: 'cad', label: 'CAD Software', icon: '📐' },
    { id: 'farm-management', label: 'Farm Management', icon: '🏭' },
    { id: 'repository', label: 'Repository', icon: '📦' },
    { id: 'filament-art', label: 'Filament Art', icon: '🎨' }
  ],
  pricing: [
    { id: 'free', label: 'Free', icon: '🆓' },
    { id: 'one-time', label: 'One-Time', icon: '💳' },
    { id: 'freemium', label: 'Freemium', icon: '🔓' },
    { id: 'subscription', label: 'Subscription', icon: '📅' }
  ],
  skillLevel: [
    { id: 'beginner', label: 'Beginner Friendly', icon: '🌱' },
    { id: 'intermediate', label: 'Intermediate', icon: '📈' },
    { id: 'advanced', label: 'Advanced', icon: '🎯' }
  ],
  useCase: [
    { id: 'print-quality', label: 'Print Quality', icon: '✨' },
    { id: 'productivity', label: 'Productivity', icon: '⚡' },
    { id: 'creative', label: 'Creative', icon: '🎨' },
    { id: 'management', label: 'Management', icon: '🏭' }
  ]
};

const groupLabels: Record<keyof SpecialtyFilterState, string> = {
  category: 'Category',
  pricing: 'Pricing',
  skillLevel: 'Skill Level',
  useCase: 'Use Case'
};

export default function SpecialtyFilterBar() {
  const { 
    filters, 
    toggleFilter, 
    clearFilters, 
    isFilterActive,
    activeFilterCount,
    hasActiveFilters,
    filteredTools,
    totalCount
  } = useSpecialtyFilters();

  return (
    <div className="p-6 mb-8 bg-card/30 border border-border/50 rounded-2xl">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2.5 text-foreground font-bold">
          <Filter className="h-[18px] w-[18px] text-primary" />
          <span>Filter Tools</span>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          Showing <span className="font-bold text-primary">{filteredTools.length}</span> of {totalCount}
        </div>
      </div>

      {/* Filter Groups */}
      {(Object.keys(filterOptions) as (keyof SpecialtyFilterState)[]).map((group) => (
        <div key={group} className="mb-4 last:mb-0">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
            {groupLabels[group]}
          </div>
          <div 
            className="flex flex-wrap gap-2 md:flex-wrap overflow-x-auto pb-2 -mr-4 pr-4 md:mr-0 md:pr-0 md:overflow-visible scrollbar-hide"
            role="group"
            aria-label={`${groupLabels[group]} filters`}
          >
            {filterOptions[group].map(option => {
              const isActive = isFilterActive(group, option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleFilter(group, option.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap flex-shrink-0",
                    "border transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "active:scale-[0.98]",
                    isActive
                      ? "bg-primary/15 border-primary/40 text-primary hover:bg-primary/20 hover:border-primary/50"
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50 hover:border-border hover:text-foreground"
                  )}
                >
                  <span className="text-sm">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-5 pt-4 border-t border-border/50">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(filters) as (keyof SpecialtyFilterState)[]).map(group =>
              filters[group].map(value => {
                const option = filterOptions[group]?.find(o => o.id === value);
                if (!option) return null;
                return (
                  <div
                    key={`${group}-${value}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-primary/10 border border-primary/30 rounded-md text-xs font-semibold text-primary animate-in slide-in-from-left-2 duration-200"
                  >
                    <span>{option.icon} {option.label}</span>
                    <button
                      onClick={() => toggleFilter(group, value)}
                      aria-label={`Remove ${option.label} filter`}
                      className="flex items-center justify-center p-0.5 rounded hover:bg-primary/20 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-xs font-semibold text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 hover:border-destructive/50 transition-all w-full sm:w-auto"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
