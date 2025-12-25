import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RegionCode } from "@/lib/brandRegionalAvailability";

export interface RegionalCoverageStats {
  region: RegionCode;
  productCount: number;
  withPrice: number;
  withUrl: number;
  pricePercent: number;
  urlPercent: number;
  lastSyncedAt: string | null;
}

export interface BrandRegionalCoverage {
  brandSlug: string;
  brandName: string;
  displayName: string;
  supportedRegions: RegionCode[];
  totalProducts: number;
  regionalStats: RegionalCoverageStats[];
  overallCoverage: {
    avgPricePercent: number;
    avgUrlPercent: number;
  };
}

const REGION_PRICE_FIELDS: Record<RegionCode, string> = {
  US: 'variant_price',
  CA: 'price_cad',
  UK: 'price_gbp',
  EU: 'price_eur',
  AU: 'price_aud',
  JP: 'price_jpy',
};

const REGION_URL_FIELDS: Record<RegionCode, string> = {
  US: 'product_url',
  CA: 'product_url_ca',
  UK: 'product_url_uk',
  EU: 'product_url_eu',
  AU: 'product_url_au',
  JP: 'product_url_jp',
};

export function useBrandRegionalCoverage(brandSlug: string | null) {
  return useQuery({
    queryKey: ['brand-regional-coverage', brandSlug],
    queryFn: async (): Promise<BrandRegionalCoverage | null> => {
      if (!brandSlug) return null;

      // Get brand info
      const { data: brand, error: brandError } = await supabase
        .from('automated_brands')
        .select('brand_slug, brand_name, display_name, supported_regions, last_scrape_at')
        .eq('brand_slug', brandSlug)
        .single();

      if (brandError || !brand) return null;

      const supportedRegions = (brand.supported_regions || ['US']) as RegionCode[];

      // Get all filaments for this brand
      const { data: filaments, error: filamentError } = await supabase
        .from('filaments')
        .select(`
          id,
          variant_price,
          price_cad,
          price_gbp,
          price_eur,
          price_aud,
          price_jpy,
          product_url,
          product_url_ca,
          product_url_uk,
          product_url_eu,
          product_url_au,
          product_url_jp,
          regional_prices_updated_at
        `)
        .ilike('vendor', brand.brand_name);

      if (filamentError) {
        console.error('Error fetching filaments for coverage:', filamentError);
        return null;
      }

      const products = filaments || [];
      const totalProducts = products.length;

      // Calculate per-region stats
      const regionalStats: RegionalCoverageStats[] = supportedRegions.map(region => {
        const priceField = REGION_PRICE_FIELDS[region] as keyof typeof products[0];
        const urlField = REGION_URL_FIELDS[region] as keyof typeof products[0];

        const withPrice = products.filter(p => p[priceField] !== null && p[priceField] !== undefined).length;
        const withUrl = products.filter(p => p[urlField] !== null && p[urlField] !== undefined && p[urlField] !== '').length;

        // Find most recent sync for this region
        const syncDates = products
          .map(p => p.regional_prices_updated_at)
          .filter(Boolean)
          .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());

        return {
          region,
          productCount: totalProducts,
          withPrice,
          withUrl,
          pricePercent: totalProducts > 0 ? Math.round((withPrice / totalProducts) * 100) : 0,
          urlPercent: totalProducts > 0 ? Math.round((withUrl / totalProducts) * 100) : 0,
          lastSyncedAt: syncDates[0] || brand.last_scrape_at,
        };
      });

      // Calculate overall averages
      const avgPricePercent = regionalStats.length > 0
        ? Math.round(regionalStats.reduce((sum, s) => sum + s.pricePercent, 0) / regionalStats.length)
        : 0;
      const avgUrlPercent = regionalStats.length > 0
        ? Math.round(regionalStats.reduce((sum, s) => sum + s.urlPercent, 0) / regionalStats.length)
        : 0;

      return {
        brandSlug: brand.brand_slug,
        brandName: brand.brand_name,
        displayName: brand.display_name,
        supportedRegions,
        totalProducts,
        regionalStats,
        overallCoverage: {
          avgPricePercent,
          avgUrlPercent,
        },
      };
    },
    enabled: !!brandSlug,
    staleTime: 30000,
  });
}

export function useAllBrandsRegionalCoverage() {
  return useQuery({
    queryKey: ['all-brands-regional-coverage'],
    queryFn: async (): Promise<BrandRegionalCoverage[]> => {
      // Get all brands with multiple regions
      const { data: brands, error: brandsError } = await supabase
        .from('automated_brands')
        .select('brand_slug, brand_name, display_name, supported_regions, last_scrape_at, product_count')
        .order('display_name');

      if (brandsError || !brands) return [];

      // Filter to only multi-region brands
      const multiRegionBrands = brands.filter(
        b => b.supported_regions && b.supported_regions.length > 1
      );

      // Get coverage for each brand (simplified - just count products with regional data)
      const coveragePromises = multiRegionBrands.map(async brand => {
        const supportedRegions = (brand.supported_regions || ['US']) as RegionCode[];

        // Get aggregate counts for this brand
        const { count: totalCount } = await supabase
          .from('filaments')
          .select('id', { count: 'exact', head: true })
          .ilike('vendor', brand.brand_name);

        const totalProducts = totalCount || 0;

        // Simplified regional stats
        const regionalStats: RegionalCoverageStats[] = supportedRegions.map(region => ({
          region,
          productCount: totalProducts,
          withPrice: 0,
          withUrl: 0,
          pricePercent: 0,
          urlPercent: 0,
          lastSyncedAt: brand.last_scrape_at,
        }));

        return {
          brandSlug: brand.brand_slug,
          brandName: brand.brand_name,
          displayName: brand.display_name,
          supportedRegions,
          totalProducts,
          regionalStats,
          overallCoverage: { avgPricePercent: 0, avgUrlPercent: 0 },
        };
      });

      return Promise.all(coveragePromises);
    },
    staleTime: 60000,
  });
}
