import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, ArrowUpDown, X, ExternalLink, SearchX, GitCompareArrows, Filter, LayoutGrid, LayoutList } from "lucide-react";
import { useCompare } from "@/hooks/useCompare";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MaterialBadge } from "@/components/MaterialBadge";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { normalizeColorHex } from "@/lib/utils";
import { useRegion } from "@/contexts/RegionContext";
import { useRegionalStore } from "@/hooks/useRegionalStore";
import { BrandProductsFilterSidebar, PRICE_RANGES, SPOOL_SIZES } from "./BrandProductsFilterSidebar";
import type { Tables } from "@/integrations/supabase/types";

type Filament = Tables<"filaments">;

interface GroupedProduct {
  baseName: string;
  material: string | null;
  variants: Filament[];
  representativeImage: string | null;
  priceRange: { min: number | null; max: number | null };
  productUrl: string | null;
  categoryUrl: string | null;
}

type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "colors-desc" | "material";

interface BrandProductsTabProps {
  brandName: string;
  brandLogo: string | null;
  groupedProducts: GroupedProduct[];
  filaments: Filament[];
  initialMaterialFilter?: string | null;
  onMaterialFilterChange?: (material: string | null) => void;
}

export function BrandProductsTab({
  brandName,
  brandLogo,
  groupedProducts,
  filaments,
  initialMaterialFilter,
  onMaterialFilterChange,
}: BrandProductsTabProps) {
  const navigate = useNavigate();

  const { formatPrice } = useRegion();
  const { getRegionalUrl } = useRegionalStore();
  const { addItem, isInCompare, isFull } = useCompare();

  // View mode (persisted)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem('brand-products-view') as 'grid' | 'list') || 'grid'; } catch { return 'grid'; }
  });
  const setAndPersistView = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try { localStorage.setItem('brand-products-view', mode); } catch {}
  };

  // Mobile filter sheet
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter states
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(
    initialMaterialFilter ? [initialMaterialFilter] : []
  );
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSpoolSizes, setSelectedSpoolSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  // Compute available materials with counts
  const materialOptions = useMemo(() => {
    const materialCounts = new Map<string, number>();
    groupedProducts.forEach((product) => {
      if (product.material) {
        materialCounts.set(
          product.material,
          (materialCounts.get(product.material) || 0) + 1
        );
      }
    });
    return Array.from(materialCounts.entries())
      .map(([material, count]) => ({
        id: material,
        label: material,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [groupedProducts]);

  // Compute available colors with counts
  const colorOptions = useMemo(() => {
    const colorCounts = new Map<string, { count: number; hex: string | null }>();
    filaments.forEach((filament) => {
      const colorName = filament.color_family || "Unknown";
      const existing = colorCounts.get(colorName);
      if (existing) {
        existing.count++;
      } else {
        colorCounts.set(colorName, {
          count: 1,
          hex: filament.color_hex ? normalizeColorHex(filament.color_hex) : null,
        });
      }
    });
    return Array.from(colorCounts.entries())
      .map(([color, data]) => ({
        id: color,
        label: color,
        hex: data.hex,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filaments]);

  // Filter handlers
  const handleMaterialChange = (material: string, checked: boolean) => {
    setSelectedMaterials((prev) =>
      checked ? [...prev, material] : prev.filter((m) => m !== material)
    );
    onMaterialFilterChange?.(checked ? material : null);
  };

  const handlePriceRangeChange = (priceRange: string, checked: boolean) => {
    setSelectedPriceRanges((prev) =>
      checked ? [...prev, priceRange] : prev.filter((p) => p !== priceRange)
    );
  };

  const handleColorChange = (color: string, checked: boolean) => {
    setSelectedColors((prev) =>
      checked ? [...prev, color] : prev.filter((c) => c !== color)
    );
  };

  const handleSpoolSizeChange = (size: string, checked: boolean) => {
    setSelectedSpoolSizes((prev) =>
      checked ? [...prev, size] : prev.filter((s) => s !== size)
    );
  };

  const handleClearAll = () => {
    setSelectedMaterials([]);
    setSelectedPriceRanges([]);
    setSelectedColors([]);
    setSelectedSpoolSizes([]);
    onMaterialFilterChange?.(null);
  };

  const hasActiveFilters =
    selectedMaterials.length > 0 ||
    selectedPriceRanges.length > 0 ||
    selectedColors.length > 0 ||
    selectedSpoolSizes.length > 0;

  const activeFilterCount = selectedMaterials.length + selectedPriceRanges.length + selectedColors.length + selectedSpoolSizes.length;

  // Filter products
  const filteredProducts = useMemo(() => {
    return groupedProducts.filter((product) => {
      if (selectedMaterials.length > 0 && product.material) {
        if (!selectedMaterials.includes(product.material)) return false;
      }
      if (selectedPriceRanges.length > 0 && product.priceRange.min !== null) {
        const price = product.priceRange.min;
        const matchesPrice = selectedPriceRanges.some((rangeId) => {
          const range = PRICE_RANGES.find((r) => r.id === rangeId);
          if (!range) return false;
          return (range.min === null || price >= range.min) && (range.max === null || price < range.max);
        });
        if (!matchesPrice) return false;
      }
      if (selectedColors.length > 0) {
        const productColors = product.variants.map((v) => v.color_family).filter(Boolean);
        if (!selectedColors.some((c) => productColors.includes(c))) return false;
      }
      if (selectedSpoolSizes.length > 0) {
        const productWeights = product.variants.map((v) => v.net_weight_g).filter((w): w is number => w !== null);
        const hasMatchingSize = selectedSpoolSizes.some((sizeId) => {
          const size = SPOOL_SIZES.find((s) => s.id === sizeId);
          if (!size) return false;
          return productWeights.some((w) => w >= size.weightMin && w <= size.weightMax);
        });
        if (!hasMatchingSize) return false;
      }
      return true;
    });
  }, [groupedProducts, selectedMaterials, selectedPriceRanges, selectedColors, selectedSpoolSizes]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (sortBy) {
      case "name-asc": sorted.sort((a, b) => a.baseName.localeCompare(b.baseName)); break;
      case "name-desc": sorted.sort((a, b) => b.baseName.localeCompare(a.baseName)); break;
      case "price-asc": sorted.sort((a, b) => (a.priceRange.min ?? 999) - (b.priceRange.min ?? 999)); break;
      case "price-desc": sorted.sort((a, b) => (b.priceRange.min ?? 0) - (a.priceRange.min ?? 0)); break;
      case "colors-desc": sorted.sort((a, b) => b.variants.length - a.variants.length); break;
      case "material": sorted.sort((a, b) => (a.material || "").localeCompare(b.material || "")); break;
    }
    return sorted;
  }, [filteredProducts, sortBy]);

  // Active filter chips
  const activeFilters = useMemo(() => {
    const filters: { id: string; label: string; type: string }[] = [];
    selectedMaterials.forEach((m) => filters.push({ id: m, label: m, type: "material" }));
    selectedPriceRanges.forEach((p) => {
      const range = PRICE_RANGES.find((r) => r.id === p);
      if (range) filters.push({ id: p, label: range.label, type: "price" });
    });
    selectedColors.forEach((c) => filters.push({ id: c, label: c, type: "color" }));
    selectedSpoolSizes.forEach((s) => {
      const size = SPOOL_SIZES.find((sz) => sz.id === s);
      if (size) filters.push({ id: s, label: size.label, type: "size" });
    });
    return filters;
  }, [selectedMaterials, selectedPriceRanges, selectedColors, selectedSpoolSizes]);

  const removeFilter = (filter: { id: string; type: string }) => {
    switch (filter.type) {
      case "material": handleMaterialChange(filter.id, false); break;
      case "price": handlePriceRangeChange(filter.id, false); break;
      case "color": handleColorChange(filter.id, false); break;
      case "size": handleSpoolSizeChange(filter.id, false); break;
    }
  };

  const totalVariants = filaments.length;

  const filterSidebarProps = {
    materials: materialOptions,
    colors: colorOptions,
    selectedMaterials,
    selectedPriceRanges,
    selectedColors,
    selectedSpoolSizes,
    onMaterialChange: handleMaterialChange,
    onPriceRangeChange: handlePriceRangeChange,
    onColorChange: handleColorChange,
    onSpoolSizeChange: handleSpoolSizeChange,
    onClearAll: handleClearAll,
    hasActiveFilters,
  };

  if (groupedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
        <Package className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={1.5} />
        <h3 className="text-xl font-semibold text-foreground mb-2">No Products Yet</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {brandName}'s product catalog is being prepared. Check back soon!
        </p>
        <Button variant="outline" onClick={() => navigate('/brands')}>
          Browse Other Brands
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Filter Sidebar - Desktop */}
      <div className="hidden lg:block">
        <BrandProductsFilterSidebar {...filterSidebarProps} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Products Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {hasActiveFilters ? (
                <>
                  Showing {sortedProducts.length} of {groupedProducts.length} Products
                  <button onClick={handleClearAll} className="ml-2 text-xs text-primary hover:text-primary/80 font-normal underline underline-offset-2">
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  {sortedProducts.length} Products
                  <span className="text-muted-foreground font-normal ml-2">
                    ({totalVariants} variants)
                  </span>
                </>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Filter Button */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden relative">
                  <Filter className="w-4 h-4 mr-1.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Filter Products</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  <BrandProductsFilterSidebar {...filterSidebarProps} />
                </div>
                <SheetFooter className="flex-row gap-3 pt-4 border-t border-border">
                  <Button variant="outline" onClick={handleClearAll} className="flex-1">
                    Clear All
                  </Button>
                  <Button onClick={() => setMobileFilterOpen(false)} className="flex-1">
                    Show {sortedProducts.length} Results
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Grid/List Toggle */}
            <div className="hidden sm:flex items-center border border-border rounded-md">
              <button
                onClick={() => setAndPersistView('grid')}
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === 'grid' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAndPersistView('list')}
                className={cn(
                  "p-1.5 transition-colors",
                  viewMode === 'list' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="List view"
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[180px] h-9 bg-card/50 border-border">
                <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="colors-desc">Most Colors</SelectItem>
                <SelectItem value="material">Material Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {activeFilters.map((filter) => (
              <Badge
                key={`${filter.type}-${filter.id}`}
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 pl-3 pr-2 py-1 gap-1"
              >
                {filter.label}
                <button
                  onClick={() => removeFilter(filter)}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Products Grid / List */}
        {sortedProducts.length > 0 ? (
          viewMode === 'list' ? (
            /* List View */
            <div className="space-y-2">
              {sortedProducts.map((product) => {
                const filamentHref = `/filament/${product.variants[0]?.product_handle || product.variants[0]?.id}`;
                const hasPricing = product.priceRange?.min != null;
                const firstVariant = product.variants[0];
                const inCompare = firstVariant ? isInCompare(firstVariant.id) : false;

                return (
                  <a
                    key={product.baseName}
                    href={filamentHref}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg border transition-all duration-200 group/card hover:shadow-md",
                      hasPricing
                        ? "border-border bg-card hover:border-primary/50"
                        : "border-dashed border-border/60 bg-card/50 hover:border-amber-500/40"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                      {product.representativeImage ? (
                        <img src={product.representativeImage} alt={product.baseName} className="w-full h-full object-contain" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BrandLogo src={brandLogo} brandName={brandName} size="sm" className="opacity-20" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {product.baseName.replace(/\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i, "")}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {product.material && <MaterialBadge material={product.material} />}
                        {product.variants.length > 1 && (
                          <span className="text-xs text-muted-foreground">{product.variants.length} colors</span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      {hasPricing ? (
                        <div>
                          {product.priceRange.min !== product.priceRange.max ? (
                            <>
                              <span className="text-sm font-bold text-foreground">from {formatPrice(product.priceRange.min!)}</span>
                              <span className="text-xs text-muted-foreground block">{formatPrice(product.priceRange.min!)} – {formatPrice(product.priceRange.max!)}</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-foreground">{formatPrice(product.priceRange.min!)}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-400">Check retailer →</span>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedProducts.map((product) => {
                const filamentHref = `/filament/${product.variants[0]?.product_handle || product.variants[0]?.id}`;
                const firstVariant = product.variants[0];
                const inCompare = firstVariant ? isInCompare(firstVariant.id) : false;
                const hasPricing = product.priceRange?.min != null;

                const handleCompareClick = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!firstVariant) return;
                  addItem({
                    id: firstVariant.id,
                    product_title: firstVariant.product_title,
                    vendor: firstVariant.vendor,
                    material: firstVariant.material,
                    color_hex: firstVariant.color_hex,
                    variant_price: firstVariant.variant_price,
                    net_weight_g: firstVariant.net_weight_g,
                    featured_image: firstVariant.featured_image,
                  });
                };

                return (
                  <Card
                    key={product.baseName}
                    className={cn(
                      "hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer group/card overflow-hidden",
                      hasPricing
                        ? "bg-card border-border hover:border-primary/50"
                        : "bg-card/50 border-dashed border-border/60 hover:border-amber-500/40"
                    )}
                    onClick={() => window.location.href = filamentHref}
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted/20 rounded-t-lg">
                      {product.representativeImage ? (
                        <img
                          src={product.representativeImage}
                          alt={product.baseName}
                          className="w-full h-full object-contain group-hover/card:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <BrandLogo src={brandLogo} brandName={brandName} size="lg" className="max-w-[50%] max-h-[50%] opacity-20" />
                        </div>
                      )}

                      {/* Compare quick-action */}
                      <button
                        onClick={handleCompareClick}
                        className={cn(
                          "absolute top-2 right-2 z-10 p-1.5 rounded-md transition-all duration-200",
                          inCompare
                            ? "opacity-100 bg-primary text-primary-foreground"
                            : "opacity-0 group-hover/card:opacity-100 bg-background/70 text-muted-foreground hover:bg-primary hover:text-primary-foreground",
                          isFull && !inCompare && "pointer-events-none"
                        )}
                        aria-label={inCompare ? "Added to compare" : "Add to compare"}
                      >
                        <GitCompareArrows className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <CardContent className="p-4 flex flex-col min-h-[200px]">
                      {/* Product Name */}
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2 min-h-[40px]">
                        {product.baseName.replace(/\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i, "")}
                      </h3>

                      {/* Material & Variants */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        {product.material && <MaterialBadge material={product.material} />}
                        {product.variants.length > 1 && (
                          <Badge variant="outline" className="text-xs">
                            {product.variants.length} colors
                          </Badge>
                        )}
                      </div>

                      {/* Color Swatches */}
                      <div className="min-h-[20px] flex items-center gap-0.5 mb-2">
                        {product.variants.length > 1 && (
                          <>
                            {product.variants.slice(0, 6).map((variant, idx) => {
                              const colorHex = variant.color_hex ? normalizeColorHex(variant.color_hex) : null;
                              return colorHex ? (
                                <div
                                  key={idx}
                                  className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0"
                                  style={{ backgroundColor: colorHex }}
                                  title={variant.color_family || variant.product_title}
                                  role="img"
                                  aria-label={variant.color_family || 'Color swatch'}
                                />
                              ) : null;
                            })}
                            {product.variants.length > 6 && (
                              <span className="text-[10px] text-muted-foreground ml-1">
                                +{product.variants.length - 6}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Price — enhanced */}
                      <div className="min-h-[24px] mb-3">
                        {hasPricing ? (
                          <div>
                            {product.priceRange.min === product.priceRange.max ? (
                              <span className="text-lg font-bold text-foreground">
                                {formatPrice(product.priceRange.min!)}
                              </span>
                            ) : (
                              <>
                                <span className="text-lg font-bold text-foreground">
                                  from {formatPrice(product.priceRange.min!)}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {formatPrice(product.priceRange.min!)} – {formatPrice(product.priceRange.max!)}
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="text-muted-foreground text-xs italic">Price unavailable</span>
                            <a
                              href={filamentHref}
                              onClick={(e) => { e.stopPropagation(); }}
                              className="block text-amber-400 text-xs hover:text-amber-300 transition-colors mt-0.5"
                            >
                              Check retailer →
                            </a>
                          </div>
                        )}
                      </div>

                      {/* View Details */}
                      <a
                        href={filamentHref}
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.location.href = filamentHref; }}
                        className="mt-auto w-full text-xs h-8 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground group-hover/card:bg-primary group-hover/card:text-primary-foreground group-hover/card:border-primary transition-colors duration-200"
                      >
                        View Details
                      </a>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          <EmptyState
            icon={SearchX}
            title="No products match your filters"
            message="Try adjusting your material or category filters."
            action={{ label: 'Clear Filters', icon: X, onClick: handleClearAll }}
            compact
          />
        )}
      </div>
    </div>
  );
}
