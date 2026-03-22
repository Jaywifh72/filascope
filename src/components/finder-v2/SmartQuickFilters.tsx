import { cn } from '@/lib/utils';

interface QuickFilter {
  label: string;
  key: string;
}

const MATERIAL_FILTERS: Record<string, QuickFilter[]> = {
  PLA: [
    { label: 'All PLA', key: 'all' },
    { label: 'Best Deals', key: 'deals' },
    { label: 'Silk/Shimmer', key: 'silk' },
    { label: 'Matte', key: 'matte' },
    { label: 'High Speed', key: 'high_speed' },
    { label: 'HueForge Ready', key: 'hueforge' },
  ],
  PETG: [
    { label: 'All PETG', key: 'all' },
    { label: 'Best Deals', key: 'deals' },
    { label: 'Carbon Fiber', key: 'carbon_fiber' },
    { label: 'High Speed', key: 'high_speed' },
    { label: 'HueForge Ready', key: 'hueforge' },
  ],
  TPU: [
    { label: 'All TPU', key: 'all' },
    { label: 'Best Deals', key: 'deals' },
  ],
  ABS: [
    { label: 'All ABS', key: 'all' },
    { label: 'Best Deals', key: 'deals' },
    { label: 'High Temp', key: 'high_temp' },
  ],
  ASA: [
    { label: 'All ASA', key: 'all' },
    { label: 'Best Deals', key: 'deals' },
    { label: 'High Temp', key: 'high_temp' },
  ],
};

const DEFAULT_FILTERS: QuickFilter[] = [
  { label: 'Popular', key: 'all' },
  { label: 'Best Deals', key: 'deals' },
  { label: 'HueForge Ready', key: 'hueforge' },
  { label: 'High Speed', key: 'high_speed' },
  { label: 'Silk/Shimmer', key: 'silk' },
];

interface SmartQuickFiltersProps {
  selectedMaterial: string | null;
  activeFilter: string;
  onFilterChange: (key: string) => void;
  userRegion?: string;
}

export function SmartQuickFilters({ selectedMaterial, activeFilter, onFilterChange, userRegion }: SmartQuickFiltersProps) {
  const materialKey = selectedMaterial?.toUpperCase() ?? '';
  const filters = MATERIAL_FILTERS[materialKey] ?? DEFAULT_FILTERS;

  const allFilters = userRegion
    ? [...filters, { label: `Ships to ${userRegion}`, key: 'regional' }]
    : filters;

  return (
    <div className="flex flex-wrap gap-2 px-6 pb-4 md:px-8">
      {allFilters.map(f => (
        <button
          key={f.key}
          onClick={() => onFilterChange(f.key)}
          className={cn(
            'rounded-full border px-4 py-1.5 text-xs font-medium transition-colors',
            activeFilter === f.key
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
