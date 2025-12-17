import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCADFilters } from '@/contexts/CADFilterContext';

interface FilterOption {
  value: string;
  label: string;
  icon: string | null;
}

const priceOptions: FilterOption[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'free', label: 'Free', icon: '🆓' },
  { value: 'freemium', label: 'Freemium', icon: '⚡' },
  { value: 'paid', label: 'Paid', icon: '💳' }
];

const levelOptions: FilterOption[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'beginner', label: 'Beginner', icon: '🎓' },
  { value: 'intermediate', label: 'Intermediate', icon: '⚙️' },
  { value: 'advanced', label: 'Advanced', icon: '🔬' }
];

const platformOptions: FilterOption[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'windows', label: 'Windows', icon: '🪟' },
  { value: 'mac', label: 'Mac', icon: '🍎' },
  { value: 'linux', label: 'Linux', icon: '🐧' },
  { value: 'browser', label: 'Browser', icon: '🌐' },
  { value: 'mobile', label: 'Mobile', icon: '📱' }
];

const FilterPill = ({
  option,
  isActive,
  onClick,
}: {
  option: FilterOption;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    aria-pressed={isActive}
    className={cn(
      "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full",
      "text-[13px] font-semibold transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      isActive
        ? "bg-cyan-400/15 border-[1.5px] border-cyan-400 text-cyan-400"
        : "bg-white/[0.03] border-[1.5px] border-white/10 text-muted-foreground hover:bg-white/[0.06] hover:border-white/20 hover:text-foreground"
    )}
  >
    {option.icon && <span className="text-sm leading-none">{option.icon}</span>}
    <span>{option.label}</span>
  </button>
);

const FilterGroup = ({
  label,
  options,
  activeValues,
  onToggle,
}: {
  label: string;
  options: FilterOption[];
  activeValues: string[];
  onToggle: (value: string) => void;
}) => (
  <div 
    className="flex items-center gap-3 md:gap-3"
    role="group"
    aria-labelledby={`filter-${label.toLowerCase()}`}
  >
    <span 
      id={`filter-${label.toLowerCase()}`}
      className="min-w-[70px] text-[13px] font-semibold text-muted-foreground"
    >
      {label}:
    </span>
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <FilterPill
          key={option.value}
          option={option}
          isActive={activeValues.includes(option.value)}
          onClick={() => onToggle(option.value)}
        />
      ))}
    </div>
  </div>
);

const CADFilterBar = () => {
  const { 
    filters, 
    toggleFilter, 
    clearFilters, 
    hasActiveFilters, 
    filteredCount, 
    totalCount 
  } = useCADFilters();
  
  const [announcement, setAnnouncement] = useState('');

  // Announce filter changes for screen readers
  useEffect(() => {
    if (hasActiveFilters) {
      setAnnouncement(`Filtered to ${filteredCount} of ${totalCount} software options`);
    } else {
      setAnnouncement(`Showing all ${totalCount} software options`);
    }
  }, [filteredCount, totalCount, hasActiveFilters]);

  return (
    <div 
      className="w-full p-5 md:p-6 mb-8 bg-white/[0.02] border border-white/[0.08] rounded-2xl"
      role="region"
      aria-label="Filter software"
    >
      {/* Screen reader announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.08]">
        <h3 className="flex items-center gap-2.5 text-base font-bold text-foreground">
          <Filter size={18} className="text-cyan-400" />
          Filter Software
        </h3>
        <span className={cn(
          "text-sm font-medium",
          hasActiveFilters ? "text-cyan-400" : "text-muted-foreground"
        )}>
          Showing <strong className={hasActiveFilters ? "text-cyan-400" : "text-foreground"}>{filteredCount}</strong> of {totalCount}
        </span>
      </div>

      {/* Filter Groups */}
      <div className="flex flex-col gap-4">
        <FilterGroup
          label="Price"
          options={priceOptions}
          activeValues={filters.price}
          onToggle={(value) => toggleFilter('price', value)}
        />
        <FilterGroup
          label="Level"
          options={levelOptions}
          activeValues={filters.level}
          onToggle={(value) => toggleFilter('level', value)}
        />
        <FilterGroup
          label="Platform"
          options={platformOptions}
          activeValues={filters.platform}
          onToggle={(value) => toggleFilter('platform', value)}
        />
      </div>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className={cn(
            "inline-flex items-center gap-1.5 mt-5 px-4 py-2.5",
            "bg-destructive/10 border border-destructive/20 rounded-lg",
            "text-[13px] font-semibold text-destructive",
            "transition-all duration-200 animate-fade-in",
            "hover:bg-destructive/15 hover:border-destructive/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <X size={14} />
          Clear All Filters
        </button>
      )}
    </div>
  );
};

export default CADFilterBar;
