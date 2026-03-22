// src/components/finder-v2/FilamentCardV2.tsx

import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, GitCompareArrows } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAffiliateLinks } from '@/hooks/useAffiliateLinks';
import { getFilamentHref } from '@/lib/filamentUrl';
import { getFreshnessLabel } from '@/lib/freshnessLabel';
import { trackAffiliateClick as trackAffiliateClickSupabase } from '@/utils/affiliateLinks';
import { trackAffiliateClick as trackAffiliateClickGA4 } from '@/lib/analytics';
import { useCompare } from '@/hooks/useCompare';
import { useRegion } from '@/contexts/RegionContext';
import { formatPrice } from '@/config/currencies';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CurrencyCode } from '@/types/regional';

interface FilamentCardV2Props {
  filament: {
    id: string;
    product_title: string;
    product_handle?: string | null;
    vendor?: string | null;
    material?: string | null;
    color_hex?: string | null;
    finish_type?: string | null;
    variant_price?: number | null;
    variant_compare_at_price?: number | null;
    price_cad?: number | null;
    price_eur?: number | null;
    price_gbp?: number | null;
    price_aud?: number | null;
    product_url?: string | null;
    amazon_link_us?: string | null;
    net_weight_g?: number | null;
    filascope_score?: number | null;
    high_speed_capable?: boolean | null;
    transmission_distance?: number | null;
    is_nozzle_abrasive?: boolean | null;
    variant_available?: boolean | null;
    last_scraped_at?: string | null;
    featured_image?: string | null;
  };
  matchPercent?: number | null;
}

export function FilamentCardV2({ filament, matchPercent }: FilamentCardV2Props) {
  const navigate = useNavigate();
  const { getAffiliateUrl } = useAffiliateLinks();
  const { addItem, removeItem, isInCompare } = useCompare();
  // useRegion returns { region: RegionCode, currency: CurrencyCode, ... }
  // region is a RegionCode string (e.g. 'US', 'CA', 'EU', 'UK', 'AU'), not an object
  const { region, currency } = useRegion();

  const detailHref = getFilamentHref(filament.id, filament.product_handle);
  const freshness = getFreshnessLabel(filament.last_scraped_at);
  const inCompare = isInCompare(filament.id);

  // Deal detection
  const isDeal = filament.variant_compare_at_price != null
    && filament.variant_price != null
    && filament.variant_compare_at_price > filament.variant_price;
  const discountPct = isDeal
    ? Math.round((1 - filament.variant_price! / filament.variant_compare_at_price!) * 100)
    : 0;

  // Regional price resolution — region is a RegionCode string ('US' | 'CA' | 'EU' | 'UK' | 'AU' | ...)
  const { price, currencyCode } = useMemo(() => {
    const regionCode = (region as string).toUpperCase();
    const priceMap: Record<string, { price: number | null | undefined; code: string }> = {
      CA: { price: filament.price_cad, code: 'CAD' },
      EU: { price: filament.price_eur, code: 'EUR' },
      UK: { price: filament.price_gbp, code: 'GBP' },
      AU: { price: filament.price_aud, code: 'AUD' },
    };
    const regional = priceMap[regionCode];
    if (regional?.price != null) return { price: regional.price, currencyCode: regional.code };
    return { price: filament.variant_price, currencyCode: 'USD' };
  }, [filament, region]);

  // Price per kg
  const pricePerKg = useMemo(() => {
    if (!price || price <= 0) return null;
    const weightG = filament.net_weight_g ?? 1000;
    return (price / weightG) * 1000;
  }, [price, filament.net_weight_g]);

  // Affiliate URL
  const primaryUrl = filament.product_url ?? filament.amazon_link_us;
  const affiliateUrl = useMemo(
    () => getAffiliateUrl(primaryUrl, filament.vendor),
    [getAffiliateUrl, primaryUrl, filament.vendor]
  );

  const storeDomain = useMemo(() => {
    try { return primaryUrl ? new URL(primaryUrl).hostname.replace('www.', '') : null; }
    catch { return null; }
  }, [primaryUrl]);

  const filaScore = filament.filascope_score;
  const scoreColor = filaScore && filaScore >= 8 ? 'text-emerald-500'
    : filaScore && filaScore >= 6 ? 'text-blue-500' : 'text-muted-foreground';

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!affiliateUrl) return;

    // Fire-and-forget Supabase tracking
    void trackAffiliateClickSupabase('', affiliateUrl, {
      brandName: filament.vendor ?? '',
      regionCode: region as string,
      productName: filament.product_title,
      productSlug: filament.product_handle ?? undefined,
      productId: filament.id,
      productType: 'filament',
      sourcePage: '/beta',
      sourceComponent: 'filament_card_v2',
      price: price ?? undefined,
      currency: currencyCode,
    });

    // GA4 tracking
    trackAffiliateClickGA4({
      brand: filament.vendor ?? '',
      productName: filament.product_title,
      productId: filament.id,
      price: price ?? undefined,
      region: region as string,
      linkType: isDeal ? 'deal_card' : 'product_page',
    });

    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCompare) {
      removeItem(filament.id);
    } else {
      // addItem expects a CompareItem shape — map the fields
      addItem({
        id: filament.id,
        product_title: filament.product_title,
        vendor: filament.vendor ?? null,
        material: filament.material ?? null,
        color_hex: filament.color_hex ?? null,
        variant_price: filament.variant_price ?? null,
        net_weight_g: filament.net_weight_g ?? null,
        featured_image: filament.featured_image ?? null,
      });
    }
  };

  const freshnessColorClass = freshness.color === 'green' ? 'text-emerald-500'
    : freshness.color === 'amber' ? 'text-amber-500' : 'text-red-500';
  const freshnessDotClass = freshness.color === 'green' ? 'bg-emerald-500'
    : freshness.color === 'amber' ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div
      onClick={() => navigate(detailHref)}
      className={cn(
        'group relative cursor-pointer rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30',
        isDeal ? 'border-amber-500/30' : 'border-border',
        inCompare && 'ring-2 ring-primary/50'
      )}
      role="article"
      aria-label={filament.product_title}
    >
      {/* Deal badge */}
      {isDeal && discountPct > 0 && (
        <div className="absolute right-3 top-3 z-10 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-background">
          -{discountPct}% DEAL
        </div>
      )}

      {/* Compare toggle */}
      <button
        onClick={handleCompareToggle}
        className={cn(
          'absolute left-3 top-3 z-10 rounded-md p-1 transition-colors',
          inCompare ? 'bg-primary text-background' : 'bg-card/80 text-muted-foreground opacity-0 group-hover:opacity-100'
        )}
        aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
      >
        <GitCompareArrows className="h-3.5 w-3.5" />
      </button>

      {/* Brand + Match */}
      <div className="flex items-start justify-between px-4 pt-4">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {filament.vendor}
        </span>
        {matchPercent != null && matchPercent > 0 && (
          <span
            className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500"
            aria-label={`${matchPercent} percent compatible with your printer`}
          >
            {matchPercent}% match
          </span>
        )}
      </div>

      {/* Color band */}
      {filament.color_hex && (
        <div className="mx-4 mt-3 h-10 rounded-md" style={{ backgroundColor: filament.color_hex }} />
      )}

      {/* Body */}
      <div className="px-4 pb-0 pt-3">
        <Link
          to={detailHref}
          onClick={e => e.stopPropagation()}
          className="line-clamp-2 text-sm font-bold text-foreground hover:text-primary hover:underline"
        >
          {filament.product_title}
        </Link>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {filament.material && (
            <Badge variant="secondary" className="bg-purple-500/15 text-[10px] text-purple-500">
              {filament.material}
            </Badge>
          )}
          {filament.transmission_distance != null && (
            <Badge variant="secondary" className="bg-amber-500/15 text-[10px] text-amber-500">
              TD {filament.transmission_distance}
            </Badge>
          )}
          {filament.high_speed_capable && (
            <Badge variant="secondary" className="bg-blue-500/15 text-[10px] text-blue-500">
              High Speed
            </Badge>
          )}
          {filament.is_nozzle_abrasive && (
            <Badge variant="secondary" className="bg-red-500/15 text-[10px] text-red-500">
              Hardened Nozzle
            </Badge>
          )}
        </div>

        {/* FilaScore bar */}
        {filaScore != null && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1 flex-1 rounded-full bg-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
                style={{ width: `${Math.min(filaScore * 10, 100)}%` }}
              />
            </div>
            <span className={cn('text-xs font-bold', scoreColor)}>{filaScore.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Bottom: Price + CTA */}
      <div className="mt-3 flex items-center justify-between border-t border-border px-4 py-3">
        <div>
          <div className="text-lg font-extrabold">
            {isDeal && filament.variant_compare_at_price != null && (
              <span className="mr-1.5 text-xs font-normal text-muted-foreground line-through">
                {formatPrice(filament.variant_compare_at_price, currencyCode as CurrencyCode)}
              </span>
            )}
            {pricePerKg != null ? (
              <>
                {formatPrice(pricePerKg, currencyCode as CurrencyCode)}
                <span className="text-xs font-normal text-muted-foreground"> /kg</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Price unavailable</span>
            )}
          </div>
          <div className={cn('flex items-center gap-1 text-[10px]', freshnessColorClass)}>
            <span className={cn('inline-block h-1.5 w-1.5 rounded-full', freshnessDotClass)} aria-hidden="true" />
            {freshness.label}
          </div>
        </div>
        <div className="text-right">
          <Button
            size="sm"
            onClick={handleBuyClick}
            className={cn('gap-1.5 text-xs font-bold', isDeal && 'bg-amber-500 hover:bg-amber-600')}
          >
            <ShoppingCart className="h-3 w-3" />
            {isDeal ? 'View Deal →' : 'Buy Now →'}
          </Button>
          {storeDomain && (
            <div className="mt-0.5 text-[10px] text-muted-foreground">at {storeDomain}</div>
          )}
        </div>
      </div>
    </div>
  );
}
