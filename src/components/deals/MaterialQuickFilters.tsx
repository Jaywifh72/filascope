import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupedDeal } from "@/lib/groupDealsByProduct";

interface MaterialQuickFiltersProps {
  groupedDeals: GroupedDeal[];
  selectedMaterials: string[];
  onMaterialChange: (materials: string[]) => void;
  className?: string;
}

const VISIBLE_COUNT_DESKTOP = 8;
const VISIBLE_COUNT_MOBILE = 4;

export function MaterialQuickFilters({
  groupedDeals,
  selectedMaterials,
  onMaterialChange,
  className,
}: MaterialQuickFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const materialCounts = useMemo(() => {
    const counts = new Map<string, number>();
    groupedDeals.forEach((group) => {
      const mat = group.representativeDeal.material;
      if (mat) counts.set(mat, (counts.get(mat) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([material, count]) => ({ material, count }));
  }, [groupedDeals]);

  if (materialCounts.length === 0) return null;

  const toggle = (material: string) => {
    if (selectedMaterials.includes(material)) {
      onMaterialChange(selectedMaterials.filter((m) => m !== material));
    } else {
      onMaterialChange([...selectedMaterials, material]);
    }
  };

  const desktopVisible = expanded ? materialCounts : materialCounts.slice(0, VISIBLE_COUNT_DESKTOP);
  const mobileVisible = expanded ? materialCounts : materialCounts.slice(0, VISIBLE_COUNT_MOBILE);
  const hiddenDesktop = materialCounts.length - VISIBLE_COUNT_DESKTOP;
  const hiddenMobile = materialCounts.length - VISIBLE_COUNT_MOBILE;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-border/30", className)}>
      <span className="text-[10px] text-muted-foreground mr-1 uppercase tracking-wide hidden md:inline">
        Material:
      </span>

      {/* Desktop chips */}
      {desktopVisible.map(({ material, count }) => (
        <button
          key={material}
          onClick={() => toggle(material)}
          className={cn(
            "hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium transition-all duration-150 border",
            selectedMaterials.includes(material)
              ? "bg-primary/15 border-primary/40 text-primary"
              : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          {material} ({count})
          {selectedMaterials.includes(material) && (
            <X className="inline h-2.5 w-2.5 ml-1" />
          )}
        </button>
      ))}

      {/* Mobile chips */}
      {mobileVisible.map(({ material, count }) => (
        <button
          key={`m-${material}`}
          onClick={() => toggle(material)}
          className={cn(
            "md:hidden inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium transition-all duration-150 border",
            selectedMaterials.includes(material)
              ? "bg-primary/15 border-primary/40 text-primary"
              : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          {material} ({count})
          {selectedMaterials.includes(material) && (
            <X className="inline h-2.5 w-2.5 ml-1" />
          )}
        </button>
      ))}

      {/* Expand button */}
      {!expanded && (
        <>
          {hiddenDesktop > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="hidden md:inline-flex text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              +{hiddenDesktop} more
            </button>
          )}
          {hiddenMobile > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="md:hidden text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              +{hiddenMobile} more
            </button>
          )}
        </>
      )}
      {expanded && materialCounts.length > VISIBLE_COUNT_MOBILE && (
        <button
          onClick={() => setExpanded(false)}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
}
