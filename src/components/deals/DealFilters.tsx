import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface DealFiltersProps {
  materials: string[];
  brands: string[];
  selectedMaterials: string[];
  selectedBrands: string[];
  minDiscount: number;
  priceRange: [number, number];
  maxPrice: number;
  onMaterialChange: (materials: string[]) => void;
  onBrandChange: (brands: string[]) => void;
  onDiscountChange: (min: number) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onClearAll: () => void;
}

const DISCOUNT_OPTIONS = [
  { label: "Any discount", value: 0 },
  { label: "10%+ off", value: 10 },
  { label: "25%+ off", value: 25 },
  { label: "50%+ off", value: 50 },
];

export function DealFilters({
  materials,
  brands,
  selectedMaterials,
  selectedBrands,
  minDiscount,
  priceRange,
  maxPrice,
  onMaterialChange,
  onBrandChange,
  onDiscountChange,
  onPriceRangeChange,
  onClearAll,
}: DealFiltersProps) {
  const [priceOpen, setPriceOpen] = useState(false);
  
  const activeFilterCount =
    selectedMaterials.length +
    selectedBrands.length +
    (minDiscount > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

  const toggleMaterial = (material: string) => {
    if (selectedMaterials.includes(material)) {
      onMaterialChange(selectedMaterials.filter((m) => m !== material));
    } else {
      onMaterialChange([...selectedMaterials, material]);
    }
  };

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandChange(selectedBrands.filter((b) => b !== brand));
    } else {
      onBrandChange([...selectedBrands, brand]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Materials Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 min-h-[44px]",
              selectedMaterials.length > 0 && "border-primary bg-primary/10"
            )}
          >
            Material
            {selectedMaterials.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {selectedMaterials.length}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
          <DropdownMenuLabel>Filter by material</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {materials.map((material) => (
            <DropdownMenuCheckboxItem
              key={material}
              checked={selectedMaterials.includes(material)}
              onCheckedChange={() => toggleMaterial(material)}
            >
              {material}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Brands Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 min-h-[44px]",
              selectedBrands.length > 0 && "border-primary bg-primary/10"
            )}
          >
            Brand
            {selectedBrands.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {selectedBrands.length}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
          <DropdownMenuLabel>Filter by brand</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {brands.map((brand) => (
            <DropdownMenuCheckboxItem
              key={brand}
              checked={selectedBrands.includes(brand)}
              onCheckedChange={() => toggleBrand(brand)}
            >
              {brand}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Discount Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 min-h-[44px]",
              minDiscount > 0 && "border-green-500 bg-green-500/10"
            )}
          >
            Discount
            {minDiscount > 0 && (
              <Badge className="ml-1 h-5 px-1.5 text-xs bg-green-500/20 text-green-400 border-green-500/30">
                {minDiscount}%+
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Minimum discount</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DISCOUNT_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={minDiscount === option.value}
              onCheckedChange={() => onDiscountChange(option.value)}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Price Range Filter */}
      <DropdownMenu open={priceOpen} onOpenChange={setPriceOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 min-h-[44px]",
              (priceRange[0] > 0 || priceRange[1] < maxPrice) && "border-primary bg-primary/10"
            )}
          >
            Price
            {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                ${priceRange[0]}-${priceRange[1]}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Price range</span>
              <span className="font-medium">${priceRange[0]} - ${priceRange[1]}</span>
            </div>
            <Slider
              min={0}
              max={maxPrice}
              step={5}
              value={[priceRange[0], priceRange[1]]}
              onValueChange={(value) => onPriceRangeChange([value[0], value[1]])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>${maxPrice}</span>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="gap-1.5 text-muted-foreground hover:text-foreground min-h-[44px]"
        >
          <X className="h-4 w-4" />
          Clear all ({activeFilterCount})
        </Button>
      )}
    </div>
  );
}
