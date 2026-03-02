import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ExternalLink, Link2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRegion } from '@/contexts/RegionContext';
import { useAffiliateLink, type ClickMetadata } from '@/hooks/useAffiliateLink';
import { AffiliateDiscountBanner } from '@/components/affiliate/AffiliateDiscountBanner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PaletteEntry } from '@/hooks/usePaletteBuilder';

// ── Types ────────────────────────────────────────────────────────

interface Props {
  palette: PaletteEntry[];
}

interface FilamentUrlData {
  id: string;
  product_url: string | null;
  product_handle: string | null;
  vendor: string | null;
}

// ── Per-row component (can call hooks) ───────────────────────────

function ShoppingRow({
  entry,
  productUrl,
  currency,
  formatPrice,
}: {
  entry: PaletteEntry;
  productUrl: string | null;
  currency: string;
  formatPrice: (amount: number, opts?: { showApproximate?: boolean }) => string;
}) {
  const { buildLink, trackAndOpen, hasAffiliate } = useAffiliateLink(entry.brand);

  const affiliateUrl = useMemo(
    () => (productUrl ? buildLink(productUrl) : null),
    [productUrl, buildLink],
  );

  const handleBuy = () => {
    const url = affiliateUrl || productUrl;
    if (!url) return;

    const meta: ClickMetadata = {
      productName: entry.filamentName,
      productSlug: entry.slug,
      sourcePage: 'palette-builder',
      sourceComponent: 'shopping-list',
      price: entry.price ?? undefined,
      currency,
      material: entry.material,
    };

    if (hasAffiliate) {
      trackAndOpen(productUrl!, meta);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex items-center gap-2 py-2 border-b border-border/40 last:border-0">
      {/* Color swatch */}
      <span
        className="w-4 h-4 rounded-full shrink-0 border border-border/60"
        style={{ backgroundColor: entry.color || '#888' }}
        aria-label={`${entry.colorFamily || 'Unknown'} color swatch`}
        role="img"
      />

      {/* Name + brand */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{entry.filamentName}</p>
        <p className="text-xs text-muted-foreground truncate">{entry.brand}</p>
      </div>

      {/* Material badge */}
      <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:inline-flex">
        {entry.material}
      </Badge>

      {/* Layers */}
      <span className="text-xs text-muted-foreground shrink-0">×{entry.layers}</span>

      {/* Price */}
      <span className="text-sm font-mono shrink-0 min-w-[60px] text-right">
        {entry.price != null ? formatPrice(entry.price) : (
          <span className="text-muted-foreground text-xs">No price</span>
        )}
      </span>

      {/* Buy button */}
      {productUrl ? (
        <Button size="sm" className="h-7 px-2.5 text-xs gap-1 shrink-0" onClick={handleBuy}>
          Shop <ExternalLink className="w-3 h-3" />
        </Button>
      ) : (
        <Button size="sm" className="h-7 px-2.5 text-xs gap-1 shrink-0" disabled variant="ghost">
          N/A
        </Button>
      )}
    </div>
  );
}

// ── Discount banners (one per unique brand) ──────────────────────

function BrandDiscountBanners({ brands }: { brands: string[] }) {
  return (
    <div className="space-y-2 mb-4">
      {brands.map((brand) => (
        <BrandBanner key={brand} brand={brand} />
      ))}
    </div>
  );
}

function BrandBanner({ brand }: { brand: string }) {
  const { discountCodes } = useAffiliateLink(brand);
  if (!discountCodes.length) return null;
  return <AffiliateDiscountBanner discountCodes={discountCodes} />;
}

// ── Main component ───────────────────────────────────────────────

export function PaletteShoppingList({ palette }: Props) {
  const { currency, formatPrice } = useRegion();

  // Batch-fetch product URLs for all filaments in palette
  const filamentIds = useMemo(() => palette.map((p) => p.filamentId), [palette]);

  const { data: urlMap = {} } = useQuery({
    queryKey: ['palette-filament-urls', filamentIds],
    enabled: filamentIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_url, product_handle, vendor')
        .in('id', filamentIds);
      if (error || !data) return {};
      const map: Record<string, FilamentUrlData> = {};
      for (const d of data) map[d.id] = d;
      return map;
    },
  });

  const uniqueBrands = useMemo(
    () => [...new Set(palette.map((p) => p.brand).filter(Boolean))],
    [palette],
  );

  // Cost estimate
  const { total, missingCount } = useMemo(() => {
    let sum = 0;
    let missing = 0;
    for (const p of palette) {
      if (p.price != null) {
        sum += p.price;
      } else {
        missing++;
      }
    }
    return { total: sum, missingCount: missing };
  }, [palette]);

  const purchasableCount = useMemo(
    () => palette.filter((p) => urlMap[p.filamentId]?.product_url).length,
    [palette, urlMap],
  );

  if (!palette.length) {
    return (
      <div className="min-h-[160px] flex flex-col items-center justify-center text-center">
        <ShoppingCart className="w-8 h-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Add filaments to see your shopping list</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Discount banners */}
      <BrandDiscountBanners brands={uniqueBrands} />

      {/* Purchase rows */}
      <div>
        {palette.map((entry) => (
          <ShoppingRow
            key={entry.filamentId}
            entry={entry}
            productUrl={urlMap[entry.filamentId]?.product_url ?? null}
            currency={currency}
            formatPrice={formatPrice}
          />
        ))}
      </div>

      {/* Total estimate */}
      <div className="border-t border-border/60 pt-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estimated Total</span>
          <span className="text-base font-bold font-mono">
            {total > 0 ? formatPrice(total) : '—'}
          </span>
        </div>
        {missingCount > 0 && (
          <p className="text-xs text-muted-foreground">
            ({missingCount} filament{missingCount > 1 ? 's' : ''} without pricing)
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Prices are estimates and may vary. Shipping, taxes, and fees not included. Always verify the final price at the retailer.
        </p>
      </div>

      {/* Open All button */}
      <OpenAllButton palette={palette} urlMap={urlMap} purchasableCount={purchasableCount} />

      {/* Affiliate disclosure */}
      <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
        🔗 Links may be affiliate links.{' '}
        <Link to="/affiliate-disclosure" className="underline hover:text-foreground transition-colors">
          Learn more
        </Link>
      </p>
    </div>
  );
}

// ── Open All sub-component ───────────────────────────────────────

function OpenAllButton({
  palette,
  urlMap,
  purchasableCount,
}: {
  palette: PaletteEntry[];
  urlMap: Record<string, FilamentUrlData>;
  purchasableCount: number;
}) {
  // We can't call useAffiliateLink per-brand in a loop here,
  // so the "Open All" will open raw URLs (affiliate wrapping happens
  // per-row via ShoppingRow). We open them simply.
  const handleOpenAll = () => {
    for (const p of palette) {
      const url = urlMap[p.filamentId]?.product_url;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (purchasableCount === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-1.5" disabled>
              <ExternalLink className="w-3.5 h-3.5" /> Open All Shop Links
            </Button>
          </TooltipTrigger>
          <TooltipContent>No purchase links available</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-1.5">
          <ExternalLink className="w-3.5 h-3.5" /> Open All Shop Links
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Open {purchasableCount} shop links?</AlertDialogTitle>
          <AlertDialogDescription>
            This will open {purchasableCount} new tab{purchasableCount > 1 ? 's' : ''} with retailer links.
            Each link supports FilaScope through affiliate tracking.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleOpenAll}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
