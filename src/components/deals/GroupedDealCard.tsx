import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingDown, Share2, ExternalLink, Package, Clock, Ship, BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RegionalPrice, RegionalPricePair } from "@/components/price/RegionalPrice";
import { DealShareModal } from "./DealShareModal";

import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useRegionalStores } from "@/hooks/useRegionalStores";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { getOptimizedImageUrl, getImageSrcSet } from "@/utils/imageOptimization";
import { getBrandLogoUrl } from "@/lib/brandLogos";
import { toBrandSlug } from "@/utils/brandSlug";
import { isVerifiedBrand } from "@/lib/verifiedBrands";
import type { GroupedDeal } from "@/lib/groupDealsByProduct";


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
        "relative h-[120px] flex items-center justify-center overflow-hidden",
        showFallbackPlaceholder ? "" : "bg-muted/30"
      )}
      style={
        showFallbackPlaceholder
          ? {
              background: `radial-gradient(circle at center, ${colorHex ? colorHex + '15' : `hsl(${accentHue}, 30%, 15%)`}, transparent 70%), linear-gradient(135deg, hsl(${accentHue}, 20%, 10%) 0%, hsl(${accentHue}, 15%, 6%) 100%)`,
            }
          : undefined
      }
    >
      {/* Color accent bar at top — brighten very dark colors so they're visible on the dark card bg */}
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-70"
        style={{
          backgroundColor: (() => {
            if (!accentColor) return undefined;
            const match = accentColor.match(/(\d+)/g);
            if (match && match.length >= 3) {
              const [r, g, b] = match.map(Number);
              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              if (luminance < 0.15) {
                const br = Math.round(r + (255 - r) * 0.3);
                const bg = Math.round(g + (255 - g) * 0.3);
                const bb = Math.round(b + (255 - b) * 0.3);
                return `rgb(${br}, ${bg}, ${bb})`;
              }
            }
            return accentColor;
          })(),
        }}
      />

      {showFallbackPlaceholder ? (
        <div className="relative flex flex-col items-center justify-center text-center p-4 w-full h-full">
          {colorHex ? (
            <div
              className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${colorHex}cc, ${colorHex})`,
                boxShadow: `0 0 20px ${colorHex}30, inset 0 -2px 6px rgba(0,0,0,0.3)`,
                border: `2px solid ${colorHex}60`,
              }}
            >
              {material && (
                <span className="text-[10px] font-bold tracking-wider uppercase drop-shadow-md"
                  style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                >
                  {material.slice(0, 6)}
                </span>
              )}
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-muted/20 border border-border/30 flex items-center justify-center">
              <Package size={32} className="text-muted-foreground/40" />
            </div>
          )}
          {/* Subtle brand logo watermark in top-right corner */}
          {vendor && getBrandLogoUrl(vendor, 48) && (
            <img
              src={getBrandLogoUrl(vendor, 48)!}
              alt=""
              className="absolute top-2 right-2 h-5 w-auto max-w-[48px] object-contain opacity-40"
              loading="lazy"
              decoding="async"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
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
  const [shareOpen, setShareOpen] = useState(false);
  const navigate = useNavigate();
  const { getAffiliateUrl } = useAffiliateLinks();
  const { getLocalStore, region } = useRegionalStores();

  const hasPriceRange = group.priceRange.min !== group.priceRange.max;
  const hasColors = group.colorHexes.length > 0;
  const showColorCount = group.colorCount > 1;

  // Strip redundant brand prefix from product name
  const vendor = group.representativeDeal.vendor || '';
  const displayName = vendor && group.baseName.toLowerCase().startsWith(vendor.toLowerCase())
    ? group.baseName.slice(vendor.length).replace(/^[\s\-–—]+/, '').trim() || group.baseName
    : group.baseName;

  // Price range context label
  const hasWeightVariation = new Set(group.variants.map(v => (v as any).net_weight_g).filter(Boolean)).size > 1;
  const priceRangeContext = hasPriceRange
    ? (group.colorCount > 1 && hasColors
        ? `across ${group.colorCount} colors`
        : hasWeightVariation
          ? 'varies by size'
          : 'price varies')
    : null;

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
  const staleDays = group.lastScrapedAt
    ? differenceInDays(new Date(), new Date(group.lastScrapedAt))
    : 0;
  const isVeryStale = staleDays >= 45;

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
  };

  const handleCheckPrice = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
          "group/card deal-card-hover relative h-full overflow-hidden transition-all duration-200 flex flex-col cursor-pointer",
          "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40",
          "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none",
          isVeryStale && "opacity-80"
        )}
        role="article"
        tabIndex={0}
        aria-label={`${group.baseName} by ${group.representativeDeal.vendor || 'Unknown'} - ${group.bestDiscount}% off`}
        onClick={() => navigate(`/filament/${group.representativeDeal.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/filament/${group.representativeDeal.id}`);
          }
        }}
      >
        {/* Discount Badge — tiered color system */}
        <div className={cn(
          "absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-[filter] duration-200 group-hover/card:brightness-110",
          group.bestDiscount >= 50
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold animate-deal-pulse"
            : group.bestDiscount >= 35
              ? "bg-emerald-500 text-white font-semibold"
              : group.bestDiscount >= 20
                ? "bg-teal-600 text-white font-medium"
                : group.bestDiscount >= 10
                  ? "bg-gray-600 text-gray-200 font-medium"
                  : "bg-gray-700 text-gray-400 font-normal"
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

        {/* Share Button — hidden by default on pointer devices, visible on hover */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="deal-share-btn absolute top-3 right-3 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-muted/50 rounded-full p-1.5 transition-all duration-200 opacity-0 group-hover/card:opacity-100"
              onClick={handleShareClick}
              aria-label="Share this deal"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            Share deal
          </TooltipContent>
        </Tooltip>

        {/* Image with fallback chain */}
        <Link
          to={`/filament/${group.representativeDeal.id}`}
          className="block relative"
          onClick={(e) => e.stopPropagation()}
        >
          <DealCardImage
            src={group.representativeDeal.featured_image}
            fallbackSrcs={group.fallbackImages}
            alt={group.baseName}
            colorHex={representativeColorHex}
            vendor={group.representativeDeal.vendor}
            material={group.representativeDeal.material}
          />
          <div className="absolute bottom-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="text-[10px] text-white/80 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
              View details →
            </span>
          </div>
        </Link>

        <CardContent className="p-3 flex-1 flex flex-col">
          {/* Vendor with logo */}
          {group.representativeDeal.vendor && (
            <Link
              to={`/brands/${toBrandSlug(group.representativeDeal.vendor)}`}
              className="flex items-center gap-1.5 mb-1 group/brand"
              onClick={(e) => e.stopPropagation()}
            >
              {getBrandLogoUrl(group.representativeDeal.vendor, 60) && (
                  <img
                    src={getBrandLogoUrl(group.representativeDeal.vendor, 60)!}
                    alt={`${group.representativeDeal.vendor} logo`}
                    className="h-4 w-4 object-contain rounded-sm opacity-70 group-hover/brand:opacity-100 transition-opacity"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <span className="text-xs text-muted-foreground font-medium group-hover/brand:text-primary transition-colors">
                  {group.representativeDeal.vendor}
                </span>
              {isVerifiedBrand(group.representativeDeal.vendor) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BadgeCheck className="h-3 w-3 text-primary/70 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Verified brand
                  </TooltipContent>
                </Tooltip>
              )}
             </Link>
          )}
          {/* Material badge inline */}
          {group.representativeDeal.material && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium border-border/50 text-muted-foreground uppercase tracking-wide mt-1 w-fit">
              {group.representativeDeal.material}
            </Badge>
          )}

          {/* Base Product Name — brand prefix stripped */}
          <Link to={`/filament/${group.representativeDeal.id}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-sm mb-1.5 line-clamp-2 h-[40px] overflow-hidden group-hover/card:text-primary transition-colors" title={group.baseName}>
              {displayName}
            </h3>
          </Link>

          {/* Price Range or Single Price */}
          {hasPriceRange ? (
            <div className="mb-1.5">
              <div className="flex items-baseline gap-1">
                <RegionalPrice
                  amount={group.priceRange.min}
                  sourceCurrency="USD"
                  size="lg"
                />
                <span className="text-sm text-muted-foreground">–</span>
                <span className="text-sm text-muted-foreground">
                  <RegionalPrice
                    amount={group.priceRange.max}
                    sourceCurrency="USD"
                    size="sm"
                  />
                </span>
              </div>
              {priceRangeContext && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{priceRangeContext}</p>
              )}
            </div>
          ) : (
            <RegionalPricePair
              saleAmount={group.priceRange.min}
              originalAmount={
                group.representativeDeal.variant_compare_at_price
              }
              sourceCurrency="USD"
              size="lg"
              className="mb-1.5"
            />
          )}

          {/* "You save $X" anchoring text */}
          {!hasPriceRange && group.representativeDeal.variant_compare_at_price && group.representativeDeal.variant_price && group.representativeDeal.variant_compare_at_price > group.representativeDeal.variant_price && (
            <div className="flex items-center gap-1 mb-1 text-xs text-emerald-400 font-medium">
              <span>You save</span>
              <RegionalPrice
                amount={group.representativeDeal.variant_compare_at_price - group.representativeDeal.variant_price}
                sourceCurrency="USD"
                size="sm"
              />
            </div>
          )}

          {/* Merged metadata line: freshness + shipping + local */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap mb-1.5">
            {staleDays <= 7 ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-400">
                <Clock className="h-3 w-3" />
                Updated recently
              </span>
            ) : staleDays <= 30 ? (
              <span className="inline-flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                Checked {staleDays}d ago
              </span>
            ) : staleDays > 30 && group.lastScrapedAt ? (
              <span className="inline-flex items-center gap-0.5 text-amber-400">
                Price may have changed
              </span>
            ) : null}
            {(isStoreLocal || hasLocalAlternative) && (
              <>
                <span>·</span>
                <Ship className="h-3 w-3" />
                <span>Ships to {regionName}</span>
              </>
            )}
            {isStoreLocal && (
              <>
                <span>·</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-medium">Local</span>
              </>
            )}
            {group.representativeDeal.created_at && differenceInDays(new Date(), new Date(group.representativeDeal.created_at)) <= 7 && (
              <>
                <span>·</span>
                <span className="text-emerald-400 font-medium">New</span>
              </>
            )}
          </div>

          {/* Color Swatches (reserved space) */}
          <div className="min-h-[28px]">
            {hasColors && (
              <div className="mb-2">
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
                    <span className="text-[10px] text-muted-foreground">
                      +{group.colorHexes.length - 5}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2 mt-auto">
            {/* Primary CTA */}
            {(group.representativeDeal.product_url || hasLocalAlternative) && (
              <Button
                size="sm"
                className={cn(
                  "deal-cta-btn w-full gap-2 text-xs py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.98] transition-all duration-150"
                )}
                onClick={hasLocalAlternative ? handleLocalStoreClick : handleCheckPrice}
              >
                {hasLocalAlternative
                  ? `Buy at ${localStore!.storeName}`
                  : <>View Deal at <span className="truncate max-w-[160px] inline-block align-bottom">{group.storeName}</span></>}
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}

            {/* Stale price note */}
            {isVeryStale && freshnessText && (
              <p className="text-amber-500 text-[10px] text-center">
                Price may differ — last checked {freshnessText} ago
              </p>
            )}

            {/* Secondary CTA — original store when local alternative takes primary */}
            {hasLocalAlternative && group.representativeDeal.product_url && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs text-muted-foreground"
                onClick={handleCheckPrice}
              >
                {group.regionFlag} Also at {group.storeName}
                <ExternalLink className="h-3 w-3" />
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
