/**
 * useFilamentDetailPricing — Single Source of Truth for Detail Page Pricing
 * 
 * This hook collects price candidates from ALL async sources (retailer listings,
 * store pricing, unified regional pricing, legacy Amazon) and returns ONE
 * canonical best price along with all sorted candidates.
 * 
 * Every component on the detail page (sidebar, sticky bar, mobile bar,
 * BestPricesSection) MUST consume data from this hook rather than computing
 * its own prices. This eliminates race conditions and formula drift.
 */

import { useMemo } from 'react';
import { useRegion } from '@/contexts/RegionContext';
import { useFilamentListings, type FilamentListing } from './useFilamentListings';
import { useFilamentStorePricing, type StorePrice } from './useFilamentStorePricing';
import { useUnifiedRegionalPricing, type UnifiedRegionalPricingResult } from './useUnifiedRegionalPricing';
import { useAffiliateLinks } from './useAffiliateLinks';
import { extractProductSlug } from './useRegionalPricing';
import { computePricePerKg } from '@/lib/resolveFilamentPrice';
import { REGIONS } from '@/config/regions';
import type { RegionCode, CurrencyCode } from '@/types/regional';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PriceCandidate {
  name: string;
  /** Price per kg in user's currency */
  pricePerKg: number;
  /** Total pack price in user's currency */
  spoolPrice: number;
  /** Price per individual spool in user's currency */
  pricePerSpool: number;
  /** URL to the product page */
  productUrl: string;
  /** Affiliate-wrapped URL */
  affiliateUrl: string;
  /** Store/region code (US, CA, EU, etc.) */
  storeRegion: string | null;
  /** Whether this retailer is the brand's own storefront */
  isBrandDirect: boolean;
  /** Whether the price was converted from another currency */
  isConverted: boolean;
  /** Original currency if converted */
  originalCurrency: string | null;
  /** Whether this is a local store matching user's region */
  isLocal: boolean;
  /** Retailer logo URL */
  retailerLogo?: string | null;
}

export interface DetailPricingResult {
  /** The single best price candidate (absolute cheapest globally) */
  bestPrice: PriceCandidate | null;
  /** Cheapest candidate in the user's region, or null */
  cheapestLocal: PriceCandidate | null;
  /** All candidates sorted by price-per-kg ascending (cheapest first globally) */
  allCandidates: PriceCandidate[];
  /** Deduplicated count of unique retailers */
  retailerCount: number;
  /** True only when all data sources have resolved (no more price changes) */
  isReady: boolean;
  /** True while any data source is still loading */
  isLoading: boolean;
  
  // ── Convenience accessors (derived from bestPrice) ──
  /** Best price per kg in user's currency, or null */
  pricePerKg: number | null;
  /** Best total pack price in user's currency, or null */
  spoolPrice: number | null;
  /** Best per-spool price in user's currency, or null */
  pricePerSpool: number | null;
  /** Best retailer's affiliate URL */
  affiliateUrl: string | null;
  /** Best retailer's raw product URL */
  productUrl: string | null;
  /** Best retailer's display name */
  storeName: string | null;
  /** Best retailer's region code */
  storeRegion: string | null;
  /** Whether best price is converted */
  isConverted: boolean;
  /** Whether best retailer is local */
  isLocal: boolean;
  
  // ── Sticky bar accessor (local-first, global fallback) ──
  /** Price candidate for sticky/mobile bar: cheapestLocal ?? bestPrice */
  stickyBarPrice: PriceCandidate | null;
  
  // ── Sidebar-compatible regional price result ──
  sidebarRegionalPrice: {
    displayPrice: number;
    displayCurrency: CurrencyCode;
    formattedPrice: string;
    originalPrice: number;
    originalCurrency: CurrencyCode;
    isConverted: boolean;
    conversionRate: null;
    store: {
      id: string;
      name: string;
      url: string;
      regionCode: RegionCode;
      shipsFrom: string | null;
      freeShippingThreshold: null;
    };
  } | null;
}

// ─── Input types ────────────────────────────────────────────────────────────

interface FilamentForDetailPricing {
  id: string;
  product_title: string;
  vendor: string | null;
  product_url: string | null;
  product_handle?: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  pack_quantity?: number | null;
  amazon_price_usd?: number | null;
  amazon_link_us?: string | null;
  last_scraped_at?: string | null;
  price_source?: string | null;
  price_confidence?: string | null;
  price_cad?: number | null;
  price_eur?: number | null;
  price_gbp?: number | null;
  price_aud?: number | null;
  price_jpy?: number | null;
  brand_id?: string | null;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useFilamentDetailPricing(
  filament: FilamentForDetailPricing | null | undefined,
): DetailPricingResult {
  const { region, currency, formatPrice, convertPrice: regionConvertPrice, hasRates } = useRegion();
  const { getAffiliateUrl, getAmazonUrl } = useAffiliateLinks();
  
  const userCurrency = REGIONS[region as RegionCode]?.defaultCurrency || 'USD';
  
  // ── Source 1: Retailer listings (user's region) ──
  const { data: localRetailerListings, isLoading: localListingsLoading, isFetching: localListingsFetching } = useFilamentListings(
    filament?.id,
    { region, currency: userCurrency, includeUnavailable: false }
  );
  
  // ── Source 1b: Retailer listings (US fallback) ──
  const isUserUS = region === 'US';
  const { data: usRetailerListings, isLoading: usListingsLoading, isFetching: usListingsFetching } = useFilamentListings(
    !isUserUS ? filament?.id : undefined,
    { region: 'US', currency: 'USD', includeUnavailable: false }
  );
  
  // ── Source 2: Store pricing (filament_prices table via RPC) ──
  const {
    bestPrice: storeBestPrice,
    allPrices: storeAllPrices,
    isLoading: storePriceLoading,
    isFetching: storePriceFetching,
  } = useFilamentStorePricing(filament?.id);
  
  // ── Source 3: Unified regional pricing (brand_regional_stores) ──
  const unifiedPricing = useUnifiedRegionalPricing({
    brandName: filament?.vendor || '',
    productSlug: filament?.product_handle || extractProductSlug(filament?.product_url),
    basePrice: filament?.variant_price ?? null,
    baseCurrency: 'USD',
    originalUrl: filament?.product_url || null,
    productName: filament?.product_title,
    filamentId: filament?.id,
    priceLastVerifiedAt: filament?.last_scraped_at,
    priceSource: (filament as any)?.price_source,
    priceConfidence: (filament as any)?.price_confidence,
    regionalPrices: {
      price_cad: (filament as any)?.price_cad,
      price_eur: (filament as any)?.price_eur,
      price_gbp: (filament as any)?.price_gbp,
      price_aud: (filament as any)?.price_aud,
      price_jpy: (filament as any)?.price_jpy,
    },
  });
  
  // ── Loading state ──
  // isLoading: true on first load with no cache (gates candidate building)
  const isLoading = localListingsLoading || usListingsLoading || storePriceLoading || unifiedPricing.isLoading;
  // isFetching: true when any source is refreshing in the background
  // We gate on this too to prevent partial stale data from producing wrong "best price"
  const isFetching = localListingsFetching || usListingsFetching || storePriceFetching;
  // isReady = all sources settled AND exchange rates loaded (if needed)
  const isReady = !isLoading && !isFetching && (currency === 'USD' || hasRates);
  
  // ── Build candidates ──
  const { allCandidates, bestPrice, cheapestLocal, retailerCount } = useMemo(() => {
    if (!filament) {
      return { allCandidates: [] as PriceCandidate[], bestPrice: null, cheapestLocal: null, retailerCount: 0 };
    }
    
    // ── GATE: Don't build candidates until ALL sources have resolved ──
    // This prevents the "best price" from jumping as sources resolve incrementally.
    // We gate on isLoading (first load) but NOT isFetching (background refetch),
    // because gating on isFetching would flash empty state on revisits.
    // Instead, isFetching affects isReady to inform the UI.
    if (isLoading) {
      return { allCandidates: [] as PriceCandidate[], bestPrice: null, cheapestLocal: null, retailerCount: 0 };
    }
    
    const packQty = (filament as any).pack_quantity || 1;
    const weightKg = filament.net_weight_g ? filament.net_weight_g / 1000 : null;
    // Total weight across all spools in pack — the universal denominator
    const totalWeightKg = weightKg ? weightKg * packQty : packQty;
    
    if (totalWeightKg <= 0) {
      return { allCandidates: [] as PriceCandidate[], bestPrice: null, retailerCount: 0 };
    }
    
    const candidates: PriceCandidate[] = [];
    const seenKeys = new Set<string>();
    
    // Normalize store name for deduplication — handles variations like
    // "Polymaker Canada", "Polymaker (CA)", "Polymaker Store" for same physical store
    const normalizeStoreKey = (name: string, storeRegion: string | null): string => {
      let key = name.toLowerCase().replace(/\s+/g, '');
      // Strip trailing region codes (us, uk, eu, ca, au, jp, cn) and parenthetical regions
      key = key.replace(/\(?(us|uk|eu|ca|au|jp|cn|global)\)?$/i, '');
      // Strip "store" suffix
      key = key.replace(/store$/, '');
      // Append region to create a unique key per store-region combination
      if (storeRegion) {
        key += `_${storeRegion.toLowerCase()}`;
      }
      return key;
    };
    
    const addCandidate = (c: PriceCandidate) => {
      const key = normalizeStoreKey(c.name, c.storeRegion);
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      candidates.push(c);
    };
    
    // ── Source 1: filament_listings (local + US) ──
    const allListings = [
      ...(localRetailerListings || []),
      ...(usRetailerListings || []).filter(l => {
        const localIds = new Set((localRetailerListings || []).map(ll => ll.listing_id));
        return !localIds.has(l.listing_id);
      }),
    ];
    
    for (const listing of allListings) {
      if (listing.current_price == null || listing.current_price <= 0 || !listing.available) continue;
      
      let price = listing.current_price;
      let converted = false;
      let origCurrency: string | null = null;
      
      if (listing.currency !== currency && hasRates) {
        const c = regionConvertPrice(listing.current_price, listing.currency as CurrencyCode);
        if (c != null) {
          origCurrency = listing.currency;
          price = c;
          converted = true;
        }
      } else if (listing.currency !== currency && !hasRates) {
        // Can't convert yet, skip
        continue;
      }
      
      const rawUrl = listing.affiliate_url || listing.product_url;
      addCandidate({
        name: listing.retailer_name,
        pricePerKg: computePricePerKg(price, filament.net_weight_g, packQty) ?? (price / totalWeightKg),
        spoolPrice: price,
        pricePerSpool: price / packQty,
        productUrl: listing.product_url,
        affiliateUrl: getAffiliateUrl(rawUrl, filament.vendor) || rawUrl,
        storeRegion: listing.region?.toUpperCase() || null,
        isBrandDirect: listing.retailer_name.toLowerCase() === (filament.vendor || '').toLowerCase(),
        isConverted: converted,
        originalCurrency: origCurrency,
        isLocal: (listing.region?.toUpperCase() || '') === region,
        retailerLogo: listing.retailer_logo,
      });
    }
    
    // ── Source 2: Store pricing (filament_prices via RPC) ──
    for (const sp of storeAllPrices) {
      if (sp.priceDisplay <= 0 || !sp.productUrl) continue;
      
      const rawUrl = sp.productUrl;
      addCandidate({
        name: sp.storeName,
        pricePerKg: computePricePerKg(sp.priceDisplay, filament.net_weight_g, packQty) ?? (sp.priceDisplay / totalWeightKg),
        spoolPrice: sp.priceDisplay,
        pricePerSpool: sp.priceDisplay / packQty,
        productUrl: rawUrl,
        affiliateUrl: getAffiliateUrl(rawUrl, filament.vendor) || rawUrl,
        storeRegion: sp.storeRegion?.toUpperCase() || null,
        isBrandDirect: sp.storeType === 'brand_direct',
        isConverted: sp.isConverted,
        originalCurrency: sp.originalCurrency || null,
        isLocal: (sp.storeRegion?.toUpperCase() || '') === region || sp.isLocalStore,
      });
    }
    
    // ── Source 3: Unified regional pricing (brand_regional_stores) ──
    if (unifiedPricing.displayPrice != null && unifiedPricing.displayPrice > 0 && unifiedPricing.storeUrl) {
      const name = unifiedPricing.storeName || filament.vendor || 'Store';
      addCandidate({
        name,
        pricePerKg: computePricePerKg(unifiedPricing.displayPrice, filament.net_weight_g, packQty) ?? (unifiedPricing.displayPrice / totalWeightKg),
        spoolPrice: unifiedPricing.displayPrice,
        pricePerSpool: unifiedPricing.displayPrice / packQty,
        productUrl: unifiedPricing.storeUrl,
        affiliateUrl: getAffiliateUrl(unifiedPricing.storeUrl, filament.vendor) || unifiedPricing.storeUrl,
        storeRegion: unifiedPricing.storeRegion?.toUpperCase() || null,
        isBrandDirect: true,
        isConverted: unifiedPricing.isConverted,
        originalCurrency: unifiedPricing.originalCurrency || null,
        isLocal: unifiedPricing.isLocalStore,
      });
    }
    
    // ── Source 4: Legacy Amazon price ──
    if (filament.amazon_price_usd && filament.amazon_link_us) {
      const aUrl = getAmazonUrl(filament.amazon_link_us);
      if (aUrl) {
        let price = filament.amazon_price_usd;
        let converted = false;
        let origCurrency: string | null = null;
        
        if (currency !== 'USD' && hasRates) {
          const c = regionConvertPrice(price, 'USD');
          if (c != null) {
            origCurrency = 'USD';
            price = c;
            converted = true;
          }
        } else if (currency !== 'USD' && !hasRates) {
          // Can't convert yet, skip
          price = 0; // Will be filtered by price > 0 check below
        }
        
        if (price > 0) {
          addCandidate({
            name: 'Amazon US',
            pricePerKg: computePricePerKg(price, filament.net_weight_g, packQty) ?? (price / totalWeightKg),
            spoolPrice: price,
            pricePerSpool: price / packQty,
            productUrl: filament.amazon_link_us,
            affiliateUrl: aUrl,
            storeRegion: 'US',
            isBrandDirect: false,
            isConverted: converted,
            originalCurrency: origCurrency,
            isLocal: region === 'US',
          });
        }
      }
    }
    
    // ── Sort: fully deterministic ──
    // Priority: price ascending → local first → brand-direct first → name alphabetical
    const sortByPrice = (a: PriceCandidate, b: PriceCandidate) => {
      // 1. Price ascending (primary)
      const diff = a.pricePerKg - b.pricePerKg;
      if (Math.abs(diff) >= 0.01) return diff;
      
      // 2. Local stores win ties
      if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
      
      // 3. Brand-direct stores win ties
      if (a.isBrandDirect !== b.isBrandDirect) return a.isBrandDirect ? -1 : 1;
      
      // 4. Final tiebreaker: name alphabetical for full determinism
      return a.name.localeCompare(b.name);
    };
    
    const sorted = [...candidates].sort(sortByPrice);
    
    // Best price: absolute cheapest globally
    const best = sorted.length > 0 ? sorted[0] : null;
    // Cheapest local: cheapest among local candidates
    const local = sorted.find(c => c.isLocal) || null;
    
    return {
      allCandidates: sorted,
      bestPrice: best,
      cheapestLocal: local,
      retailerCount: sorted.length,
    };
  }, [
    filament, localRetailerListings, usRetailerListings, storeAllPrices,
    unifiedPricing.displayPrice, unifiedPricing.storeUrl, unifiedPricing.storeName,
    unifiedPricing.storeRegion, unifiedPricing.isConverted, unifiedPricing.isLocalStore,
    unifiedPricing.originalCurrency,
    currency, region, hasRates, regionConvertPrice, getAffiliateUrl, getAmazonUrl,
    isLoading, // re-evaluate when loading state changes
  ]);
  // ── Build sidebar-compatible regional price result ──
  const sidebarRegionalPrice = useMemo(() => {
    if (!bestPrice) return null;
    
    const bestRegion = (bestPrice.storeRegion || 'US') as RegionCode;
    
    return {
      displayPrice: bestPrice.spoolPrice,
      displayCurrency: currency as CurrencyCode,
      formattedPrice: formatPrice(bestPrice.spoolPrice, { showApproximate: bestPrice.isConverted }),
      originalPrice: bestPrice.spoolPrice,
      originalCurrency: (bestPrice.originalCurrency || currency) as CurrencyCode,
      isConverted: bestPrice.isConverted,
      conversionRate: null as null,
      store: {
        id: '',
        name: bestPrice.name,
        url: bestPrice.productUrl,
        regionCode: bestRegion,
        shipsFrom: bestPrice.isLocal ? null : (REGIONS[bestRegion]?.name || bestRegion),
        freeShippingThreshold: null as null,
      },
    };
  }, [bestPrice, currency, formatPrice]);
  
  // ── Sticky bar price: local-first, global fallback ──
  const stickyBarPrice = cheapestLocal ?? bestPrice;
  
  return {
    bestPrice,
    cheapestLocal,
    allCandidates,
    retailerCount,
    isReady,
    isLoading,
    
    // Convenience accessors
    pricePerKg: bestPrice?.pricePerKg ?? null,
    spoolPrice: bestPrice?.spoolPrice ?? null,
    pricePerSpool: bestPrice?.pricePerSpool ?? null,
    affiliateUrl: bestPrice?.affiliateUrl ?? null,
    productUrl: bestPrice?.productUrl ?? null,
    storeName: bestPrice?.name ?? null,
    storeRegion: bestPrice?.storeRegion ?? null,
    isConverted: bestPrice?.isConverted ?? false,
    isLocal: bestPrice?.isLocal ?? false,
    
    stickyBarPrice,
    sidebarRegionalPrice,
  };
}
