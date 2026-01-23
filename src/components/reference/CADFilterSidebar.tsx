import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCADFilters } from '@/contexts/CADFilterContext';

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface FilterCategory {
  id: 'price' | 'level' | 'platform';
  title: string;
  icon: string;
  options: FilterOption[];
}

const CAD_FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: 'price',
    title: 'Price',
    icon: '💰',
    options: [
      { id: 'price-all', label: 'All', value: 'all' },
      { id: 'price-free', label: 'Free', value: 'free' },
      { id: 'price-freemium', label: 'Freemium', value: 'freemium' },
      { id: 'price-paid', label: 'Paid', value: 'paid' },
    ]
  },
  {
    id: 'level',
    title: 'Level',
    icon: '🎓',
    options: [
      { id: 'level-all', label: 'All', value: 'all' },
      { id: 'level-beginner', label: 'Beginner', value: 'beginner' },
      { id: 'level-intermediate', label: 'Intermediate', value: 'intermediate' },
      { id: 'level-advanced', label: 'Advanced', value: 'advanced' },
    ]
  },
  {
    id: 'platform',
    title: 'Platform',
    icon: '🖥️',
    options: [
      { id: 'platform-all', label: 'All', value: 'all' },
      { id: 'platform-windows', label: 'Windows', value: 'windows' },
      { id: 'platform-mac', label: 'Mac', value: 'mac' },
      { id: 'platform-linux', label: 'Linux', value: 'linux' },
      { id: 'platform-browser', label: 'Browser', value: 'browser' },
      { id: 'platform-mobile', label: 'Mobile', value: 'mobile' },
    ]
  }
];

interface FilterCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const FilterCheckbox = ({ id, label, checked, onChange }: FilterCheckboxProps) => (
  <label
    htmlFor={id}
    className={cn(
      "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
      checked ? "bg-primary/10" : "hover:bg-white/5"
    )}
  >
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />
    <div className={cn(
      "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
      checked 
        ? "border-primary bg-primary" 
        : "border-gray-500 bg-transparent"
    )}>
      {checked && (
        <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 12 12" fill="none">
          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
    <span className={cn(
      "text-sm transition-colors",
      checked ? "text-white font-medium" : "text-muted-foreground"
    )}>
      {label}
    </span>
  </label>
);

interface FilterSectionProps {
  category: FilterCategory;
  activeValues: string[];
  onToggle: (categoryId: 'price' | 'level' | 'platform', value: string) => void;
}

const FilterSection = ({ category, activeValues, onToggle }: FilterSectionProps) => (
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
          checked={activeValues.includes(option.value)}
          onChange={() => onToggle(category.id, option.value)}
        />
      ))}
    </div>
  </div>
);

export function CADFilterSidebar() {
  const { 
    filters, 
    toggleFilter, 
    clearFilters, 
    hasActiveFilters, 
    filteredCount, 
    totalCount 
  } = useCADFilters();

  return (
    <aside 
      className="w-60 hidden lg:block"
      role="complementary"
      aria-label="Filter CAD software by criteria"
    >
      <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-5 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 pb-4 border-b border-gray-700">
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filter Software</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredCount} of {totalCount} software
          </div>
        </div>

        {/* Filter Sections */}
        {CAD_FILTER_CATEGORIES.map(category => (
          <FilterSection
            key={category.id}
            category={category}
            activeValues={filters[category.id]}
            onToggle={toggleFilter}
          />
        ))}

        {/* Clear All Button */}
        <button
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className={cn(
            "w-full py-2 text-sm font-medium transition-colors",
            hasActiveFilters
              ? "text-primary hover:text-primary/80"
              : "opacity-50 cursor-not-allowed text-primary/50"
          )}
          aria-label="Clear all active filters"
        >
          Clear All Filters
        </button>
      </div>
    </aside>
  );
}

export default CADFilterSidebar;
