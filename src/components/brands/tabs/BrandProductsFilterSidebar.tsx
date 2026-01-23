import { useState } from "react";
import { Filter, Layers, Tag, Palette, Scale, ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface FilterSection {
  id: string;
  title: string;
  icon: React.ElementType;
  options: { id: string; label: string; count: number }[];
}

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
    <div className="border-b border-gray-800 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 space-y-2">{children}</div>}
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
      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-800/50 cursor-pointer transition-colors group"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      {colorHex && (
        <div
          className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0"
          style={{ backgroundColor: colorHex }}
        />
      )}
      <span className="text-sm text-gray-300 group-hover:text-white flex-1 truncate">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-gray-500 tabular-nums">{count}</span>
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
  return (
    <aside className="w-72 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg border border-gray-800 bg-gray-900/60 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
              <Filter className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-gray-300">
              Filter Products
            </span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-7 px-2 text-xs text-gray-400 hover:text-white"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Material Type */}
      {materials.length > 0 && (
        <CollapsibleSection title="Material Type" icon={Layers} defaultOpen>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {materials.map((material) => (
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

      {/* Color */}
      {colors.length > 0 && (
        <CollapsibleSection title="Color" icon={Palette} defaultOpen={false}>
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {colors.slice(0, 20).map((color) => (
              <FilterCheckbox
                key={color.id}
                id={`color-${color.id}`}
                label={color.label}
                count={color.count}
                checked={selectedColors.includes(color.id)}
                onCheckedChange={(checked) => onColorChange(color.id, checked)}
                colorHex={color.hex}
              />
            ))}
            {colors.length > 20 && (
              <div className="text-xs text-gray-500 pt-2 pl-2">
                +{colors.length - 20} more colors
              </div>
            )}
          </div>
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
