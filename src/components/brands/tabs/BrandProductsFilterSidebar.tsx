import { useState } from "react";
import { Filter, Layers, Tag, Palette, Scale, ChevronDown, ChevronRight, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PriceRange {
  id: string;
  label: string;
  min: number | null;
  max: number | null;
}

const PRICE_RANGES: PriceRange[] = [
  { id: "under-25", label: "Under $25", min: null, max: 25 },
  { id: "25-35", label: "$25 - $35", min: 25, max: 35 },
  { id: "35-50", label: "$35 - $50", min: 35, max: 50 },
  { id: "over-50", label: "$50+", min: 50, max: null },
];

const SPOOL_SIZES = [
  { id: "250g", label: "250g", weightMin: 200, weightMax: 300 },
  { id: "500g", label: "500g", weightMin: 400, weightMax: 600 },
  { id: "1kg", label: "1kg", weightMin: 900, weightMax: 1100 },
  { id: "3kg", label: "3kg", weightMin: 2500, weightMax: 3500 },
];

interface BrandProductsFilterSidebarProps {
  materials: { id: string; label: string; count: number }[];
  colors: { id: string; label: string; hex: string | null; count: number }[];
  selectedMaterials: string[];
  selectedPriceRanges: string[];
  selectedColors: string[];
  selectedSpoolSizes: string[];
  onMaterialChange: (material: string, checked: boolean) => void;
  onPriceRangeChange: (priceRange: string, checked: boolean) => void;
  onColorChange: (color: string, checked: boolean) => void;
  onSpoolSizeChange: (size: string, checked: boolean) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FilterCheckbox({
  id,
  label,
  count,
  checked,
  onCheckedChange,
  colorHex,
}: {
  id: string;
  label: string;
  count?: number;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  colorHex?: string | null;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/30 cursor-pointer transition-colors group"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      {colorHex && (
        <div
          className="w-4 h-4 rounded-full border border-border flex-shrink-0"
          style={{ backgroundColor: colorHex }}
          role="img"
          aria-label={label}
        />
      )}
      <span className="text-sm text-muted-foreground group-hover:text-foreground flex-1 truncate">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground/60 tabular-nums">{count}</span>
      )}
    </label>
  );
}

export function BrandProductsFilterSidebar({
  materials,
  colors,
  selectedMaterials,
  selectedPriceRanges,
  selectedColors,
  selectedSpoolSizes,
  onMaterialChange,
  onPriceRangeChange,
  onColorChange,
  onSpoolSizeChange,
  onClearAll,
  hasActiveFilters,
}: BrandProductsFilterSidebarProps) {
  const [materialSearch, setMaterialSearch] = useState("");

  const filteredMaterials = materialSearch
    ? materials.filter(m => m.label.toLowerCase().includes(materialSearch.toLowerCase()))
    : materials;

  return (
    <aside className="w-72 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg border border-border bg-card/60 backdrop-blur-sm max-lg:w-full max-lg:sticky-none max-lg:border-0 max-lg:bg-transparent max-lg:backdrop-blur-none max-lg:max-h-none">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
              <Filter className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground">
              Filter Products
            </span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Material Type with search */}
      {materials.length > 0 && (
        <CollapsibleSection title="Material Type" icon={Layers} defaultOpen>
          {materials.length > 8 && (
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search materials..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          )}
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {filteredMaterials.map((material) => (
              <FilterCheckbox
                key={material.id}
                id={`material-${material.id}`}
                label={material.label}
                count={material.count}
                checked={selectedMaterials.includes(material.id)}
                onCheckedChange={(checked) =>
                  onMaterialChange(material.id, checked)
                }
              />
            ))}
            {filteredMaterials.length === 0 && (
              <p className="text-xs text-muted-foreground py-2 pl-2">No materials match "{materialSearch}"</p>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Price Range */}
      <CollapsibleSection title="Price Range" icon={Tag} defaultOpen>
        <div className="space-y-0.5">
          {PRICE_RANGES.map((range) => (
            <FilterCheckbox
              key={range.id}
              id={`price-${range.id}`}
              label={range.label}
              checked={selectedPriceRanges.includes(range.id)}
              onCheckedChange={(checked) =>
                onPriceRangeChange(range.id, checked)
              }
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Color — swatch grid */}
      {colors.length > 0 && (
        <CollapsibleSection title="Color" icon={Palette} defaultOpen={false}>
          <TooltipProvider delayDuration={150}>
            <div className="grid grid-cols-6 gap-2">
              {colors.slice(0, 30).map((color) => {
                const isSelected = selectedColors.includes(color.id);
                return (
                  <Tooltip key={color.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onColorChange(color.id, !isSelected)}
                        className={cn(
                          "w-6 h-6 rounded-full border transition-all duration-200 cursor-pointer",
                          isSelected
                            ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-background border-cyan-400"
                            : "border-border hover:scale-110"
                        )}
                        style={{ backgroundColor: color.hex || '#888' }}
                        role="img"
                        aria-label={color.label}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {color.label} ({color.count})
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            {colors.length > 30 && (
              <p className="text-xs text-muted-foreground mt-2">+{colors.length - 30} more colors</p>
            )}
          </TooltipProvider>
        </CollapsibleSection>
      )}

      {/* Spool Size */}
      <CollapsibleSection title="Spool Size" icon={Scale} defaultOpen={false}>
        <div className="space-y-0.5">
          {SPOOL_SIZES.map((size) => (
            <FilterCheckbox
              key={size.id}
              id={`size-${size.id}`}
              label={size.label}
              checked={selectedSpoolSizes.includes(size.id)}
              onCheckedChange={(checked) => onSpoolSizeChange(size.id, checked)}
            />
          ))}
        </div>
      </CollapsibleSection>
    </aside>
  );
}

export { PRICE_RANGES, SPOOL_SIZES };
