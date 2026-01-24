import { X, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ActiveFilter {
  id: string;
  label: string;
  type: 'material' | 'brand' | 'reinforced' | 'spool' | 'printer';
}

interface MobileActiveFilterChipsProps {
  filters: ActiveFilter[];
  onRemove: (id: string, type: ActiveFilter['type']) => void;
  onClearAll: () => void;
  selectedPrinterName?: string | null;
  onChangePrinter?: () => void;
  className?: string;
}

export function MobileActiveFilterChips({
  filters,
  onRemove,
  onClearAll,
  selectedPrinterName,
  onChangePrinter,
  className,
}: MobileActiveFilterChipsProps) {
  const hasFilters = filters.length > 0 || selectedPrinterName;

  if (!hasFilters) return null;

  return (
    <div className={cn("lg:hidden", className)}>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center gap-2 px-4 py-2">
          {/* Your Printer Quick Select */}
          {selectedPrinterName && (
            <button
              onClick={onChangePrinter}
              className="flex-shrink-0 flex items-center gap-2 h-9 px-3 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium min-w-[44px] hover:bg-primary/20 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="max-w-[120px] truncate">{selectedPrinterName}</span>
              <span className="text-xs text-primary/70">Change</span>
            </button>
          )}

          {/* Active filter chips */}
          {filters.map((filter) => (
            <button
              key={`${filter.type}-${filter.id}`}
              onClick={() => onRemove(filter.id, filter.type)}
              className="flex-shrink-0 flex items-center gap-1.5 h-9 pl-3 pr-2 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm min-w-[44px] hover:border-destructive/50 hover:text-destructive transition-colors group"
            >
              <span>{filter.label}</span>
              <X className="h-3.5 w-3.5 text-gray-500 group-hover:text-destructive" />
            </button>
          ))}

          {/* Clear all button */}
          {filters.length > 1 && (
            <button
              onClick={onClearAll}
              className="flex-shrink-0 h-9 px-3 text-sm text-destructive/80 hover:text-destructive transition-colors min-w-[44px]"
            >
              Clear All
            </button>
          )}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
}
