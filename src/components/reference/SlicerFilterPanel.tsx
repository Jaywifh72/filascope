import { Filter, Check, X } from 'lucide-react';
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
        flex items-center gap-2.5 py-1.5 cursor-pointer transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-foreground'}
      `}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`
          w-[18px] h-[18px] rounded flex-shrink-0 flex items-center justify-center
          border-2 transition-all
          ${checked 
            ? 'bg-primary border-primary' 
            : 'bg-transparent border-muted-foreground/30 hover:border-primary/50'
          }
        `}
      >
        {checked && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <span className="flex-1 text-sm font-medium text-muted-foreground transition-colors">
        {label}
      </span>
      <span className="text-[13px] font-medium text-muted-foreground/60">
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-sm font-medium text-white">
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

interface SlicerFilterPanelProps {
  filters: SlicerFilterState;
  counts: Record<string, Record<string, number>>;
  totalCount: number;
  filteredCount: number;
  onFilterChange: (categoryId: string, value: string, checked: boolean) => void;
  onClearAll: () => void;
}

export function SlicerFilterPanel({
  filters,
  counts,
  totalCount,
  filteredCount,
  onFilterChange,
  onClearAll,
}: SlicerFilterPanelProps) {
  const activeFilterCount = Object.values(filters).flat().length;

  return (
    <aside 
      className="w-60 hidden lg:block sticky top-5"
      role="complementary"
      aria-label="Filter slicers by criteria"
    >
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-5 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 pb-4 border-b border-gray-700">
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filter Slicers</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredCount} of {totalCount} slicers
          </div>
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
            w-full py-2 text-sm font-medium transition-colors
            ${activeFilterCount === 0
              ? 'opacity-50 cursor-not-allowed text-primary/50'
              : 'text-primary hover:text-primary/80'
            }
          `}
          aria-label="Clear all active filters"
        >
          Clear All Filters
        </button>
      </div>
    </aside>
  );
}
