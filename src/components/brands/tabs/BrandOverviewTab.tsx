import { Card, CardContent } from "@/components/ui/card";
import { BrandGuidesLinks } from "@/components/brands/BrandGuidesLinks";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, Leaf, Cpu, Package, Layers, ArrowRight, 
  ChevronLeft, ChevronRight, BadgeCheck, TrendingUp, GitCompareArrows, ChevronDown, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Link, useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useRegion } from "@/contexts/RegionContext";
import { getOptimizedImageUrl, getImageSrcSet } from "@/utils/imageOptimization";
import { useCompare } from "@/hooks/useCompare";
import { cn } from "@/lib/utils";
import { normalizeColorHex } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// =============================================
// Material Category Grouping
// =============================================

interface MaterialCategory {
  id: string;
  name: string;
  colorClass: string;
  dotClass: string;
  match: (mat: string) => boolean;
}

const MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    id: 'fire-rated',
    name: 'Fire Rated',
    colorClass: 'bg-red-400',
    dotClass: 'bg-red-400',
    match: (m) => /flameguard|fr\s*v0|fr-/i.test(m),
  },
  {
    id: 'eco',
    name: 'Eco & Recycled',
    colorClass: 'bg-emerald-400',
    dotClass: 'bg-emerald-400',
    match: (m) => /^r-|^r(?=pla|petg|abs)/i.test(m) || /\b(bio|eco|recycled)\b/i.test(m),
  },
  {
    id: 'flexible',
    name: 'Flexible',
    colorClass: 'bg-green-400',
    dotClass: 'bg-green-400',
    match: (m) => /s-flex|tpu|tpe|\bflex\b/i.test(m),
  },
  {
    id: 'specialty',
    name: 'Specialty',
    colorClass: 'bg-purple-400',
    dotClass: 'bg-purple-400',
    match: (m) => /silk|glitter|glow|metal|wood|crystal|thermoactive|stone|galaxy|marble|iridescent/i.test(m),
  },
  {
    id: 'engineering',
    name: 'Engineering',
    colorClass: 'bg-amber-400',
    dotClass: 'bg-amber-400',
    match: (m) => /\b(asa|pa\b|nylon|pc\b|pctg|abs)\b/i.test(m),
  },
  {
    id: 'standard',
    name: 'Standard',
    colorClass: 'bg-cyan-400',
    dotClass: 'bg-cyan-400',
    match: () => true, // default fallback
  },
];

// Helper: convert material name to URL slug (matches materialSlugUtils.ts pattern)
const materialToSlug = (mat: string): string =>
  mat.toLowerCase().replace(/\+/g, '-plus').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

type Filament = Tables<"filaments">;

interface GroupedProduct {
  baseName: string;
  material: string | null;
  variants: Filament[];
  representativeImage: string | null;
  priceRange: { min: number; max: number } | null;
  categoryUrl: string | null;
}

interface BrandOverviewTabProps {
  brandName: string;
  brandLogo: string | null;
  groupedProducts: GroupedProduct[];
  availableMaterials: string[];
  hasHighSpeedProducts: boolean;
  hasEcoSpools: boolean;
  hasRFID: boolean;
  hasHueForgeData?: boolean;
  isVerified?: boolean;
  onViewAllProducts: () => void;
  onFilterByMaterial: (material: string) => void;
}

interface HighlightCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  ariaLabel?: string;
}

/** Get up to 5 unique color hexes from variants */
function getSwatchColors(variants: Filament[], max = 5): { colors: string[]; overflow: number } {
  const seen = new Set<string>();
  const colors: string[] = [];
  for (const v of variants) {
    if (!v.color_hex) continue;
    const hex = normalizeColorHex(v.color_hex);
    if (hex && !seen.has(hex.toUpperCase())) {
      seen.add(hex.toUpperCase());
      colors.push(hex);
      if (colors.length >= max) break;
    }
  }
  const total = new Set(variants.map(v => v.color_hex ? normalizeColorHex(v.color_hex)?.toUpperCase() : null).filter(Boolean)).size;
  return { colors, overflow: Math.max(0, total - max) };
}

export function BrandOverviewTab({
  brandName,
  brandLogo,
  groupedProducts,
  availableMaterials,
  hasHighSpeedProducts,
  hasEcoSpools,
  hasRFID,
  hasHueForgeData = false,
  isVerified = false,
  onViewAllProducts,
  onFilterByMaterial,
}: BrandOverviewTabProps) {
  const navigate = useNavigate();
  const { formatPrice, convertPrice, currency, hasRates } = useRegion();
  const { addItem, isInCompare, isFull } = useCompare();
  const carouselRef = useRef<HTMLDivElement>(null);
  const highlightsRef = useRef<HTMLDivElement>(null);
  const [highlightsVisible, setHighlightsVisible] = useState(false);

  // Convert USD price range to regional currency
  const convertUsdPrice = useCallback((usdPrice: number): number => {
    if (currency === 'USD' || !hasRates) return usdPrice;
    return convertPrice(usdPrice, 'USD');
  }, [currency, hasRates, convertPrice]);

  const isConverted = currency !== 'USD';
  const pricePrefix = isConverted ? '~' : '';
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // IntersectionObserver for highlight cards staggered animation
  useEffect(() => {
    const el = highlightsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHighlightsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Build dynamic highlights based on brand data — priority order
  const highlights = useMemo<HighlightCard[]>(() => {
    const candidates: HighlightCard[] = [];

    if (isVerified) {
      candidates.push({
        icon: <BadgeCheck className="w-6 h-6" />,
        title: "Verified Manufacturer",
        description: "Quality verified by the FilaScope team",
      });
    }

    if (groupedProducts.length >= 100) {
      candidates.push({
        icon: <Package className="w-6 h-6" />,
        title: "Extensive Catalog",
        description: `${groupedProducts.length} products across ${availableMaterials.length} material types`,
        onClick: onViewAllProducts,
        ariaLabel: "View all products",
      });
    } else if (groupedProducts.length >= 10) {
      candidates.push({
        icon: <Package className="w-6 h-6" />,
        title: "Wide Selection",
        description: `${groupedProducts.length} products across ${availableMaterials.length} material ${availableMaterials.length === 1 ? 'type' : 'types'}`,
        onClick: onViewAllProducts,
        ariaLabel: "View all products",
      });
    }

    if (hasHighSpeedProducts) {
      candidates.push({
        icon: <Zap className="w-6 h-6" />,
        title: "High-Speed Ready",
        description: "Includes filaments optimized for high-speed printing",
        onClick: () => navigate(`/filaments?vendor=${encodeURIComponent(brandName)}&speed=high`),
        ariaLabel: "View high-speed filaments",
      });
    }

    if (hasHueForgeData) {
      candidates.push({
        icon: <Palette className="w-6 h-6" />,
        title: "HueForge Ready",
        description: "TD values available for color-accurate prints",
        onClick: () => navigate('/hueforge-tools'),
        ariaLabel: "Explore HueForge tools",
      });
    }

    if (hasEcoSpools) {
      candidates.push({
        icon: <Leaf className="w-6 h-6" />,
        title: "Eco-Conscious",
        description: "Uses recyclable cardboard spools",
      });
    }

    if (hasRFID) {
      candidates.push({
        icon: <Cpu className="w-6 h-6" />,
        title: "RFID Enabled",
        description: "Automatic filament recognition and settings",
      });
    }

    if (groupedProducts.length > 0) {
      candidates.push({
        icon: <TrendingUp className="w-6 h-6" />,
        title: "Live Pricing",
        description: "Real-time price tracking from multiple stores",
      });
    }

    return candidates.slice(0, 4);
  }, [groupedProducts.length, availableMaterials.length, hasHighSpeedProducts, hasEcoSpools, hasRFID, hasHueForgeData, isVerified, onViewAllProducts, navigate, brandName]);

  // Sort products by variant count (most colors first) for popularity
  const popularProducts = useMemo(() => {
    return [...groupedProducts]
      .sort((a, b) => b.variants.length - a.variants.length)
      .slice(0, 6);
  }, [groupedProducts]);

  // Count products per material
  const materialCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    groupedProducts.forEach((product) => {
      if (product.material) {
        counts[product.material] = (counts[product.material] || 0) + 1;
      }
    });
    return counts;
  }, [groupedProducts]);

  // Min price per material (USD) for tooltips
  const materialPriceData = useMemo(() => {
    const prices: Record<string, number> = {};
    groupedProducts.forEach((product) => {
      if (product.material && product.priceRange?.min != null) {
        if (prices[product.material] === undefined || product.priceRange.min < prices[product.material]) {
          prices[product.material] = product.priceRange.min;
        }
      }
    });
    return prices;
  }, [groupedProducts]);

  // Carousel scroll handlers
  const updateScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(updateScrollButtons, 300);
    }
  };

  const handleCompareClick = (e: React.MouseEvent, product: GroupedProduct) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.variants[0];
    if (!variant) return;
    addItem({
      id: variant.id,
      product_title: variant.product_title,
      vendor: variant.vendor,
      material: variant.material,
      color_hex: variant.color_hex,
      variant_price: variant.variant_price,
      net_weight_g: variant.net_weight_g,
      featured_image: variant.featured_image,
    });
  };

  // Scroll progress tracking
  const [scrollProgress, setScrollProgress] = useState(0);
  const updateScrollProgress = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    const maxScroll = scrollWidth - clientWidth;
    setScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
  };

  if (groupedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 max-w-md mx-auto">
        <Package className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={1.5} />
        <h3 className="text-xl font-semibold text-foreground mb-2">Products Coming Soon</h3>
        <p className="text-sm text-muted-foreground mb-6">
          We're working on adding {brandName}'s product catalog. Check back soon!
        </p>
        <Button variant="outline" onClick={() => navigate('/brands')}>
          Browse Other Brands
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Brand Highlights Section - only show with 2+ highlights */}
      {highlights.length >= 2 && <div ref={highlightsRef}>
        <h2 className="text-lg font-semibold text-white mb-4 border-l-[3px] border-cyan-500 pl-3">Brand Highlights</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {highlights.map((highlight, idx) => (
            <div
              key={idx}
              className={cn(
                "relative bg-gray-800/30 border border-gray-700 rounded-xl p-6 group/highlight overflow-hidden",
                "transition-all duration-500 ease-out",
                highlightsVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-5",
                highlight.onClick && "cursor-pointer hover:bg-muted/30"
              )}
              style={{ transitionDelay: highlightsVisible ? `${idx * 100}ms` : '0ms' }}
              onClick={highlight.onClick}
              role={highlight.onClick ? "button" : undefined}
              aria-label={highlight.ariaLabel}
              tabIndex={highlight.onClick ? 0 : undefined}
              onKeyDown={highlight.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); highlight.onClick?.(); } } : undefined}
            >
              {/* Top accent line — visible on hover */}
              <div className="absolute top-0 left-4 w-10 h-[3px] bg-cyan-500 rounded-b opacity-0 group-hover/highlight:opacity-100 transition-opacity duration-300" />
              <div className="text-primary mb-3 transition-opacity duration-700 group-hover/highlight:animate-pulse">
                {highlight.icon}
              </div>
              <div className="text-base font-semibold text-white mb-1">
                {highlight.title}
              </div>
              <div className="text-sm text-slate-400">
                {highlight.description}
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* Popular Products Section */}
      {popularProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white border-l-[3px] border-cyan-500 pl-3">Popular Products</h2>
              <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">🔥 Trending</span>
            </div>
            <button 
              onClick={onViewAllProducts} 
              className="group/viewall inline-flex items-center gap-1 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View All {groupedProducts.length} Products
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/viewall:translate-x-1" />
            </button>
          </div>
          
          {/* Carousel Container */}
          <div className="relative group/carousel">
            {/* Left Arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scrollCarousel("left")}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 hover:bg-cyan-500/20 hover:border-cyan-500/50 -ml-4"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            
            {/* Right Arrow */}
            {canScrollRight && popularProducts.length > 4 && (
              <button
                onClick={() => scrollCarousel("right")}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 hover:bg-cyan-500/20 hover:border-cyan-500/50 -mr-4"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            )}

            {/* Edge fade gradients */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none" />
            )}
            {canScrollRight && popularProducts.length > 4 && (
              <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-background via-background/80 to-transparent z-[5] pointer-events-none" />
            )}

            {/* Scrollable Products */}
            <div
              ref={carouselRef}
              onScroll={() => { updateScrollButtons(); updateScrollProgress(); }}
              className="flex gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory scroll-smooth"
            >
              {popularProducts.map((product) => {
                const filamentHref = `/filament/${product.variants[0]?.product_handle || product.variants[0]?.id}`;
                const { colors: swatchColors, overflow: swatchOverflow } = getSwatchColors(product.variants);
                const totalColors = swatchOverflow + swatchColors.length;
                const firstVariant = product.variants[0];
                const inCompare = firstVariant ? isInCompare(firstVariant.id) : false;

                return (
                <Link
                  key={product.baseName}
                  to={filamentHref}
                  className="flex-shrink-0 w-[200px] block group/card snap-start"
                >
                  <Card
                    className="bg-gray-800/30 border-gray-700 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 h-full"
                  >
                  <CardContent className="p-4 flex flex-col min-h-[180px]">
                    {/* Product Image */}
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center mb-3">
                      {product.representativeImage ? (
                        <>
                      <img
                            src={getOptimizedImageUrl(product.representativeImage, 400)}
                            srcSet={getImageSrcSet(product.representativeImage, [200, 400, 600])}
                            sizes="(max-width: 640px) 150px, (max-width: 1024px) 166px, 166px"
                            alt={product.baseName}
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full items-center justify-center">
                            <BrandLogo src={brandLogo} brandName={brandName} size="lg" className="max-w-[50%] max-h-[50%] opacity-30" />
                          </div>
                        </>
                      ) : (
                        <BrandLogo src={brandLogo} brandName={brandName} size="lg" className="max-w-[50%] max-h-[50%] opacity-30" />
                      )}

                      {/* Compare quick-action */}
                      <button
                        onClick={(e) => handleCompareClick(e, product)}
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
                    
                    {/* Product Name */}
                    <div className="text-sm font-medium text-white line-clamp-2 mb-2 min-h-[40px]" title={product.baseName.replace(/\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i, "")}>
                      {product.baseName.replace(/\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i, "")}
                    </div>
                    
                    {/* Material Badge with tooltip */}
                    {product.material && (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Badge 
                                variant="secondary" 
                                className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 mb-2 max-w-[140px] truncate w-fit cursor-default"
                              >
                                {product.material}
                              </Badge>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">{product.material}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {/* Color Swatches */}
                    {swatchColors.length > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        {swatchColors.map((hex, i) => (
                          <span
                            key={i}
                            className="w-3 h-3 rounded-full border border-border flex-shrink-0"
                            style={{ backgroundColor: hex }}
                            role="img"
                            aria-label="Color swatch"
                          />
                        ))}
                        {swatchOverflow > 0 && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-[10px] text-muted-foreground ml-0.5 cursor-default">+{swatchOverflow}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">Available in {totalColors} colors</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    )}
                    
                    {/* Price - converted to user's regional currency */}
                    {product.priceRange && product.priceRange.min !== null ? (
                      <div className="text-base text-foreground font-bold mb-3">
                        {product.priceRange.min === product.priceRange.max ? (
                          <span>{pricePrefix}{formatPrice(convertUsdPrice(product.priceRange.min))}/kg</span>
                        ) : (
                          <span>
                            {pricePrefix}{formatPrice(convertUsdPrice(product.priceRange.min))} – {pricePrefix}{formatPrice(convertUsdPrice(product.priceRange.max))}<span className="text-sm font-normal text-muted-foreground">/kg</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground/60 italic mb-3">Price unavailable</div>
                    )}
                    
                    {/* View Details Link — pushed to bottom */}
                    <span className="mt-auto w-full text-xs h-8 border border-border rounded-md flex items-center justify-center text-muted-foreground group-hover/card:bg-cyan-500/10 group-hover/card:text-cyan-400 group-hover/card:border-cyan-500/50 transition-all duration-200">
                      View Details
                    </span>
                  </CardContent>
                  </Card>
                </Link>
                );
              })}
            </div>

            {/* Scroll progress indicator */}
            {popularProducts.length > 4 && (
              <div className="mt-3 h-1 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(10, scrollProgress * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Materials Offered Section — Grouped by Category */}
      {availableMaterials.length > 0 && (
        <MaterialsGroupedSection
          availableMaterials={availableMaterials}
          materialCounts={materialCounts}
          materialPriceData={materialPriceData}
          onFilterByMaterial={onFilterByMaterial}
          pricePrefix={pricePrefix}
          formatPriceFn={formatPrice}
          convertUsdPrice={convertUsdPrice}
        />
      )}

      {/* Brand Guides Links — SEO cross-linking to relevant buying guides */}
      <BrandGuidesLinks brandName={brandName} />
    </div>
  );
}

// =============================================
// Materials Grouped Section Component
// =============================================

interface MaterialsGroupedSectionProps {
  availableMaterials: string[];
  materialCounts: Record<string, number>;
  materialPriceData: Record<string, number>;
  onFilterByMaterial: (material: string) => void;
  pricePrefix: string;
  formatPriceFn: (amount: number) => string;
  convertUsdPrice: (usd: number) => number;
}

function MaterialsGroupedSection({
  availableMaterials,
  materialCounts,
  materialPriceData,
  onFilterByMaterial,
  pricePrefix,
  formatPriceFn,
  convertUsdPrice,
}: MaterialsGroupedSectionProps) {
  // Group materials into categories
  const materialGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    MATERIAL_CATEGORIES.forEach(c => { groups[c.id] = []; });

    for (const mat of availableMaterials) {
      for (const cat of MATERIAL_CATEGORIES) {
        if (cat.match(mat)) {
          groups[cat.id].push(mat);
          break;
        }
      }
    }

    return MATERIAL_CATEGORIES
      .filter(c => groups[c.id].length > 0)
      .map(c => ({
        ...c,
        materials: groups[c.id].sort((a, b) => a.localeCompare(b)),
      }));
  }, [availableMaterials]);

  // First 3 non-empty groups expanded by default
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    return new Set(materialGroups.slice(0, 3).map(g => g.id));
  });

  const allExpanded = materialGroups.every(g => expandedGroups.has(g.id));

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedGroups(new Set(materialGroups.slice(0, 3).map(g => g.id)));
    } else {
      setExpandedGroups(new Set(materialGroups.map(g => g.id)));
    }
  };

  // Distribution data for mini chart
  const totalMaterials = availableMaterials.length;

  return (
    <div id="materials-offered">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white border-l-[3px] border-cyan-500 pl-3">Materials Offered</h2>
        <p className="text-sm text-muted-foreground mt-1 pl-[15px]">Browse the complete material catalog</p>
      </div>

      {/* Mini Material Distribution Chart */}
      {materialGroups.length > 1 && (
        <TooltipProvider delayDuration={150}>
          <div className="mb-5">
            <div className="flex h-2 rounded-full overflow-hidden bg-muted/20">
              {materialGroups.map((group) => {
                const pct = (group.materials.length / totalMaterials) * 100;
                return (
                  <Tooltip key={group.id}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "h-full transition-all duration-200 hover:brightness-125 cursor-pointer",
                          group.colorClass
                        )}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                        onClick={() => {
                          const isExp = expandedGroups.has(group.id);
                          if (!isExp) toggleGroup(group.id);
                          document.getElementById(`mat-group-${group.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }}
                        aria-label={`${group.name}: ${group.materials.length} materials`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {group.name}: {group.materials.length} material{group.materials.length !== 1 ? 's' : ''}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {materialGroups.map((group) => (
                <span key={group.id} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className={cn("w-2 h-2 rounded-full", group.dotClass)} />
                  {group.name} <span className="font-mono">{group.materials.length}</span>
                </span>
              ))}
            </div>
          </div>
        </TooltipProvider>
      )}

      <div className="space-y-3">
        {materialGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          return (
            <div key={group.id} id={`mat-group-${group.id}`}>
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex items-center gap-2 w-full text-left mb-2 group/header"
              >
                <span className={cn("w-3 h-3 rounded-full flex-shrink-0 shadow-sm", group.dotClass)} />
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {group.name}
                </span>
                <span className="text-xs text-muted-foreground/60 font-mono">({group.materials.length})</span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "text-muted-foreground transition-transform duration-300 ml-auto",
                    !isExpanded && "-rotate-90"
                  )}
                />
              </button>

              {/* Group Content — always in DOM for SEO, animated with grid-rows */}
              <div className={cn(
                "grid transition-all duration-300 ease-in-out",
                isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}>
                <div className="overflow-hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    <TooltipProvider delayDuration={200}>
                      {group.materials.map((material, chipIdx) => {
                        const count = materialCounts[material] || 0;
                        const minPriceUsd = materialPriceData[material];
                        const tooltipText = minPriceUsd != null
                          ? `${count} product${count !== 1 ? 's' : ''} from ${pricePrefix}${formatPriceFn(convertUsdPrice(minPriceUsd))}`
                          : `${count} product${count !== 1 ? 's' : ''}`;

                        return (
                          <Tooltip key={material}>
                            <TooltipTrigger asChild>
                              <a
                                href={`/materials/${materialToSlug(material)}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  onFilterByMaterial(material);
                                }}
                                title={material}
                                className={cn(
                                  "bg-gray-800/30 border border-gray-700 rounded-lg px-3 py-2.5 text-left",
                                  "hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-200",
                                  "group/chip flex items-center gap-2"
                                )}
                                style={{
                                  transitionDelay: isExpanded ? `${chipIdx * 50}ms` : '0ms',
                                }}
                              >
                                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", group.dotClass)} />
                                <div className="min-w-0 flex-1">
                                  <span className="text-sm font-medium text-foreground group-hover/chip:text-primary transition-colors line-clamp-1 block">
                                    {material}
                                  </span>
                                  <span className={cn(
                                    "text-xs text-muted-foreground",
                                    count > 1 && "font-medium"
                                  )}>
                                    {count === 1 ? '1 product' : `${count} products`}
                                  </span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover/chip:opacity-100 transition-opacity duration-200 flex-shrink-0" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {tooltipText}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show all / Collapse toggle */}
      {materialGroups.length > 3 && (
        <button
          onClick={toggleAll}
          className="mt-4 bg-muted/30 hover:bg-muted/50 border border-border rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          {allExpanded ? 'Collapse Materials' : `Show all ${availableMaterials.length} materials`}
        </button>
      )}
    </div>
  );
}
