import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProductType, ProductGroup, StoreRow, PricingStats } from '../types';
import { PRODUCT_TYPE_CONFIGS, getRegionFieldMap } from '../types';
import { REGION_CONFIG, cleanProductName, deriveRegionalUrl, computeLinkStatus } from '../constants';

export function usePricingData(productType: ProductType) {
  const config = PRODUCT_TYPE_CONFIGS[productType];
  const regionFieldMap = getRegionFieldMap(productType);

  // Fetch active regions per brand
  const { data: activeStoreRegions } = useQuery({
    queryKey: ['admin-active-store-regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_regional_stores')
        .select('brand_id, region_code, automated_brands!brand_regional_stores_brand_id_fkey(brand_name)')
        .eq('is_active', true);
      if (error) throw error;
      const map = new Map<string, Set<string>>();
      for (const row of data || []) {
        const brand = (row.automated_brands as any)?.brand_name?.toLowerCase();
        if (!brand) continue;
        if (!map.has(brand)) map.set(brand, new Set());
        map.get(brand)!.add(row.region_code);
      }
      return map;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Fetch printer brands lookup (only for printers)
  const { data: printerBrandsMap } = useQuery({
    queryKey: ['admin-printer-brands-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printer_brands')
        .select('id, brand');
      if (error) throw error;
      const map = new Map<string, string>();
      for (const row of data || []) {
        map.set(row.id, row.brand);
      }
      return map;
    },
    enabled: productType === 'printer',
    staleTime: 1000 * 60 * 60,
  });

  // Fetch raw products
  const { data: rawProducts, isLoading } = useQuery({
    queryKey: ['admin-pricing-data', productType],
    queryFn: async () => {
      const allData: any[] = [];
      const pageSize = 1000;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from(config.tableName as any)
          .select(config.selectColumns)
          .order(config.brandField, { ascending: true })
          .range(from, from + pageSize - 1);

        // For filaments, only fetch rows with product_line_id
        if (productType === 'filament') {
          query = query.not('product_line_id', 'is', null);
        }

        const { data, error } = await query;
        if (error) throw error;
        allData.push(...(data || []));
        hasMore = (data?.length || 0) === pageSize;
        from += pageSize;
      }
      return allData;
    },
    staleTime: 1000 * 60 * 5,
  });

  // URL validation cache
  const { data: urlCache } = useQuery({
    queryKey: ['admin-url-validation-cache'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('url_validation_cache')
        .select('url, status, status_code, last_checked, consecutive_failures');
      if (error) throw error;
      const map = new Map<string, { status: string; status_code: number | null; last_checked: string | null; consecutive_failures: number | null }>();
      (data || []).forEach(r => map.set(r.url, r));
      return map;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Recent price changes
  const { data: priceChanges } = useQuery({
    queryKey: ['admin-recent-price-changes', productType],
    queryFn: async () => {
      let query = supabase
        .from('price_history')
        .select('filament_id, printer_id, accessory_id, price, recorded_at, product_type')
        .order('recorded_at', { ascending: false })
        .limit(1000);

      if (productType !== 'filament') {
        query = query.eq('product_type', productType);
      }

      const { data, error } = await query;
      if (error) throw error;

      const grouped = new Map<string, number[]>();
      (data || []).forEach(r => {
        const id = productType === 'filament' ? r.filament_id
          : productType === 'printer' ? r.printer_id
          : r.accessory_id;
        if (!id) return;
        const existing = grouped.get(id) || [];
        if (existing.length < 2) {
          existing.push(r.price);
          grouped.set(id, existing);
        }
      });

      const changes = new Map<string, { percent: number; direction: 'up' | 'down' | 'unchanged'; oldPrice?: number; newPrice?: number }>();
      grouped.forEach((prices, id) => {
        if (prices.length < 2 || prices[1] === 0) {
          changes.set(id, { percent: 0, direction: 'unchanged' });
          return;
        }
        const [current, previous] = prices;
        const pct = ((current - previous) / previous) * 100;
        if (Math.abs(pct) < 0.1) {
          changes.set(id, { percent: 0, direction: 'unchanged' });
        } else {
          changes.set(id, { percent: pct, direction: pct > 0 ? 'up' : 'down', oldPrice: previous, newPrice: current });
        }
      });
      return changes;
    },
    staleTime: 1000 * 60 * 5,
  });

  // All brands/vendors for filter dropdown
  const { data: allVendors } = useQuery({
    queryKey: ['admin-pricing-all-vendors', productType],
    queryFn: async () => {
      if (productType === 'printer' && printerBrandsMap) {
        return Array.from(new Set(printerBrandsMap.values())).sort();
      }
      const { data, error } = await supabase
        .from(config.tableName as any)
        .select(config.brandField)
        .not(config.brandField, 'is', null);
      if (error) throw error;
      const set = new Set((data || []).map((r: any) => r[config.brandField]).filter(Boolean));
      return Array.from(set).sort() as string[];
    },
    staleTime: 1000 * 60 * 10,
    enabled: productType !== 'printer' || !!printerBrandsMap,
  });

  const vendors = allVendors || [];
  const totalVariantCount = rawProducts?.length || 0;

  // Group products
  const productGroups: ProductGroup[] = useMemo(() => {
    if (!rawProducts) return [];

    const grouped = new Map<string, any[]>();

    for (const item of rawProducts) {
      let groupKey: string;

      if (productType === 'filament') {
        groupKey = item.product_line_id;
        if (!groupKey) continue;
      } else if (productType === 'printer') {
        const brandName = printerBrandsMap?.get(item.brand_id) || 'Unknown';
        groupKey = `${item.brand_id}::${item.model_name}`;
        // Attach resolved brand name for display
        item._brandName = brandName;
      } else {
        groupKey = `${item.brand}::${item.name}`;
      }

      const arr = grouped.get(groupKey) || [];
      arr.push(item);
      grouped.set(groupKey, arr);
    }

    const groups: ProductGroup[] = [];

    for (const [groupKey, variants] of grouped) {
      const rep = variants[0];
      const allIds = variants.map((v: any) => v.id);

      // Get brand name
      const brand = productType === 'filament'
        ? rep.vendor
        : productType === 'printer'
        ? (rep._brandName || 'Unknown')
        : rep.brand;

      // Get product subtype
      const productSubtype = config.typeField ? rep[config.typeField] : null;

      // Get product title/name
      const productTitle = productType === 'filament'
        ? rep.product_title
        : productType === 'printer'
        ? rep.model_name
        : rep.name;

      // Color swatches (filaments only)
      const colorHexes = config.hasColorSwatches && config.colorHexField
        ? [...new Set(variants.map((v: any) => v[config.colorHexField!]).filter(Boolean))] as string[]
        : [];

      const cleanName = cleanProductName(productTitle || '');

      // Price range
      const prices = variants.map((v: any) => v[config.priceField]).filter((p: any) => p != null) as number[];
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
      const hasPriceRange = minPrice != null && maxPrice != null && Math.abs(maxPrice - minPrice) > 0.01;

      // Price change for representative
      let repChange: StoreRow['priceChange'] = null;
      for (const v of variants) {
        const c = priceChanges?.get(v.id);
        if (c && c.direction !== 'unchanged') { repChange = c; break; }
      }

      // Build store rows
      const stores: StoreRow[] = [];
      let usUrl: string | null = null;
      const vendorKey = brand?.toLowerCase();
      const activeRegionsForBrand = activeStoreRegions?.get(vendorKey);

      for (const { region, priceField, urlField } of regionFieldMap) {
        if (activeRegionsForBrand && !activeRegionsForBrand.has(region)) continue;

        let url: string | null = null;
        let price: number | null = null;
        let compareAtPrice: number | null = null;
        let lastScrapedAt: string | null = null;
        let netWeightG: number | null = null;

        for (const v of variants) {
          if (!url && v[urlField]) url = v[urlField];
          if (price == null && v[priceField] != null) {
            price = v[priceField];
            compareAtPrice = region === 'US' ? v[config.compareAtPriceField] : null;
            netWeightG = v.net_weight_g ?? null;
          }
          if (!lastScrapedAt && v.last_scraped_at) lastScrapedAt = v.last_scraped_at;
          // For printers/accessories, use updated_at as fallback
          if (!lastScrapedAt && v.updated_at) lastScrapedAt = v.updated_at;
        }

        if (region === 'US' && url) usUrl = url;

        let isDerived = false;
        if (!url && region !== 'US' && usUrl) {
          const derived = deriveRegionalUrl(usUrl, brand, region);
          if (derived) { url = derived; isDerived = true; }
        }

        if (!url && price == null) continue;

        const baseUrl = url
          ? (url.includes('?sku=') || url.includes('?id='))
            ? url.replace(/#.*$/, '')
            : url.replace(/[?#].*$/, '')
          : null;

        const rc = REGION_CONFIG[region];
        const storeKey = `${groupKey}::${region}`;
        const storeChange = region === 'US' ? repChange : null;
        const changePct = storeChange?.percent ?? null;

        stores.push({
          storeKey,
          productLineId: groupKey,
          representativeId: rep.id,
          allProductIds: allIds,
          region,
          regionFlag: rc.flag,
          storeName: `${brand} ${rc.label}`,
          price,
          compareAtPrice,
          currency: rc.currency,
          currencySymbol: rc.symbol,
          productUrl: baseUrl,
          isDerived,
          lastScrapedAt,
          linkStatus: computeLinkStatus(baseUrl, changePct, urlCache),
          priceChange: storeChange,
          netWeightG,
        });
      }

      if (stores.length === 0 && prices.length === 0) continue;

      groups.push({
        productLineId: groupKey,
        representativeId: rep.id,
        productTitle: productTitle || '',
        cleanName,
        brand: brand || '',
        productSubtype,
        variantCount: variants.length,
        colorCount: colorHexes.length,
        colorHexes,
        allProductIds: allIds,
        stores,
        minPrice,
        maxPrice,
        hasPriceRange,
        activeCount: stores.filter(s => s.linkStatus === 'active').length,
        staleCount: stores.filter(s => s.linkStatus === 'stale').length,
        brokenCount: stores.filter(s => s.linkStatus === 'broken' || s.linkStatus === 'failed').length,
        alertCount: stores.filter(s => s.linkStatus === 'alert').length,
      });
    }

    groups.sort((a, b) => {
      const vc = a.brand.localeCompare(b.brand);
      if (vc !== 0) return vc;
      return a.cleanName.localeCompare(b.cleanName);
    });

    return groups;
  }, [rawProducts, urlCache, priceChanges, activeStoreRegions, productType, config, regionFieldMap, printerBrandsMap]);

  // Stats
  const stats: PricingStats = useMemo(() => {
    let totalStores = 0, active = 0, stale = 0, broken = 0, alerts = 0, multiRegion = 0;

    for (const g of productGroups) {
      totalStores += g.stores.length;
      active += g.activeCount;
      stale += g.staleCount;
      broken += g.brokenCount;
      alerts += g.alertCount;
      if (g.stores.length > 1) multiRegion++;
    }

    const stalePrices = productGroups.reduce((acc, g) => {
      return acc + g.stores.filter(s => {
        if (!s.lastScrapedAt) return true;
        return (Date.now() - new Date(s.lastScrapedAt).getTime()) > 7 * 24 * 60 * 60 * 1000;
      }).length;
    }, 0);

    return { totalProducts: productGroups.length, totalStores, active, stale, broken, alerts, multiRegion, stalePrices, totalVariants: totalVariantCount };
  }, [productGroups, totalVariantCount]);

  return { productGroups, stats, isLoading, vendors, urlCache };
}
