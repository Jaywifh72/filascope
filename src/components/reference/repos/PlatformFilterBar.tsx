import React, { useState, useEffect } from 'react';
import { Filter, X, Gift, Zap, CreditCard, GraduationCap, DollarSign, Wrench, Palette, Printer, Package, Globe, FileText, Box, Cog, ChevronDown } from 'lucide-react';
import { useFilters } from '@/contexts/PlatformFilterContext';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  icon: React.ReactNode | null;
}

const priceOptions: FilterOption[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'free', label: 'Free', icon: <Gift size={14} /> },
  { value: 'freemium', label: 'Freemium', icon: <Zap size={14} /> },
  { value: 'premium', label: 'Premium', icon: <CreditCard size={14} /> }
];

const bestForOptions: FilterOption[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'beginners', label: 'Beginners', icon: <GraduationCap size={14} /> },
  { value: 'sellers', label: 'Sellers', icon: <DollarSign size={14} /> },
  { value: 'engineers', label: 'Engineers', icon: <Wrench size={14} /> },
  { value: 'hobbyists', label: 'Hobbyists', icon: <Palette size={14} /> }
];

const printerOptions: FilterOption[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'bambu', label: 'Bambu Optimized', icon: <Printer size={14} /> },
  { value: 'creality', label: 'Creality Optimized', icon: <Package size={14} /> },
  { value: 'universal', label: 'Universal', icon: <Globe size={14} /> }
];

const fileTypeOptions: FilterOption[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'stl-obj', label: 'STL/OBJ', icon: <FileText size={14} /> },
  { value: '3mf', label: '3MF', icon: <Box size={14} /> },
  { value: 'cad-step', label: 'CAD/STEP', icon: <Cog size={14} /> }
];

interface FilterPillProps {
  option: FilterOption;
  isActive: boolean;
  onClick: () => void;
}

const FilterPill: React.FC<FilterPillProps> = ({ option, isActive, onClick }) => (
  <button
    onClick={onClick}
    aria-pressed={isActive}
    className={cn(
      "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0",
      isActive 
        ? "bg-primary/15 border border-primary/50 text-primary" 
        : "bg-muted/30 border border-border/50 text-muted-foreground hover:bg-muted/50 hover:border-border hover:text-foreground"
    )}
  >
    {option.icon}
    <span>{option.label}</span>
  </button>
);

interface FilterGroupProps {
  label: string;
  options: FilterOption[];
  category: 'price' | 'bestFor' | 'printer' | 'fileTypes';
}

const FilterGroup: React.FC<FilterGroupProps> = ({ label, options, category }) => {
  const { filters, toggleFilter } = useFilters();
  const currentValues = filters[category];

  return (
    <div className="flex items-start gap-3" role="group" aria-label={`${label} filters`}>
      <span className="text-sm font-medium text-muted-foreground min-w-[70px] pt-2">
        {label}:
      </span>
      <div className="flex flex-wrap gap-2 md:overflow-x-auto md:flex-nowrap md:pb-1 md:scrollbar-hide">
        {options.map(option => (
          <FilterPill
            key={option.value}
            option={option}
            isActive={currentValues.includes(option.value as any)}
            onClick={() => toggleFilter(category, option.value as any)}
          />
        ))}
      </div>
    </div>
  );
};

const PlatformFilterBar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { clearFilters, hasActiveFilters, filteredCount, totalCount } = useFilters();

  // Auto-expand if filters are active
  useEffect(() => {
    if (hasActiveFilters) {
      setIsExpanded(true);
    }
  }, [hasActiveFilters]);

  return (
    <div 
      className="p-5 md:p-6 mb-8 bg-muted/20 border border-border/50 rounded-2xl"
      role="region"
      aria-label="Platform filters"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between mb-5 pb-4 border-b border-border/50 cursor-pointer md:cursor-default"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <Filter size={18} className="text-primary" />
          <span className="text-base font-bold text-foreground">Filter Platforms</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <div 
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              hasActiveFilters 
                ? "bg-primary/10 text-primary" 
                : "bg-muted/30 text-muted-foreground"
            )}
            aria-live="polite"
          >
            Showing <strong className="font-bold">{filteredCount}</strong> of {totalCount}
          </div>
          <div className={cn(
            "text-muted-foreground transition-transform md:hidden",
            isExpanded ? "rotate-180" : ""
          )}>
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      <div className={cn(
        "space-y-4 overflow-hidden transition-all duration-300",
        isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 md:max-h-[500px] md:opacity-100"
      )}>
        <FilterGroup label="Price" options={priceOptions} category="price" />
        <FilterGroup label="Best For" options={bestForOptions} category="bestFor" />
        <FilterGroup label="Printer" options={printerOptions} category="printer" />
        <FilterGroup label="Files" options={fileTypeOptions} category="fileTypes" />

        {/* Clear All Button */}
        {hasActiveFilters && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearFilters();
            }}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-sm font-semibold text-destructive hover:bg-destructive/15 transition-colors animate-in fade-in slide-in-from-top-1"
          >
            <X size={14} />
            <span>Clear All Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PlatformFilterBar;
