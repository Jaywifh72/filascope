import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ActiveFilter {
  id: string;
  label: string;
  type: 'material' | 'brand' | 'price' | 'property' | 'color';
}

interface ActiveFilterTagsProps {
  filters: ActiveFilter[];
  onRemove: (filterId: string, type: ActiveFilter['type']) => void;
  onClearAll: () => void;
}

export function ActiveFilterTags({ filters, onRemove, onClearAll }: ActiveFilterTagsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="bg-muted/30 border-b border-border">
      <div className="max-w-[1800px] mx-auto px-4 lg:px-6 h-12 flex items-center gap-3">
        <span className="text-sm text-muted-foreground shrink-0">Active Filters:</span>
        <div className="flex flex-wrap items-center gap-2 flex-1 overflow-x-auto">
          {filters.map((filter) => (
            <Badge
              key={`${filter.type}-${filter.id}`}
              variant="outline"
              className="border-primary/50 bg-primary/10 text-foreground px-3 py-1 h-7 gap-1.5 cursor-pointer hover:bg-primary/20 transition-colors shrink-0"
              onClick={() => onRemove(filter.id, filter.type)}
            >
              {filter.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-muted-foreground hover:text-foreground shrink-0 h-7"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}
