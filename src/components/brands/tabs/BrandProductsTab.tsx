import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ArrowUpDown, X, ExternalLink, SearchX, GitCompareArrows } from "lucide-react";
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

  // Filter products
  const filteredProducts = useMemo(() => {
    return groupedProducts.filter((product) => {
      // Material filter
      if (selectedMaterials.length > 0 && product.material) {
        if (!selectedMaterials.includes(product.material)) {
          return false;
        }
      }

      // Price range filter
      if (selectedPriceRanges.length > 0 && product.priceRange.min !== null) {
        const price = product.priceRange.min;
        const matchesPrice = selectedPriceRanges.some((rangeId) => {
          const range = PRICE_RANGES.find((r) => r.id === rangeId);
          if (!range) return false;
          const minOk = range.min === null || price >= range.min;
          const maxOk = range.max === null || price < range.max;
          return minOk && maxOk;
        });
        if (!matchesPrice) return false;
      }

      // Color filter
      if (selectedColors.length > 0) {
        const productColors = product.variants
          .map((v) => v.color_family)
          .filter(Boolean);
        const hasMatchingColor = selectedColors.some((c) =>
          productColors.includes(c)
        );
        if (!hasMatchingColor) return false;
      }

      // Spool size filter
      if (selectedSpoolSizes.length > 0) {
        const productWeights = product.variants
          .map((v) => v.net_weight_g)
          .filter((w): w is number => w !== null);
        const hasMatchingSize = selectedSpoolSizes.some((sizeId) => {
          const size = SPOOL_SIZES.find((s) => s.id === sizeId);
          if (!size) return false;
          return productWeights.some(
            (w) => w >= size.weightMin && w <= size.weightMax
          );
        });
        if (!hasMatchingSize) return false;
      }

      return true;
    });
  }, [
    groupedProducts,
    selectedMaterials,
    selectedPriceRanges,
    selectedColors,
    selectedSpoolSizes,
  ]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (sortBy) {
      case "name-asc":
        sorted.sort((a, b) => a.baseName.localeCompare(b.baseName));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.baseName.localeCompare(a.baseName));
        break;
      case "price-asc":
        sorted.sort((a, b) => (a.priceRange.min ?? 999) - (b.priceRange.min ?? 999));
        break;
      case "price-desc":
        sorted.sort((a, b) => (b.priceRange.min ?? 0) - (a.priceRange.min ?? 0));
        break;
      case "colors-desc":
        sorted.sort((a, b) => b.variants.length - a.variants.length);
        break;
      case "material":
        sorted.sort((a, b) => (a.material || "").localeCompare(b.material || ""));
        break;
    }
    return sorted;
  }, [filteredProducts, sortBy]);

  // Active filter chips
  const activeFilters = useMemo(() => {
    const filters: { id: string; label: string; type: string }[] = [];
    selectedMaterials.forEach((m) =>
      filters.push({ id: m, label: m, type: "material" })
    );
    selectedPriceRanges.forEach((p) => {
      const range = PRICE_RANGES.find((r) => r.id === p);
      if (range) filters.push({ id: p, label: range.label, type: "price" });
    });
    selectedColors.forEach((c) =>
      filters.push({ id: c, label: c, type: "color" })
    );
    selectedSpoolSizes.forEach((s) => {
      const size = SPOOL_SIZES.find((sz) => sz.id === s);
      if (size) filters.push({ id: s, label: size.label, type: "size" });
    });
    return filters;
  }, [selectedMaterials, selectedPriceRanges, selectedColors, selectedSpoolSizes]);

  const removeFilter = (filter: { id: string; type: string }) => {
    switch (filter.type) {
      case "material":
        handleMaterialChange(filter.id, false);
        break;
      case "price":
        handlePriceRangeChange(filter.id, false);
        break;
      case "color":
        handleColorChange(filter.id, false);
        break;
      case "size":
        handleSpoolSizeChange(filter.id, false);
        break;
    }
  };

  const totalVariants = filaments.length;

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
        <BrandProductsFilterSidebar
          materials={materialOptions}
          colors={colorOptions}
          selectedMaterials={selectedMaterials}
          selectedPriceRanges={selectedPriceRanges}
          selectedColors={selectedColors}
          selectedSpoolSizes={selectedSpoolSizes}
          onMaterialChange={handleMaterialChange}
          onPriceRangeChange={handlePriceRangeChange}
          onColorChange={handleColorChange}
          onSpoolSizeChange={handleSpoolSizeChange}
          onClearAll={handleClearAll}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Products Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">
              {sortedProducts.length} Products
              <span className="text-gray-500 font-normal ml-2">
                ({totalVariants} variants)
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[180px] h-9 bg-gray-800/50 border-gray-700">
                <ArrowUpDown className="w-4 h-4 mr-2 text-gray-400" />
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
              className="h-7 text-xs text-gray-400 hover:text-white"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Products Grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedProducts.map((product) => {
              const filamentHref = `/filament/${product.variants[0]?.product_handle || product.variants[0]?.id}`;
              const firstVariant = product.variants[0];
              const inCompare = firstVariant ? isInCompare(firstVariant.id) : false;

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
                className="bg-card border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer group/card overflow-hidden"
                onClick={() => window.location.href = filamentHref}
              >
                {/* Image Container - fixed height */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-800 rounded-t-lg">
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
                        ? "opacity-100 bg-cyan-600 text-white"
                        : "opacity-0 group-hover/card:opacity-100 bg-gray-900/70 text-gray-300 hover:bg-cyan-600 hover:text-white",
                      isFull && !inCompare && "pointer-events-none"
                    )}
                    aria-label={inCompare ? "Added to compare" : "Add to compare"}
                  >
                    <GitCompareArrows className="w-3.5 h-3.5" />
                  </button>
                </div>

                <CardContent className="p-4 flex flex-col min-h-[200px]">
                  {/* Product Name */}
                  <h3 className="font-semibold text-white text-sm line-clamp-2 mb-2 min-h-[40px]">
                    {product.baseName.replace(/\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i, "")}
                  </h3>

                  {/* Material & Variants */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {product.material && (
                      <MaterialBadge material={product.material} />
                    )}
                    {product.variants.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        {product.variants.length} colors
                      </Badge>
                    )}
                  </div>

                  {/* Color Swatches - placeholder space for alignment */}
                  <div className="min-h-[20px] flex items-center gap-0.5 mb-2">
                    {product.variants.length > 1 && (
                      <>
                        {product.variants.slice(0, 6).map((variant, idx) => {
                          const colorHex = variant.color_hex
                            ? normalizeColorHex(variant.color_hex)
                            : null;
                          return colorHex ? (
                            <div
                              key={idx}
                              className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0"
                              style={{ backgroundColor: colorHex }}
                              title={variant.color_family || variant.product_title}
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

                  {/* Price Range - with fallback for missing prices */}
                  <div className="min-h-[24px] mb-3">
                    {product.priceRange && product.priceRange.min !== null ? (
                      <div className="text-sm">
                        {product.priceRange.min === product.priceRange.max ? (
                          <span className="font-semibold text-foreground">
                            {formatPrice(product.priceRange.min)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {formatPrice(product.priceRange.min!)} - {formatPrice(product.priceRange.max!)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="text-gray-500 text-xs italic">Price unavailable</span>
                        <a
                          href={filamentHref}
                          onClick={(e) => { e.stopPropagation(); }}
                          className="block text-cyan-500 text-xs hover:text-cyan-400 transition-colors mt-0.5"
                        >
                          Check retailer →
                        </a>
                      </div>
                    )}
                  </div>

                  {/* View Details - pinned to bottom */}
                  <a
                    href={filamentHref}
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.location.href = filamentHref; }}
                    className="mt-auto w-full text-xs h-8 inline-flex items-center justify-center rounded-md border border-border text-muted-foreground group-hover/card:bg-cyan-600 group-hover/card:text-white group-hover/card:border-cyan-600 transition-colors duration-200"
                  >
                    View Details
                  </a>
                </CardContent>
              </Card>
              );
            })}
          </div>
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
