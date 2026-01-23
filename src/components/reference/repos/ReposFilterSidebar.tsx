import React, { useState } from 'react';
import { Filter, X, Gift, Zap, CreditCard, GraduationCap, DollarSign, Wrench, Palette, Printer, Package, Globe, FileText, Box, Cog, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useFilters } from '@/contexts/PlatformFilterContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
      "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full justify-start",
      isActive
        ? "bg-primary/15 border border-primary/50 text-primary"
        : "bg-muted/30 border border-border/50 text-muted-foreground hover:bg-muted/50 hover:border-border hover:text-foreground"
    )}
  >
    {option.icon}
    <span>{option.label}</span>
  </button>
);

interface CollapsibleFilterGroupProps {
  label: string;
  icon: React.ReactNode;
  options: FilterOption[];
  category: 'price' | 'bestFor' | 'printer' | 'fileTypes';
  defaultOpen?: boolean;
}

const CollapsibleFilterGroup: React.FC<CollapsibleFilterGroupProps> = ({
  label,
  icon,
  options,
  category,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { filters, toggleFilter } = useFilters();
  const currentValues = filters[category];
  const hasActive = !currentValues.includes('all');

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            {icon}
          </span>
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {hasActive && (
            <span className="w-2 h-2 bg-primary rounded-full" />
          )}
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100 pb-4" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-2">
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
      </div>
    </div>
  );
};

// Desktop Sidebar
const ReposFilterSidebarContent: React.FC = () => {
  const { clearFilters, hasActiveFilters, filteredCount, totalCount } = useFilters();

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="pb-4 mb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={18} className="text-primary" />
          <span className="text-base font-bold text-foreground">Filter Platforms</span>
        </div>
        <div
          className={cn(
            "text-sm font-medium",
            hasActiveFilters ? "text-primary" : "text-muted-foreground"
          )}
        >
          Showing <strong>{filteredCount}</strong> of {totalCount}
        </div>
      </div>

      {/* Filter Groups */}
      <CollapsibleFilterGroup
        label="Price"
        icon={<DollarSign size={16} />}
        options={priceOptions}
        category="price"
      />
      <CollapsibleFilterGroup
        label="Best For"
        icon={<GraduationCap size={16} />}
        options={bestForOptions}
        category="bestFor"
      />
      <CollapsibleFilterGroup
        label="Printer"
        icon={<Printer size={16} />}
        options={printerOptions}
        category="printer"
      />
      <CollapsibleFilterGroup
        label="File Types"
        icon={<FileText size={16} />}
        options={fileTypeOptions}
        category="fileTypes"
      />

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 w-full mt-4 pt-4 border-t border-border text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
        >
          <X size={14} />
          <span>Clear All Filters</span>
        </button>
      )}
    </div>
  );
};

// Desktop Sidebar Wrapper
export const ReposFilterSidebar: React.FC = () => {
  return (
    <aside className="hidden lg:block w-60 flex-shrink-0">
      <div className="sticky top-20 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
        <ReposFilterSidebarContent />
      </div>
    </aside>
  );
};

// Mobile Filter Sheet - Wrap hook in a child component to ensure context is available
const MobileFilterButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { hasActiveFilters, filteredCount, totalCount } = useFilters();
  
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
          {totalCount - filteredCount > 0 ? filteredCount : 'All'}
        </span>
      )}
    </Button>
  );
};

export const ReposMobileFilterSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <MobileFilterButton onClick={() => setIsOpen(true)} />
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Filter size={18} className="text-primary" />
            Filter Platforms
          </SheetTitle>
        </SheetHeader>
        <ReposFilterSidebarContent />
      </SheetContent>
    </Sheet>
  );
};

export default ReposFilterSidebar;
