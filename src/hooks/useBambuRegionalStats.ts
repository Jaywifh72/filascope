import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RegionalCoverage {
  region: string;
  flag: string;
  priceField: string;
  urlField: string;
  total: number;
  withPrice: number;
  withUrl: number;
  inStock: number;
  outOfStock: number;
  unknown: number;
  coverage: number;
  lastUpdated: string | null;
}

export interface MaterialBreakdown {
  material: string;
  total: number;
  hasPrice: number;
  inStock: number;
  avgPrice: number | null;
  lastUpdated: string | null;
}

export interface MissingDataItem {
  id: string;
  productTitle: string;
  material: string;
  missingRegions: string[];
}

export interface SyncHistoryItem {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  productsCreated: number;
  productsUpdated: number;
  productsFailed: number;
  durationSeconds: number | null;
}

export interface BambuRegionalStats {
  total: number;
  regions: RegionalCoverage[];
  overallCoverage: number;
  freshCount: number;
  staleCount: number;
  outdatedCount: number;
  neverSyncedCount: number;
  lastRegionalUpdate: string | null;
}

const REGIONS = [
  { id: 'US', flag: '🇺🇸', priceField: 'variant_price', urlField: 'product_url' },
  { id: 'CA', flag: '🇨🇦', priceField: 'price_cad', urlField: 'product_url_ca' },
  { id: 'UK', flag: '🇬🇧', priceField: 'price_gbp', urlField: 'product_url_uk' },
  { id: 'EU', flag: '🇪🇺', priceField: 'price_eur', urlField: 'product_url_eu' },
  { id: 'AU', flag: '🇦🇺', priceField: 'price_aud', urlField: 'product_url_au' },
  { id: 'JP', flag: '🇯🇵', priceField: 'price_jpy', urlField: 'product_url_jp' },
];

export function useBambuRegionalStats() {
  return useQuery({
    queryKey: ['bambu-regional-stats'],
    queryFn: async (): Promise<BambuRegionalStats> => {
      // Fetch all Bambu Lab filaments with relevant fields
      const { data: filaments, error } = await supabase
        .from('filaments')
        .select(`
          id, product_title, material, variant_available,
          variant_price, price_cad, price_gbp, price_eur, price_aud, price_jpy,
          product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp,
          regional_prices_updated_at, updated_at
        `)
        .ilike('vendor', 'bambu lab');

      if (error) throw error;

      const total = filaments?.length || 0;
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Calculate freshness
      let freshCount = 0;
      let staleCount = 0;
      let outdatedCount = 0;
      let neverSyncedCount = 0;

      filaments?.forEach(f => {
        const lastUpdate = f.regional_prices_updated_at ? new Date(f.regional_prices_updated_at) : null;
        if (!lastUpdate) {
          neverSyncedCount++;
        } else if (lastUpdate >= oneDayAgo) {
          freshCount++;
        } else if (lastUpdate >= sevenDaysAgo) {
          staleCount++;
        } else {
          outdatedCount++;
        }
      });

      // Calculate per-region stats
      const regions: RegionalCoverage[] = REGIONS.map(region => {
        let withPrice = 0;
        let withUrl = 0;
        let inStock = 0;
        let outOfStock = 0;
        let unknown = 0;
        let lastUpdated: string | null = null;

        filaments?.forEach(f => {
          const price = f[region.priceField as keyof typeof f] as number | null;
          const url = f[region.urlField as keyof typeof f] as string | null;
          
          if (price !== null && price !== undefined) {
            withPrice++;
          }
          if (url !== null && url !== undefined) {
            withUrl++;
          }
          
          // Stock status - only really applies to US (variant_available)
          if (region.id === 'US') {
            if (f.variant_available === true) inStock++;
            else if (f.variant_available === false) outOfStock++;
            else unknown++;
          } else {
            // For other regions, we consider having a price as "in stock"
            if (price !== null && price !== undefined) inStock++;
            else unknown++;
          }

          if (f.regional_prices_updated_at) {
            if (!lastUpdated || new Date(f.regional_prices_updated_at) > new Date(lastUpdated)) {
              lastUpdated = f.regional_prices_updated_at;
            }
          }
        });

        return {
          region: region.id,
          flag: region.flag,
          priceField: region.priceField,
          urlField: region.urlField,
          total,
          withPrice,
          withUrl,
          inStock,
          outOfStock,
          unknown,
          coverage: total > 0 ? Math.round((withPrice / total) * 100) : 0,
          lastUpdated,
        };
      });

      // Find the most recent regional update across all filaments
      const lastRegionalUpdate = filaments?.reduce((latest, f) => {
        if (!f.regional_prices_updated_at) return latest;
        if (!latest) return f.regional_prices_updated_at;
        return new Date(f.regional_prices_updated_at) > new Date(latest) 
          ? f.regional_prices_updated_at 
          : latest;
      }, null as string | null) || null;

      // Calculate overall coverage (average across all regions)
      const overallCoverage = regions.length > 0
        ? Math.round(regions.reduce((sum, r) => sum + r.coverage, 0) / regions.length)
        : 0;

      return {
        total,
        regions,
        overallCoverage,
        freshCount,
        staleCount,
        outdatedCount,
        neverSyncedCount,
        lastRegionalUpdate,
      };
    },
    staleTime: 30000,
  });
}

export function useBambuMaterialBreakdown(region: string) {
  return useQuery({
    queryKey: ['bambu-material-breakdown', region],
    queryFn: async (): Promise<MaterialBreakdown[]> => {
      const regionConfig = REGIONS.find(r => r.id === region) || REGIONS[0];
      
      const { data: filaments, error } = await supabase
        .from('filaments')
        .select(`
          id, material, variant_available,
          variant_price, price_cad, price_gbp, price_eur, price_aud, price_jpy,
          regional_prices_updated_at
        `)
        .ilike('vendor', 'bambu lab');

      if (error) throw error;

      // Group by material
      const materialMap = new Map<string, {
        total: number;
        hasPrice: number;
        inStock: number;
        prices: number[];
        lastUpdated: string | null;
      }>();

      filaments?.forEach(f => {
        const mat = f.material || 'Unknown';
        const price = f[regionConfig.priceField as keyof typeof f] as number | null;
        
        if (!materialMap.has(mat)) {
          materialMap.set(mat, { total: 0, hasPrice: 0, inStock: 0, prices: [], lastUpdated: null });
        }
        
        const entry = materialMap.get(mat)!;
        entry.total++;
        
        if (price !== null && price !== undefined) {
          entry.hasPrice++;
          entry.prices.push(price);
        }
        
        if (region === 'US' && f.variant_available === true) {
          entry.inStock++;
        } else if (region !== 'US' && price !== null) {
          entry.inStock++;
        }
        
        if (f.regional_prices_updated_at) {
          if (!entry.lastUpdated || new Date(f.regional_prices_updated_at) > new Date(entry.lastUpdated)) {
            entry.lastUpdated = f.regional_prices_updated_at;
          }
        }
      });

      return Array.from(materialMap.entries())
        .map(([material, stats]) => ({
          material,
          total: stats.total,
          hasPrice: stats.hasPrice,
          inStock: stats.inStock,
          avgPrice: stats.prices.length > 0 
            ? Math.round((stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length) * 100) / 100
            : null,
          lastUpdated: stats.lastUpdated,
        }))
        .sort((a, b) => b.total - a.total);
    },
    staleTime: 30000,
  });
}

export function useBambuMissingData(region: string) {
  return useQuery({
    queryKey: ['bambu-missing-data', region],
    queryFn: async (): Promise<MissingDataItem[]> => {
      const { data: filaments, error } = await supabase
        .from('filaments')
        .select(`
          id, product_title, material,
          variant_price, price_cad, price_gbp, price_eur, price_aud, price_jpy
        `)
        .ilike('vendor', 'bambu lab');

      if (error) throw error;

      const missingItems: MissingDataItem[] = [];

      filaments?.forEach(f => {
        const missingRegions: string[] = [];
        
        if (region === 'overview' || region === 'US') {
          if (f.variant_price === null) missingRegions.push('US');
        }
        if (region === 'overview' || region === 'CA') {
          if (f.price_cad === null) missingRegions.push('CA');
        }
        if (region === 'overview' || region === 'UK') {
          if (f.price_gbp === null) missingRegions.push('UK');
        }
        if (region === 'overview' || region === 'EU') {
          if (f.price_eur === null) missingRegions.push('EU');
        }
        if (region === 'overview' || region === 'AU') {
          if (f.price_aud === null) missingRegions.push('AU');
        }
        if (region === 'overview' || region === 'JP') {
          if (f.price_jpy === null) missingRegions.push('JP');
        }

        if (missingRegions.length > 0) {
          missingItems.push({
            id: f.id,
            productTitle: f.product_title,
            material: f.material || 'Unknown',
            missingRegions,
          });
        }
      });

      return missingItems.sort((a, b) => b.missingRegions.length - a.missingRegions.length);
    },
    staleTime: 30000,
  });
}

export function useBambuSyncHistory() {
  return useQuery({
    queryKey: ['bambu-sync-history'],
    queryFn: async (): Promise<SyncHistoryItem[]> => {
      const { data, error } = await supabase
        .from('brand_sync_logs')
        .select('*')
        .ilike('brand_slug', '%bambu%')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map(log => ({
        id: log.id,
        status: log.status,
        startedAt: log.started_at,
        completedAt: log.completed_at,
        productsCreated: log.products_created || 0,
        productsUpdated: log.products_updated || 0,
        productsFailed: log.products_failed || 0,
        durationSeconds: log.duration_seconds,
      }));
    },
    staleTime: 30000,
  });
}
