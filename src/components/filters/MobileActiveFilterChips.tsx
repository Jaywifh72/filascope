import { useState, useCallback } from "react";
import { X, Printer, Pencil } from "lucide-react";
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
  onEdit?: () => void;
  className?: string;
}

export function MobileActiveFilterChips({
  filters,
  onRemove,
  onClearAll,
  selectedPrinterName,
  onChangePrinter,
  onEdit,
  className,
}: MobileActiveFilterChipsProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const hasFilters = filters.length > 0 || selectedPrinterName;

  const handleRemove = useCallback((id: string, type: ActiveFilter['type']) => {
    setRemovingId(`${type}-${id}`);
    setTimeout(() => {
      onRemove(id, type);
      setRemovingId(null);
    }, 150);
  }, [onRemove]);

  if (!hasFilters) return null;

  return (
    <div className={cn("lg:hidden relative", className)}>
      {/* Fade gradients */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10" />
      
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center gap-2.5 px-4 py-2">
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
          {filters.map((filter) => {
            const chipKey = `${filter.type}-${filter.id}`;
            const isRemoving = removingId === chipKey;
            return (
              <button
                key={chipKey}
                onClick={() => handleRemove(filter.id, filter.type)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 h-9 pl-3 pr-2 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm min-w-[44px] hover:border-destructive/50 hover:text-destructive transition-all duration-150 group",
                  isRemoving && "scale-95 opacity-0"
                )}
              >
                <span>{filter.label}</span>
                <X className="h-3.5 w-3.5 text-gray-500 group-hover:text-destructive" />
              </button>
            );
          })}

          {/* Clear all button */}
          {filters.length > 1 && (
            <button
              onClick={onClearAll}
              className="flex-shrink-0 h-9 px-3 text-sm text-destructive/80 hover:text-destructive transition-colors min-w-[44px]"
            >
              Clear All
            </button>
          )}

          {/* Edit button to re-open filter sheet */}
          {onEdit && filters.length > 0 && (
            <button
              onClick={onEdit}
              className="flex-shrink-0 flex items-center gap-1 h-9 px-3 rounded-full text-sm text-primary/70 hover:text-primary transition-colors min-w-[44px]"
            >
              <Pencil className="h-3 w-3" />
              <span>Edit</span>
            </button>
          )}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
}
