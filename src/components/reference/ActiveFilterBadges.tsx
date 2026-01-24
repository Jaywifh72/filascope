import { X } from 'lucide-react';
import { ActiveFilter } from '@/lib/slicerFilterUtils';

interface ActiveFilterBadgesProps {
  activeFilters: ActiveFilter[];
  onRemove: (categoryId: string, optionValue: string) => void;
}

export function ActiveFilterBadges({ activeFilters, onRemove }: ActiveFilterBadgesProps) {
  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {activeFilters.map(filter => (
        <div
          key={`${filter.categoryId}-${filter.optionValue}`}
          className="h-8 px-3 bg-primary/20 border border-primary rounded-md text-[13px] font-semibold text-primary inline-flex items-center gap-2 animate-filter-activate shadow-[0_0_8px_rgba(20,184,166,0.15)]"
        >
          <span>
            {filter.optionLabel}
          </span>
          <button
            onClick={() => onRemove(filter.categoryId, filter.optionValue)}
            className="hover:opacity-70 transition-opacity"
            aria-label={`Remove ${filter.optionLabel} filter`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
