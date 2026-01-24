import { useState } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Z_INDEX } from "@/lib/z-index";

interface MobileDealsFilterSheetProps {
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
  resultCount: number;
}

const DISCOUNT_OPTIONS = [
  { label: "Any discount", value: 0 },
  { label: "10%+ off", value: 10 },
  { label: "25%+ off", value: 25 },
  { label: "50%+ off", value: 50 },
];

export function MobileDealsFilterSheet({
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
  resultCount,
}: MobileDealsFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(true);
  const [brandOpen, setBrandOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 min-h-[44px] w-full md:hidden"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-primary/20 text-primary">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-2xl px-0"
        style={{ zIndex: Z_INDEX.sheet }}
      >
        <SheetHeader className="px-4 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Filter Deals</SheetTitle>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="h-4 w-4" />
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ paddingBottom: '120px' }}>
          {/* Material Filter */}
          <Collapsible open={materialOpen} onOpenChange={setMaterialOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left min-h-[48px] touch-manipulation">
              <div className="flex items-center gap-2">
                <span className="font-medium">Material</span>
                {selectedMaterials.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {selectedMaterials.length}
                  </Badge>
                )}
              </div>
              {materialOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pb-4">
              {materials.map((material) => (
                <label
                  key={material}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer min-h-[44px] touch-manipulation"
                >
                  <Checkbox
                    checked={selectedMaterials.includes(material)}
                    onCheckedChange={() => toggleMaterial(material)}
                    className="h-5 w-5"
                  />
                  <span className="text-sm">{material}</span>
                </label>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Brand Filter */}
          <Collapsible open={brandOpen} onOpenChange={setBrandOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left border-t border-border min-h-[48px] touch-manipulation">
              <div className="flex items-center gap-2">
                <span className="font-medium">Brand</span>
                {selectedBrands.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {selectedBrands.length}
                  </Badge>
                )}
              </div>
              {brandOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pb-4">
              {brands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer min-h-[44px] touch-manipulation"
                >
                  <Checkbox
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={() => toggleBrand(brand)}
                    className="h-5 w-5"
                  />
                  <span className="text-sm">{brand}</span>
                </label>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Discount Filter */}
          <Collapsible open={discountOpen} onOpenChange={setDiscountOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left border-t border-border min-h-[48px] touch-manipulation">
              <div className="flex items-center gap-2">
                <span className="font-medium">Minimum Discount</span>
                {minDiscount > 0 && (
                  <Badge className="h-5 px-1.5 text-xs bg-green-500/20 text-green-400 border-green-500/30">
                    {minDiscount}%+
                  </Badge>
                )}
              </div>
              {discountOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pb-4">
              {DISCOUNT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onDiscountChange(option.value)}
                  className={`flex items-center justify-between w-full py-2.5 px-3 rounded-lg min-h-[44px] touch-manipulation transition-colors ${
                    minDiscount === option.value
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <span className="text-sm">{option.label}</span>
                  {minDiscount === option.value && (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Price Range Filter */}
          <Collapsible open={priceOpen} onOpenChange={setPriceOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left border-t border-border min-h-[48px] touch-manipulation">
              <div className="flex items-center gap-2">
                <span className="font-medium">Price Range</span>
                {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    ${priceRange[0]}-${priceRange[1]}
                  </Badge>
                )}
              </div>
              {priceOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-4 pt-2">
              <div className="px-3 space-y-4">
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
            </CollapsibleContent>
          </Collapsible>
        </div>

        <SheetFooter 
          className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <Button 
            onClick={() => setOpen(false)} 
            className="w-full h-12 min-h-[48px] touch-manipulation font-semibold"
          >
            Show {resultCount} {resultCount === 1 ? 'Deal' : 'Deals'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
