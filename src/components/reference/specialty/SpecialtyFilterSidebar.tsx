import React, { useState } from 'react';
import { Filter, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { useSpecialtyFilters, SpecialtyFilterState } from '@/contexts/SpecialtyFilterContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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

interface FilterGroupProps {
  group: keyof SpecialtyFilterState;
  options: FilterOption[];
  defaultOpen?: boolean;
}

const FilterGroup: React.FC<FilterGroupProps> = ({ group, options, defaultOpen = true }) => {
  const { toggleFilter, isFilterActive, filters } = useSpecialtyFilters();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const activeCount = filters[group].length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-sm font-semibold text-foreground hover:text-primary transition-colors group">
        <div className="flex items-center gap-2">
          <span>{groupLabels[group]}</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4">
        <div className="flex flex-col gap-1.5 pt-1">
          {options.map(option => {
            const isActive = isFilterActive(group, option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggleFilter(group, option.id)}
                aria-pressed={isActive}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-left",
                  "transition-all duration-200",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                )}
              >
                <span className="text-base">{option.icon}</span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// Desktop Sidebar
export const SpecialtyFilterSidebar: React.FC = () => {
  const { 
    clearFilters, 
    hasActiveFilters,
    filteredTools,
    totalCount
  } = useSpecialtyFilters();

  return (
    <aside className="hidden lg:block w-[260px] flex-shrink-0">
      <div className="sticky top-20 bg-gray-900/60 border border-border/50 rounded-xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Filter className="h-4 w-4 text-primary" />
            <span>Filter Tools</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Result Count */}
        <div className="text-xs text-muted-foreground mb-4">
          Showing <span className="font-semibold text-primary">{filteredTools.length}</span> of {totalCount} tools
        </div>

        {/* Filter Groups */}
        <div className="divide-y divide-border/30">
          {(Object.keys(filterOptions) as (keyof SpecialtyFilterState)[]).map((group) => (
            <FilterGroup
              key={group}
              group={group}
              options={filterOptions[group]}
              defaultOpen={group === 'category' || group === 'pricing'}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};

// Mobile Filter Button Component (separate to avoid hook issues)
const MobileFilterButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { hasActiveFilters, filteredTools, totalCount } = useSpecialtyFilters();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "lg:hidden gap-2",
        hasActiveFilters && "border-primary text-primary"
      )}
    >
      <SlidersHorizontal size={16} />
      <span>Filters</span>
      {hasActiveFilters && (
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          {totalCount - filteredTools.length > 0 ? filteredTools.length : 'All'}
        </span>
      )}
    </Button>
  );
};

// Mobile Filter Sheet
export const SpecialtyMobileFilterSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <MobileFilterButton onClick={() => setIsOpen(true)} />
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filter Tools
          </SheetTitle>
        </SheetHeader>
        <MobileFilterContent onClose={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
};

// Mobile Filter Content (uses hooks safely inside Sheet)
const MobileFilterContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { 
    clearFilters, 
    hasActiveFilters,
    filteredTools,
    totalCount
  } = useSpecialtyFilters();

  return (
    <div className="space-y-4">
      {/* Result Count */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-semibold text-primary">{filteredTools.length}</span> of {totalCount} tools
      </div>

      {/* Filter Groups */}
      <div className="divide-y divide-border/30">
        {(Object.keys(filterOptions) as (keyof SpecialtyFilterState)[]).map((group) => (
          <FilterGroup
            key={group}
            group={group}
            options={filterOptions[group]}
            defaultOpen={true}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border/50">
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
        <Button
          size="sm"
          onClick={onClose}
          className="flex-1"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default SpecialtyFilterSidebar;
