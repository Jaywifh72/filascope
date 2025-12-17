import { useState } from 'react';
import { Filter, Check, X, ChevronDown } from 'lucide-react';
import { 
  SlicerFilterState, 
  SLICER_FILTER_CATEGORIES,
  FilterCategory
} from '@/lib/slicerFilterUtils';

interface FilterCheckboxProps {
  id: string;
  label: string;
  count: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const FilterCheckbox = ({ id, label, count, checked, onChange }: FilterCheckboxProps) => {
  const disabled = count === 0 && !checked;

  return (
    <label
      htmlFor={id}
      className={`
        flex items-center gap-2.5 py-2.5 cursor-pointer transition-all min-h-[44px]
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-foreground'}
      `}
    >
      <input
        type="checkbox"
        id={`mobile-${id}`}
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`
          w-5 h-5 rounded flex-shrink-0 flex items-center justify-center
          border-2 transition-all
          ${checked 
            ? 'bg-primary border-primary' 
            : 'bg-transparent border-muted-foreground/30 hover:border-primary/50'
          }
        `}
      >
        {checked && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <span className="flex-1 text-[15px] font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-muted-foreground/60">
        ({count})
      </span>
    </label>
  );
};

interface FilterSectionProps {
  category: FilterCategory;
  activeValues: string[];
  counts: Record<string, number>;
  onToggle: (categoryId: string, value: string, checked: boolean) => void;
}

const FilterSection = ({ category, activeValues, counts, onToggle }: FilterSectionProps) => {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
        <span>{category.icon}</span>
        <span>{category.title}</span>
      </div>
      <div className="flex flex-col">
        {category.options.map(option => (
          <FilterCheckbox
            key={option.id}
            id={option.id}
            label={option.label}
            count={counts[option.value] || 0}
            checked={activeValues.includes(option.value)}
            onChange={(checked) => onToggle(category.id, option.value, checked)}
          />
        ))}
      </div>
    </div>
  );
};

interface MobileFilterPanelProps {
  filters: SlicerFilterState;
  counts: Record<string, Record<string, number>>;
  totalCount: number;
  filteredCount: number;
  onFilterChange: (categoryId: string, value: string, checked: boolean) => void;
  onClearAll: () => void;
}

export function MobileFilterPanel({
  filters,
  counts,
  totalCount,
  filteredCount,
  onFilterChange,
  onClearAll,
}: MobileFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeFilterCount = Object.values(filters).flat().length;

  return (
    <div className="lg:hidden w-full mb-6">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full h-14 px-5 bg-card/50 border border-border rounded-xl flex items-center justify-between transition-all hover:bg-card/80 hover:border-primary/30"
        aria-expanded={isExpanded}
        aria-controls="mobile-filter-content"
      >
        <div className="flex items-center gap-2.5">
          <Filter className="w-[18px] h-[18px] text-primary" />
          <span className="text-[15px] font-semibold text-foreground">Filters</span>
          {activeFilterCount > 0 && (
            <span className="text-[13px] font-medium text-muted-foreground">
              ({activeFilterCount} active)
            </span>
          )}
        </div>
        <div 
          className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {/* Expanded Content */}
      <div
        id="mobile-filter-content"
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${isExpanded ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'}
        `}
      >
        <div className="bg-card/50 border border-border rounded-xl p-5">
          {/* Result Count */}
          <div className="text-sm font-medium text-muted-foreground mb-4 pb-3 border-b border-border">
            Showing {filteredCount} of {totalCount} slicers
          </div>

          {/* Filter Sections */}
          {SLICER_FILTER_CATEGORIES.map(category => (
            <FilterSection
              key={category.id}
              category={category}
              activeValues={filters[category.id as keyof SlicerFilterState]}
              counts={counts[category.id] || {}}
              onToggle={onFilterChange}
            />
          ))}

          {/* Clear All Button */}
          <button
            onClick={onClearAll}
            disabled={activeFilterCount === 0}
            className={`
              w-full h-11 px-4 mt-4 rounded-lg text-sm font-semibold
              flex items-center justify-center gap-2
              border-[1.5px] transition-all
              ${activeFilterCount === 0
                ? 'opacity-50 cursor-not-allowed border-destructive/30 text-destructive/50'
                : 'border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50'
              }
            `}
            aria-label="Clear all active filters"
          >
            <X className="w-4 h-4" />
            <span>Clear All Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
