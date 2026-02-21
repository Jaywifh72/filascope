import { X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SmartSearchChip } from "@/hooks/useSmartSearch";

interface SearchSmartChipsProps {
  chips: SmartSearchChip[];
  expandedQuery: string | null;
  originalQuery: string;
  onRemoveChip: (chipId: string) => void;
  className?: string;
}

export function SearchSmartChips({
  chips,
  expandedQuery,
  originalQuery,
  onRemoveChip,
  className,
}: SearchSmartChipsProps) {
  const showExpansionPill = expandedQuery && expandedQuery !== originalQuery;

  if (chips.length === 0 && !showExpansionPill) return null;

  return (
    <div className={cn("bg-muted/30 border-b border-border relative z-10", className)}>
      <div className="max-w-[1800px] mx-auto px-4 lg:px-6 min-h-10 py-2 flex items-center gap-3 flex-wrap">
        {showExpansionPill && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary">
            <Sparkles className="w-3 h-3" />
            <span>Smart search expanded your query</span>
          </div>
        )}

        {chips.map((chip) => (
          <Badge
            key={chip.id}
            variant="outline"
            className={cn(
              "border-primary/50 bg-primary/10 text-foreground px-3 py-1 h-7 gap-1.5 shrink-0",
              "transition-all duration-150 hover:bg-primary/20",
              chip.removable && "cursor-pointer hover:scale-105"
            )}
            onClick={() => chip.removable && onRemoveChip(chip.id)}
          >
            {chip.label}
            {chip.removable && <X className="h-3 w-3" />}
          </Badge>
        ))}
      </div>
    </div>
  );
}
