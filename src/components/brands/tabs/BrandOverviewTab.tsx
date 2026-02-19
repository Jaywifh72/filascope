import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, Leaf, Cpu, Package, Layers, ArrowRight, 
  ChevronLeft, ChevronRight, BadgeCheck, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Link, useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { useMemo, useRef, useState, useCallback } from "react";
import { useRegion } from "@/contexts/RegionContext";
import { getOptimizedImageUrl, getImageSrcSet } from "@/utils/imageOptimization";

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
  isVerified?: boolean;
  onViewAllProducts: () => void;
  onFilterByMaterial: (material: string) => void;
}

interface HighlightCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function BrandOverviewTab({
  brandName,
  brandLogo,
  groupedProducts,
  availableMaterials,
  hasHighSpeedProducts,
  hasEcoSpools,
  hasRFID,
  isVerified = false,
  onViewAllProducts,
  onFilterByMaterial,
}: BrandOverviewTabProps) {
  const navigate = useNavigate();
  const { formatPrice, convertPrice, currency, hasRates } = useRegion();
  const carouselRef = useRef<HTMLDivElement>(null);

  // Convert USD price range to regional currency
  const convertUsdPrice = useCallback((usdPrice: number): number => {
    if (currency === 'USD' || !hasRates) return usdPrice;
    return convertPrice(usdPrice, 'USD');
  }, [currency, hasRates, convertPrice]);

  const isConverted = currency !== 'USD';
  const pricePrefix = isConverted ? '~' : '';
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Build dynamic highlights based on brand data — priority order
  const highlights = useMemo<HighlightCard[]>(() => {
    const candidates: HighlightCard[] = [];

    // Priority 1: Verified
    if (isVerified) {
      candidates.push({
        icon: <BadgeCheck className="w-6 h-6" />,
        title: "Verified Manufacturer",
        description: "Quality verified by the FilaScope team",
      });
    }

    // Priority 2: Catalog size
    if (groupedProducts.length >= 100) {
      candidates.push({
        icon: <Package className="w-6 h-6" />,
        title: "Extensive Catalog",
        description: `${groupedProducts.length} products across ${availableMaterials.length} material types`,
      });
    } else if (groupedProducts.length >= 10) {
      candidates.push({
        icon: <Package className="w-6 h-6" />,
        title: "Wide Selection",
        description: `${groupedProducts.length} products across ${availableMaterials.length} material ${availableMaterials.length === 1 ? 'type' : 'types'}`,
      });
    }

    // Priority 3: High-speed
    if (hasHighSpeedProducts) {
      candidates.push({
        icon: <Zap className="w-6 h-6" />,
        title: "High-Speed Ready",
        description: "Includes filaments optimized for high-speed printing",
      });
    }

    // Priority 4: Eco spools
    if (hasEcoSpools) {
      candidates.push({
        icon: <Leaf className="w-6 h-6" />,
        title: "Eco-Conscious",
        description: "Uses recyclable cardboard spools",
      });
    }

    // Priority 5: RFID
    if (hasRFID) {
      candidates.push({
        icon: <Cpu className="w-6 h-6" />,
        title: "RFID Enabled",
        description: "Automatic filament recognition and settings",
      });
    }

    // Priority 6: Live pricing (always true for brands with products)
    if (groupedProducts.length > 0) {
      candidates.push({
        icon: <TrendingUp className="w-6 h-6" />,
        title: "Live Pricing",
        description: "Real-time price tracking from multiple stores",
      });
    }

    return candidates.slice(0, 4);
  }, [groupedProducts.length, availableMaterials.length, hasHighSpeedProducts, hasEcoSpools, hasRFID, isVerified]);

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
      {highlights.length >= 2 && <div>
        <h2 className="text-lg font-semibold text-white mb-4">Brand Highlights</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {highlights.map((highlight, idx) => (
            <div
              key={idx}
              className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-primary/30 hover:bg-gray-800/50 transition-all duration-200"
            >
              <div className="text-primary mb-3">
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
            <h2 className="text-lg font-semibold text-white">Popular Products</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAllProducts} 
              className="text-primary hover:text-primary/80"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {/* Carousel Container */}
          <div className="relative group">
            {/* Left Arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scrollCarousel("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -ml-3"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            )}
            
            {/* Right Arrow */}
            {canScrollRight && popularProducts.length > 4 && (
              <button
                onClick={() => scrollCarousel("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/90 hover:bg-gray-700 border border-gray-600 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -mr-3"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            )}

            {/* Edge fade gradients */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none" />
            )}
            {canScrollRight && popularProducts.length > 4 && (
              <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none" />
            )}

            {/* Scrollable Products */}
            <div
              ref={carouselRef}
              onScroll={updateScrollButtons}
              className="flex gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide pb-2 -mx-1 px-1"
            >
              {popularProducts.map((product) => {
                const filamentHref = `/filament/${product.variants[0]?.product_handle || product.variants[0]?.id}`;
                return (
                <Link
                  key={product.baseName}
                  to={filamentHref}
                  className="flex-shrink-0 w-[200px] block"
                >
                  <Card
                    className="bg-gray-800/30 border-gray-700 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 h-full"
                  >
                  <CardContent className="p-4">
                    {/* Product Image */}
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center mb-3">
                      {product.representativeImage ? (
                        <>
                      <img
                            src={getOptimizedImageUrl(product.representativeImage, 400)}
                            srcSet={getImageSrcSet(product.representativeImage, [200, 400, 600])}
                            sizes="(max-width: 640px) 150px, (max-width: 1024px) 166px, 166px"
                            alt={product.baseName}
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform"
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
                    </div>
                    
                    {/* Product Name */}
                    <div className="text-sm font-medium text-white line-clamp-2 mb-2 min-h-[40px]" title={product.baseName.replace(/\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i, "")}>
                      {product.baseName.replace(/\s+[\d.]+mm\s+[\d.]+kg\s+Filament$/i, "")}
                    </div>
                    
                    {/* Material Badge */}
                    {product.material && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 mb-2 max-w-[140px] truncate"
                        title={product.material}
                      >
                        {product.material}
                      </Badge>
                    )}
                    
                    {/* Price - converted to user's regional currency */}
                    {product.priceRange && product.priceRange.min !== null ? (
                      <div className="text-sm text-foreground font-semibold mb-3">
                        {product.priceRange.min === product.priceRange.max ? (
                          <span>{pricePrefix}{formatPrice(convertUsdPrice(product.priceRange.min))}/kg</span>
                        ) : (
                          <span className="text-muted-foreground">
                            {pricePrefix}{formatPrice(convertUsdPrice(product.priceRange.min))} - {pricePrefix}{formatPrice(convertUsdPrice(product.priceRange.max))}/kg
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground/60 italic mb-3">Price unavailable</div>
                    )}
                    
                    {/* View Details Link */}
                    <span className="w-full text-xs h-8 border border-border rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
                      View Details
                    </span>
                  </CardContent>
                  </Card>
                </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Materials Offered Section */}
      {availableMaterials.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Materials Offered</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {availableMaterials.map((material) => (
              <a
                key={material}
                href={`/materials/${materialToSlug(material)}`}
                onClick={(e) => {
                  e.preventDefault();
                  onFilterByMaterial(material);
                }}
                title={material}
                className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 text-left hover:border-primary/50 hover:bg-gray-800/50 transition-all group min-h-[72px] flex flex-col justify-center"
              >
                <div className="flex items-start gap-2 mb-1">
                  <Layers className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors line-clamp-2">
                    {material}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {(materialCounts[material] || 0) === 1 ? '1 product' : `${materialCounts[material] || 0} products`}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
