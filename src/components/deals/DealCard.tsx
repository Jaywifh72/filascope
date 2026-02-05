import { useState } from "react";
import { Link } from "react-router-dom";
import { TrendingDown, Share2, Eye, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DealShareModal } from "./DealShareModal";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { RegionalPrice, RegionalPricePair } from "@/components/price/RegionalPrice";
import { StorePriceBadge } from "@/components/price/StorePriceDisplay";
import { useRegion } from "@/contexts/RegionContext";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { formatDistanceToNow } from "date-fns";
import type { CurrencyCode } from "@/types/regional";

export interface DealFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  material: string | null;
  featured_image: string | null;
  variant_price: number | null;
  variant_compare_at_price: number | null;
  product_url: string | null;
  net_weight_g: number | null;
  last_scraped_at?: string | null;
  created_at?: string | null;
}

interface DealCardProps {
  deal: DealFilament;
  discount: number;
  savings: number;
  // Urgency indicators (simulated for now)
  expiresIn?: string | null;
  stockStatus?: "in_stock" | "low_stock" | "limited" | null;
  viewsToday?: number;
  // Store region info
  storeName?: string;
  storeRegion?: string;
  regionFlag?: string;
  isLocal?: boolean;
}

export function DealCard({
  deal,
  discount,
  savings,
  expiresIn,
  stockStatus,
  viewsToday,
  storeName,
  storeRegion,
  regionFlag,
  isLocal,
}: DealCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const { getAffiliateUrl } = useAffiliateLinks();

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
  };

  const handleCheckPrice = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deal.product_url) {
      const affiliateUrl = getAffiliateUrl(deal.product_url, deal.vendor);
      window.open(affiliateUrl || deal.product_url, '_blank', 'noopener,noreferrer');
    }
  };

  const showUrgency = expiresIn || stockStatus === "low_stock" || stockStatus === "limited";
  
  // Calculate when the price was captured
  const priceVerifiedAt = deal.last_scraped_at || deal.created_at;
  const priceAgeText = priceVerifiedAt 
    ? formatDistanceToNow(new Date(priceVerifiedAt), { addSuffix: true })
    : null;

  return (
    <>
      <Link to={`/filament/${deal.id}`} className="group block">
        <Card
          className={cn(
            "relative h-full overflow-hidden transition-all duration-200",
            "hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/10 hover:border-green-500/50"
          )}
        >
          {/* Discount Badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-background text-xs font-bold">
            <TrendingDown className="h-3 w-3" />
            {discount}% OFF
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

          {/* Image - Using OptimizedImage with lazy loading */}
          <div className="relative h-40 bg-gray-800/50 flex items-center justify-center overflow-hidden">
            <OptimizedImage
              src={deal.featured_image}
              alt={deal.product_title}
              className="h-full w-full p-4 group-hover:scale-105 transition-transform duration-300"
              aspectRatio="auto"
              objectFit="contain"
              width={320}
              fallback={<span className="text-4xl text-muted-foreground">📦</span>}
            />
          </div>

          {/* Content */}
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">{deal.vendor}</div>
            <h3 className="font-medium text-sm mb-3 line-clamp-2 group-hover:text-primary transition-colors">
              {deal.product_title}
            </h3>

            {/* Price - with regional conversion */}
            {deal.variant_price && deal.variant_compare_at_price && (
              <>
                <RegionalPricePair
                  saleAmount={deal.variant_price}
                  originalAmount={deal.variant_compare_at_price}
                  sourceCurrency="USD"
                  size="lg"
                  className="mb-2"
                />
                
                {/* Savings */}
                <div className="text-xs text-green-400 mb-2 flex items-center gap-1">
                  Save <RegionalPrice amount={savings} sourceCurrency="USD" size="sm" variant="sale" showTooltip={false} />
                </div>

                {/* Price Freshness */}
                {priceAgeText && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-[10px] border-muted bg-muted/30 text-muted-foreground mb-2"
                  >
                    <Clock className="h-3 w-3" />
                    Found {priceAgeText}
                  </Badge>
                )}
              </>
            )}
            {/* Urgency Indicators */}
            {showUrgency && (
              <div className="flex flex-wrap gap-2 mb-3">
                {expiresIn && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-400"
                  >
                    <Clock className="h-3 w-3" />
                    {expiresIn}
                  </Badge>
                )}
                {(stockStatus === "low_stock" || stockStatus === "limited") && (
                  <Badge
                    variant="outline"
                    className="gap-1 text-[10px] border-red-500/30 bg-red-500/10 text-red-400"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {stockStatus === "low_stock" ? "Low Stock" : "Limited Stock"}
                  </Badge>
                )}
              </div>
            )}

            {/* Store Region Info */}
            {storeName && regionFlag && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <span>{regionFlag}</span>
                <span>{storeName}</span>
                <span>•</span>
                {isLocal ? (
                  <span className="text-emerald-400 font-medium">Local</span>
                ) : (
                  <span className="text-muted-foreground">International</span>
                )}
              </div>
            )}

            {/* Social Proof */}
            {viewsToday && viewsToday > 5 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Eye className="h-3.5 w-3.5 text-purple-400" />
                <span>{viewsToday} people viewed today</span>
              </div>
            )}

            {/* Check if Deal is Active CTA */}
            {deal.product_url && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 gap-2 text-xs"
                onClick={handleCheckPrice}
              >
                Check if Deal is Active
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* Material Badge */}
            {deal.material && !showUrgency && !viewsToday && !deal.product_url && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {deal.material}
              </Badge>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Share Modal */}
      <DealShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        deal={deal}
        discount={discount}
      />
    </>
  );
}
