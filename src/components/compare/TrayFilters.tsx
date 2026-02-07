import { useState } from "react";
import { Filter, Check, ArrowUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { computePricePerKg } from "@/lib/resolveFilamentPrice";
import { CompareItem } from "@/hooks/useCompare";

export type TrayFilter = 'food-safe' | 'heat-resistant' | 'non-abrasive';
export type TraySortOption = 'recent' | 'price-low' | 'price-high' | 'material';

interface TrayFiltersProps {
  items: CompareItem[];
  activeFilters: TrayFilter[];
  onFiltersChange: (filters: TrayFilter[]) => void;
  sortOption: TraySortOption;
  onSortChange: (sort: TraySortOption) => void;
}

const FILTER_OPTIONS: { value: TrayFilter; label: string; description: string }[] = [
  { value: 'food-safe', label: 'Food-safe', description: 'FDA approved materials' },
  { value: 'heat-resistant', label: 'Heat resistant', description: 'Tg > 80°C' },
  { value: 'non-abrasive', label: 'Non-abrasive', description: 'Brass nozzle safe' },
];

const SORT_OPTIONS: { value: TraySortOption; label: string }[] = [
  { value: 'recent', label: 'Recently added' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'material', label: 'Material type' },
];

export function TrayFilters({
  items,
  activeFilters,
  onFiltersChange,
  sortOption,
  onSortChange,
}: TrayFiltersProps) {
  const [open, setOpen] = useState(false);

  const toggleFilter = (filter: TrayFilter) => {
    if (activeFilters.includes(filter)) {
      onFiltersChange(activeFilters.filter(f => f !== filter));
    } else {
      onFiltersChange([...activeFilters, filter]);
    }
  };

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-8 gap-2",
            hasActiveFilters && "bg-primary/10 text-primary"
          )}
        >
          <Filter className="w-4 h-4" />
          Filter
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {activeFilters.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        {/* Filters Section */}
        <div className="p-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Show only
          </Label>
          <div className="mt-2 space-y-1">
            {FILTER_OPTIONS.map((option) => {
              const isActive = activeFilters.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleFilter(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-md text-left transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  {isActive && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Sort Section */}
        <div className="p-3">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" />
            Sort by
          </Label>
          <div className="mt-2 space-y-1">
            {SORT_OPTIONS.map((option) => {
              const isActive = sortOption === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-md text-left text-sm transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-muted/50"
                  )}
                >
                  {option.label}
                  {isActive && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear Button */}
        {hasActiveFilters && (
          <>
            <Separator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={() => onFiltersChange([])}
              >
                Clear filters
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Helper function to filter items based on active filters
export function filterTrayItems(items: CompareItem[], filters: TrayFilter[]): string[] {
  if (filters.length === 0) return items.map(i => i.id);

  return items
    .filter(item => {
      // For now, we'll mark all items as passing since we don't have the full filament data
      // In a real implementation, this would check the actual filament properties
      return true;
    })
    .map(i => i.id);
}

// Helper function to sort items
export function sortTrayItems(items: CompareItem[], sortOption: TraySortOption): CompareItem[] {
  const sorted = [...items];
  
  switch (sortOption) {
    case 'price-low':
      return sorted.sort((a, b) => {
        const priceA = a.variant_price
          ? computePricePerKg(a.variant_price, a.net_weight_g, (a as any).pack_quantity) ?? Infinity
          : Infinity;
        const priceB = b.variant_price
          ? computePricePerKg(b.variant_price, b.net_weight_g, (b as any).pack_quantity) ?? Infinity
          : Infinity;
        return priceA - priceB;
      });
    case 'price-high':
      return sorted.sort((a, b) => {
        const priceA = a.variant_price
          ? computePricePerKg(a.variant_price, a.net_weight_g, (a as any).pack_quantity) ?? -Infinity
          : -Infinity;
        const priceB = b.variant_price
          ? computePricePerKg(b.variant_price, b.net_weight_g, (b as any).pack_quantity) ?? -Infinity
          : -Infinity;
        return priceB - priceA;
      });
    case 'material':
      return sorted.sort((a, b) => 
        (a.material || 'ZZZ').localeCompare(b.material || 'ZZZ')
      );
    case 'recent':
    default:
      return sorted; // Original order
  }
}
