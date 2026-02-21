import { useMemo, useState, useCallback } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SmartSearchChip } from "@/hooks/useSmartSearch";

/* ================================================================
 * 1) Legacy SearchSmartChips — used by Finder.tsx for expansion pills
 * ================================================================ */

interface LegacySearchSmartChipsProps {
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
}: LegacySearchSmartChipsProps) {
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

/* ================================================================
 * 2) Keyword-based SearchCategoryChips — shown below search input
 * ================================================================ */

interface ChipRule {
  label: string;
  keywords: string[];
  filterKey: string;
  filterValue: string;
}

const CHIP_RULES: ChipRule[] = [
  {
    label: "TPU/Flex",
    keywords: ["flexible", "tpu", "tpe", "flex", "shore"],
    filterKey: "material_type",
    filterValue: "TPU",
  },
  {
    label: "Carbon Fiber",
    keywords: ["carbon", "cf", "carbon fiber"],
    filterKey: "reinforcement",
    filterValue: "carbon",
  },
  {
    label: "Silk/Metallic",
    keywords: ["silk", "shiny", "metallic"],
    filterKey: "finish",
    filterValue: "silk",
  },
  {
    label: "High Speed",
    keywords: ["fast", "high speed", "hs", "rapid"],
    filterKey: "tag",
    filterValue: "high-speed",
  },
  {
    label: "Matte Finish",
    keywords: ["matte"],
    filterKey: "finish",
    filterValue: "matte",
  },
  {
    label: "Has TD Data",
    keywords: ["hueforge", "td", "transmissivity"],
    filterKey: "has_td_data",
    filterValue: "true",
  },
];

export interface ActiveChipFilter {
  filterKey: string;
  filterValue: string;
  label: string;
}

interface SearchCategoryChipsProps {
  query: string;
  activeFilters: ActiveChipFilter[];
  onToggle: (chip: ActiveChipFilter) => void;
  className?: string;
}

export function SearchCategoryChips({
  query,
  activeFilters,
  onToggle,
  className,
}: SearchCategoryChipsProps) {
  const queryLower = query.toLowerCase().trim();

  const matchedChips = useMemo(() => {
    if (queryLower.length < 2) return [];
    return CHIP_RULES.filter((rule) =>
      rule.keywords.some((kw) => queryLower.includes(kw))
    );
  }, [queryLower]);

  const isActive = useCallback(
    (rule: ChipRule) =>
      activeFilters.some(
        (f) => f.filterKey === rule.filterKey && f.filterValue === rule.filterValue
      ),
    [activeFilters]
  );

  if (matchedChips.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 transition-opacity duration-200",
        matchedChips.length > 0 ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {matchedChips.map((chip) => {
        const active = isActive(chip);
        return (
          <button
            key={chip.label}
            type="button"
            onClick={() =>
              onToggle({
                filterKey: chip.filterKey,
                filterValue: chip.filterValue,
                label: chip.label,
              })
            }
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border cursor-pointer transition-colors duration-150",
              active
                ? "bg-amber-500 text-black border-amber-500"
                : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
            )}
          >
            <Check className="w-3 h-3" />
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Hook to manage category chip filter state.
 */
export function useSmartChipFilters() {
  const [activeFilters, setActiveFilters] = useState<ActiveChipFilter[]>([]);

  const toggle = useCallback((chip: ActiveChipFilter) => {
    setActiveFilters((prev) => {
      const exists = prev.some(
        (f) => f.filterKey === chip.filterKey && f.filterValue === chip.filterValue
      );
      if (exists) {
        return prev.filter(
          (f) => !(f.filterKey === chip.filterKey && f.filterValue === chip.filterValue)
        );
      }
      return [...prev, chip];
    });
  }, []);

  const clear = useCallback(() => setActiveFilters([]), []);

  return { activeFilters, toggle, clear };
}
