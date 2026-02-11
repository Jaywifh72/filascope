import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { TrendingDown, Share2, ExternalLink, ChevronDown, ChevronUp, Package, Clock, Ship } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RegionalPrice, RegionalPricePair } from "@/components/price/RegionalPrice";
import { DealShareModal } from "./DealShareModal";
import { DealQualityBadge } from "./DealQualityBadge";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useRegionalStores } from "@/hooks/useRegionalStores";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { getOptimizedImageUrl, getImageSrcSet } from "@/utils/imageOptimization";
import type { GroupedDeal } from "@/lib/groupDealsByProduct";

/** Color-coded freshness badge for deal cards */
function DealFreshnessBadge({ lastScrapedAt, freshnessText }: { lastScrapedAt: string | null | undefined; freshnessText: string }) {
  const getFreshnessColor = () => {
    if (!lastScrapedAt) return { text: 'text-muted-foreground', border: 'border-muted', bg: 'bg-muted/30' };
    const days = differenceInDays(new Date(), new Date(lastScrapedAt));
    if (days < 3) return { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' };
    if (days < 14) return { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
    if (days < 30) return { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10' };
    return { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' };
  };

  const colors = getFreshnessColor();

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-[10px] mb-2", colors.border, colors.bg, colors.text)}
    >
      <Clock className="h-3 w-3" />
      Checked {freshnessText} ago
    </Badge>
  );
}

interface GroupedDealCardProps {
  group: GroupedDeal;
}

const IMAGE_LOAD_TIMEOUT_MS = 6000;

/**
 * Deal card image with fallback chain:
 * 1. Primary image (representative deal)
 * 2. Other variant images from the group
 * 3. Rich branded placeholder with material/vendor
 */
function DealCardImage({
  src,
  fallbackSrcs = [],
  alt,
  colorHex,
  vendor,
  material,
}: {
  src: string | null | undefined;
  fallbackSrcs?: string[];
  alt: string;
  colorHex?: string | null;
  vendor?: string | null;
  material?: string | null;
}) {
  const [loaded, setLoaded] = useState(false);
  // Build fallback chain: primary first, then fallbacks (deduplicated)
  const allSrcs = [src, ...fallbackSrcs].filter((s): s is string => !!s);
  const [srcIndex, setSrcIndex] = useState(0);
  const [showFallbackPlaceholder, setShowFallbackPlaceholder] = useState(allSrcs.length === 0);

  const activeSrc = allSrcs[srcIndex] || null;

  const handleImageError = useCallback(() => {
    const nextIndex = srcIndex + 1;
    if (nextIndex < allSrcs.length) {
      setSrcIndex(nextIndex);
      setLoaded(false);
    } else {
      setShowFallbackPlaceholder(true);
    }
  }, [srcIndex, allSrcs.length]);

  // Timeout: if image doesn't load in time, try next or show fallback
  useEffect(() => {
    if (showFallbackPlaceholder || loaded || !activeSrc) return;

    const timer = setTimeout(() => {
      handleImageError();
    }, IMAGE_LOAD_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [srcIndex, loaded, showFallbackPlaceholder, activeSrc, handleImageError]);

  // Reset state when primary src changes
  useEffect(() => {
    setLoaded(false);
    setSrcIndex(0);
    setShowFallbackPlaceholder(allSrcs.length === 0);
  }, [src]);

  // Generate accent color from vendor name
  const accentHue = vendor
    ? vendor.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % 360
    : 200;
  const accentColor = colorHex || `hsl(${accentHue}, 40%, 50%)`;

  // Optimized image URL and srcset for Shopify CDN
  const optimizedSrc = activeSrc ? getOptimizedImageUrl(activeSrc, 400) : null;
  const srcSet = activeSrc ? getImageSrcSet(activeSrc, [200, 400, 600]) || undefined : undefined;

  return (
    <div
      className={cn(
        "relative h-40 flex items-center justify-center overflow-hidden",
        showFallbackPlaceholder ? "" : "bg-muted/30"
      )}
      style={
        showFallbackPlaceholder
          ? {
              background: `linear-gradient(135deg, hsl(${accentHue}, 20%, 12%) 0%, hsl(${accentHue}, 15%, 8%) 100%)`,
            }
          : undefined
      }
    >
      {/* Color accent bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-70"
        style={{ backgroundColor: accentColor }}
      />

      {showFallbackPlaceholder ? (
        <div className="flex flex-col items-center gap-2 text-center p-4">
          {colorHex ? (
            <div
              className="w-14 h-14 rounded-full border-2 border-white/10 shadow-lg"
              style={{ backgroundColor: colorHex }}
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-900/50 flex items-center justify-center">
              <Package size={48} className="text-gray-700" />
            </div>
          )}
          {material && (
            <span className="text-xs font-bold tracking-wider text-muted-foreground/80 uppercase">
              {material}
            </span>
          )}
          {vendor && (
            <span className="text-[10px] font-medium text-muted-foreground/50 truncate max-w-[80%]">
              {vendor}
            </span>
          )}
        </div>
      ) : (
        <>
          {/* Loading skeleton */}
          {!loaded && (
            <div className="absolute inset-0 bg-muted/30 animate-pulse" />
          )}
          {optimizedSrc && (
            <img
              src={optimizedSrc}
              srcSet={srcSet}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              alt={alt}
              loading="lazy"
              decoding="async"
              width={320}
              height={160}
              onLoad={() => setLoaded(true)}
              onError={handleImageError}
              className={cn(
                "h-full w-full p-4 object-contain transition-opacity duration-300",
                loaded ? "opacity-100" : "opacity-0"
              )}
            />
          )}
        </>
      )}
    </div>
  );
}

export function GroupedDealCard({ group }: GroupedDealCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { getAffiliateUrl } = useAffiliateLinks();
  const { getLocalStore, region } = useRegionalStores();

  const hasPriceRange = group.priceRange.min !== group.priceRange.max;
  const hasColors = group.colorHexes.length > 0;
  const showColorCount = group.colorCount > 1;

  // Regional store lookup
  const localStore = getLocalStore(group.representativeDeal.vendor);
  const isStoreLocal = group.isLocal;
  const hasLocalAlternative = !isStoreLocal && !!localStore;

  // Region display helpers
  const REGION_NAMES: Record<string, string> = {
    US: 'the US', CA: 'Canada', UK: 'the UK', EU: 'Europe', AU: 'Australia', JP: 'Japan', CN: 'China',
  };
  const regionName = REGION_NAMES[region] || region;

  // Price freshness
  const freshnessText = group.lastScrapedAt
    ? formatDistanceToNow(new Date(group.lastScrapedAt), { addSuffix: false })
    : null;

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
  };

  const handleCheckPrice = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If user has a local store for this brand, prefer that URL
    if (hasLocalAlternative && localStore) {
      window.open(localStore.baseUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (group.representativeDeal.product_url) {
      const affiliateUrl = getAffiliateUrl(
        group.representativeDeal.product_url,
        group.representativeDeal.vendor
      );
      window.open(
        affiliateUrl || group.representativeDeal.product_url,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleLocalStoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (localStore) {
      window.open(localStore.baseUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // Find variant by color hex
  const getVariantByHex = (hex: string) => {
    return group.variants.find((v) => (v as any).color_hex === hex);
  };

  // Get representative color hex for fallback
  const representativeColorHex = (group.representativeDeal as any).color_hex as
    | string
    | null;

  return (
    <>
      <Card
        className={cn(
          "relative h-full overflow-hidden transition-all duration-200 flex flex-col",
          "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50"
        )}
      >
        {/* Discount Badge — capped at 60%, shows "Great Deal" for unusual values */}
        <div className={cn(
          "absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
          group.isUnusualDiscount
            ? "bg-amber-500 text-amber-950"
            : "bg-green-500 text-background"
        )}>
          <TrendingDown className="h-3 w-3" />
          {group.isUnusualDiscount ? "Great Deal" : `${group.bestDiscount}% OFF`}
        </div>

        {/* "Available in [Region]" badge for local alternatives */}
        {hasLocalAlternative && (
          <div className="absolute top-12 left-3 z-10">
            <Badge className="bg-emerald-500/90 text-white border-0 text-[10px] gap-1 shadow-md">
              Available in {regionName}
            </Badge>
          </div>
        )}

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

        {/* Image with fallback chain */}
        <Link
          to={`/filament/${group.representativeDeal.id}`}
          className="block"
        >
          <DealCardImage
            src={group.representativeDeal.featured_image}
            fallbackSrcs={group.fallbackImages}
            alt={group.baseName}
            colorHex={representativeColorHex}
            vendor={group.representativeDeal.vendor}
            material={group.representativeDeal.material}
          />
        </Link>

        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Vendor */}
          <div className="text-xs text-muted-foreground mb-1">
            {group.representativeDeal.vendor}
          </div>

          {/* Base Product Name (without color) */}
          <Link to={`/filament/${group.representativeDeal.id}`}>
            <h3 className="font-medium text-sm mb-3 line-clamp-2 min-h-[40px] hover:text-primary transition-colors">
              {group.baseName}
            </h3>
          </Link>

          {/* Price Range or Single Price */}
          {hasPriceRange ? (
            <div className="flex items-center gap-1 mb-2 text-lg font-bold text-foreground">
              <RegionalPrice
                amount={group.priceRange.min}
                sourceCurrency="USD"
                size="lg"
              />
              <span className="text-muted-foreground">-</span>
              <RegionalPrice
                amount={group.priceRange.max}
                sourceCurrency="USD"
                size="lg"
              />
            </div>
          ) : (
            <RegionalPricePair
              saleAmount={group.priceRange.min}
              originalAmount={
                group.representativeDeal.variant_compare_at_price
              }
              sourceCurrency="USD"
              size="lg"
              className="mb-2"
            />
          )}

          {/* Price Freshness Badge with color coding */}
          {freshnessText && (
            <DealFreshnessBadge lastScrapedAt={group.lastScrapedAt} freshnessText={freshnessText} />
          )}

          {/* Deal Quality / Expiry Badge */}
          <DealQualityBadge
            discount={group.bestDiscount}
            isUnusualDiscount={group.isUnusualDiscount}
            createdAt={group.earliestCreatedAt}
            lastScrapedAt={group.lastScrapedAt}
            className="mb-2"
          />

          {/* Regional Shipping Badge */}
          {(isStoreLocal || hasLocalAlternative) && (
            <Badge
              variant="outline"
              className="gap-1 text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-400 mb-2"
            >
              <Ship className="h-3 w-3" />
              Ships to {regionName}
            </Badge>
          )}

          {/* Color Swatches (reserved space) */}
          <div className="min-h-[28px]">
            {hasColors && (
              <div className="mb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {group.colorHexes.slice(0, 5).map((hex, i) => {
                    const variant = getVariantByHex(hex);
                    return (
                      <Link
                        key={i}
                        to={
                          variant
                            ? `/filament/${variant.id}`
                            : `/filament/${group.representativeDeal.id}`
                        }
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
                      {expanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
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
                          to={
                            variant
                              ? `/filament/${variant.id}`
                              : `/filament/${group.representativeDeal.id}`
                          }
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
          </div>

          {/* Variant Count Badge (reserved space) */}
          <div className="min-h-[20px]">
            {showColorCount && (
              <div className="text-xs text-muted-foreground mb-2">
                {hasColors
                  ? `Available in ${group.colorCount} colors`
                  : `${group.colorCount} variants available`}
              </div>
            )}
          </div>

          {/* Store Region Info — local-first ordering */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            {isStoreLocal ? (
              // Deal is already from a local store
              <>
                <span>{group.regionFlag}</span>
                <span>{group.storeName}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Local</span>
              </>
            ) : hasLocalAlternative && localStore ? (
              // Local alternative exists — lead with local, US is secondary
              <>
                <span className="text-emerald-400 font-medium">
                  {localStore.storeName}
                </span>
                <span>•</span>
                <span className="text-muted-foreground/70">
                  Also at {group.regionFlag} {group.storeName}
                </span>
              </>
            ) : group.storeName && group.regionFlag ? (
              // International deal, no local store
              <>
                <span>{group.regionFlag}</span>
                <span>{group.storeName}</span>
                <span>•</span>
                <span>International</span>
              </>
            ) : null}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2 mt-auto">
            {/* Primary CTA */}
            {(group.representativeDeal.product_url || hasLocalAlternative) && (
              <Button
                variant={hasLocalAlternative ? "default" : "outline"}
                size="sm"
                className={cn(
                  "w-full gap-2 text-xs",
                  hasLocalAlternative && "bg-emerald-600 hover:bg-emerald-500 text-white"
                )}
                onClick={hasLocalAlternative ? handleLocalStoreClick : handleCheckPrice}
              >
                {hasLocalAlternative
                  ? `Buy at ${localStore!.storeName}`
                  : "Check if Deal is Active"}
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* Secondary CTA — original store when local alternative takes primary */}
            {hasLocalAlternative && group.representativeDeal.product_url && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs text-muted-foreground"
                onClick={handleCheckPrice}
              >
                {group.regionFlag} Check at {group.storeName}
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
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
