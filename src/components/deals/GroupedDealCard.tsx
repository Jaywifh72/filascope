import { useState } from "react";
import { Link } from "react-router-dom";
import { TrendingDown, Share2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { RegionalPrice, RegionalPricePair } from "@/components/price/RegionalPrice";
import { DealShareModal } from "./DealShareModal";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import type { GroupedDeal } from "@/lib/groupDealsByProduct";

interface GroupedDealCardProps {
  group: GroupedDeal;
}

export function GroupedDealCard({ group }: GroupedDealCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { getAffiliateUrl } = useAffiliateLinks();

  const hasPriceRange = group.priceRange.min !== group.priceRange.max;
  const hasColors = group.colorHexes.length > 0;
  const showColorCount = group.colorCount > 1;

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
  };

  const handleCheckPrice = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (group.representativeDeal.product_url) {
      const affiliateUrl = getAffiliateUrl(
        group.representativeDeal.product_url, 
        group.representativeDeal.vendor
      );
      window.open(affiliateUrl || group.representativeDeal.product_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // Find variant by color hex
  const getVariantByHex = (hex: string) => {
    return group.variants.find(v => (v as any).color_hex === hex);
  };

  return (
    <>
      <Card
        className={cn(
          "relative h-full overflow-hidden transition-all duration-200",
          "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50"
        )}
      >
        {/* Best Discount Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-background text-xs font-bold">
          <TrendingDown className="h-3 w-3" />
          {group.bestDiscount}% OFF
        </div>

        {/* Share Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={handleShareClick}
          aria-label="Share this deal"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
        </Button>

        {/* Image from representative deal */}
        <Link to={`/filament/${group.representativeDeal.id}`} className="block">
          <div className="relative h-40 bg-muted/30 flex items-center justify-center overflow-hidden">
            <OptimizedImage
              src={group.representativeDeal.featured_image}
              alt={group.baseName}
              className="h-full w-full p-4 group-hover:scale-105 transition-transform duration-300"
              aspectRatio="auto"
              objectFit="contain"
              width={320}
              fallback={<span className="text-4xl text-muted-foreground">📦</span>}
            />
          </div>
        </Link>

        <CardContent className="p-4">
          {/* Vendor */}
          <div className="text-xs text-muted-foreground mb-1">
            {group.representativeDeal.vendor}
          </div>

          {/* Base Product Name (without color) */}
          <Link to={`/filament/${group.representativeDeal.id}`}>
            <h3 className="font-medium text-sm mb-3 line-clamp-2 hover:text-primary transition-colors">
              {group.baseName}
            </h3>
          </Link>

          {/* Price Range or Single Price */}
          {hasPriceRange ? (
            <div className="flex items-center gap-1 mb-2 text-lg font-bold text-foreground">
              <RegionalPrice amount={group.priceRange.min} sourceCurrency="USD" size="lg" />
              <span className="text-muted-foreground">-</span>
              <RegionalPrice amount={group.priceRange.max} sourceCurrency="USD" size="lg" />
            </div>
          ) : (
            <RegionalPricePair
              saleAmount={group.priceRange.min}
              originalAmount={group.representativeDeal.variant_compare_at_price}
              sourceCurrency="USD"
              size="lg"
              className="mb-2"
            />
          )}

          {/* Color Swatches */}
          {hasColors && (
            <div className="mb-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {group.colorHexes.slice(0, 5).map((hex, i) => {
                  const variant = getVariantByHex(hex);
                  return (
                    <Link
                      key={i}
                      to={variant ? `/filament/${variant.id}` : `/filament/${group.representativeDeal.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded-full border border-border/50 hover:scale-125 hover:border-primary transition-all shadow-sm"
                      style={{ backgroundColor: hex }}
                      title={variant?.product_title}
                    />
                  );
                })}
                {group.colorHexes.length > 5 && (
                  <button
                    onClick={handleExpandClick}
                    className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    +{group.colorHexes.length - 5} more
                    {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
              </div>

              {/* Expanded Color Grid */}
              {expanded && (
                <div className="grid grid-cols-8 gap-1.5 mt-2 p-2 bg-muted/30 rounded-lg">
                  {group.colorHexes.map((hex, i) => {
                    const variant = getVariantByHex(hex);
                    return (
                      <Link
                        key={i}
                        to={variant ? `/filament/${variant.id}` : `/filament/${group.representativeDeal.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded-full border border-border/50 hover:scale-125 hover:border-primary transition-all shadow-sm"
                        style={{ backgroundColor: hex }}
                        title={variant?.product_title}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Variant Count Badge */}
          {showColorCount && (
            <div className="text-xs text-muted-foreground mb-2">
              {hasColors 
                ? `Available in ${group.colorCount} colors`
                : `${group.colorCount} variants available`
              }
            </div>
          )}

          {/* Store Region Info */}
          {group.storeName && group.regionFlag && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <span>{group.regionFlag}</span>
              <span>{group.storeName}</span>
              <span>•</span>
              {group.isLocal ? (
                <span className="text-emerald-400 font-medium">Local</span>
              ) : (
                <span>International</span>
              )}
            </div>
          )}

          {/* CTA Button */}
          {group.representativeDeal.product_url && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={handleCheckPrice}
            >
              Check if Deal is Active
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Share Modal */}
      <DealShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        deal={group.representativeDeal}
        discount={group.bestDiscount}
      />
    </>
  );
}
