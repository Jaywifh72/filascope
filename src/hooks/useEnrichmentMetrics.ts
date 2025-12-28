import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OverallMetrics {
  total: number;
  withColorHex: number;
  withTds: number;
  withEur: number;
  withGbp: number;
  withCad: number;
  withAud: number;
}

export interface BrandMetrics {
  brandSlug: string;
  brandName: string;
  totalProducts: number;
  withColorHex: number;
  withTds: number;
  withEur: number;
  withGbp: number;
  withCad: number;
  withAud: number;
  colorCoverage: number;
  tdsCoverage: number;
  eurCoverage: number;
  gbpCoverage: number;
  cadCoverage: number;
  audCoverage: number;
  supportedRegions: string[];
}

interface EnrichmentMetricsData {
  overall: OverallMetrics;
  brands: BrandMetrics[];
  lowColorBrands: BrandMetrics[];
  lowTdsBrands: BrandMetrics[];
  regionalBrands: BrandMetrics[];
}

async function fetchEnrichmentMetrics(): Promise<EnrichmentMetricsData> {
  // Fetch overall metrics
  const { data: overallData, error: overallError } = await supabase
    .from('filaments')
    .select('id, color_hex, tds_url, price_eur, price_gbp, price_cad, price_aud');

  if (overallError) throw overallError;

  const overall: OverallMetrics = {
    total: overallData?.length || 0,
    withColorHex: overallData?.filter(f => f.color_hex !== null).length || 0,
    withTds: overallData?.filter(f => f.tds_url !== null).length || 0,
    withEur: overallData?.filter(f => f.price_eur !== null).length || 0,
    withGbp: overallData?.filter(f => f.price_gbp !== null).length || 0,
    withCad: overallData?.filter(f => f.price_cad !== null).length || 0,
    withAud: overallData?.filter(f => f.price_aud !== null).length || 0,
  };

  // Fetch per-brand metrics with supported_regions from automated_brands
  const { data: brandsData, error: brandsError } = await supabase
    .from('automated_brands')
    .select('brand_slug, brand_name, supported_regions')
    .eq('is_visible', true);

  if (brandsError) throw brandsError;

  // Fetch filament counts per brand
  const { data: filamentsByVendor, error: vendorError } = await supabase
    .from('filaments')
    .select('vendor, color_hex, tds_url, price_eur, price_gbp, price_cad, price_aud');

  if (vendorError) throw vendorError;

  // Group filaments by vendor (case-insensitive)
  const vendorMap = new Map<string, typeof filamentsByVendor>();
  filamentsByVendor?.forEach(f => {
    const key = f.vendor?.toLowerCase() || '';
    if (!vendorMap.has(key)) {
      vendorMap.set(key, []);
    }
    vendorMap.get(key)!.push(f);
  });

  // Build brand metrics
  const brands: BrandMetrics[] = (brandsData || []).map(brand => {
    const vendorFilaments = vendorMap.get(brand.brand_name.toLowerCase()) || [];
    const total = vendorFilaments.length;
    const withColorHex = vendorFilaments.filter(f => f.color_hex !== null).length;
    const withTds = vendorFilaments.filter(f => f.tds_url !== null).length;
    const withEur = vendorFilaments.filter(f => f.price_eur !== null).length;
    const withGbp = vendorFilaments.filter(f => f.price_gbp !== null).length;
    const withCad = vendorFilaments.filter(f => f.price_cad !== null).length;
    const withAud = vendorFilaments.filter(f => f.price_aud !== null).length;

    return {
      brandSlug: brand.brand_slug,
      brandName: brand.brand_name,
      totalProducts: total,
      withColorHex,
      withTds,
      withEur,
      withGbp,
      withCad,
      withAud,
      colorCoverage: total > 0 ? Math.round((withColorHex / total) * 1000) / 10 : 0,
      tdsCoverage: total > 0 ? Math.round((withTds / total) * 1000) / 10 : 0,
      eurCoverage: total > 0 ? Math.round((withEur / total) * 1000) / 10 : 0,
      gbpCoverage: total > 0 ? Math.round((withGbp / total) * 1000) / 10 : 0,
      cadCoverage: total > 0 ? Math.round((withCad / total) * 1000) / 10 : 0,
      audCoverage: total > 0 ? Math.round((withAud / total) * 1000) / 10 : 0,
      supportedRegions: brand.supported_regions || [],
    };
  }).filter(b => b.totalProducts > 0).sort((a, b) => b.totalProducts - a.totalProducts);

  // Filter for low coverage brands
  const lowColorBrands = brands
    .filter(b => b.colorCoverage < 90)
    .sort((a, b) => a.colorCoverage - b.colorCoverage);

  const lowTdsBrands = brands
    .filter(b => b.tdsCoverage < 50)
    .sort((a, b) => b.totalProducts - a.totalProducts);

  const regionalBrands = brands
    .filter(b => b.supportedRegions && b.supportedRegions.length > 0)
    .sort((a, b) => b.totalProducts - a.totalProducts);

  return {
    overall,
    brands,
    lowColorBrands,
    lowTdsBrands,
    regionalBrands,
  };
}

export function useEnrichmentMetrics() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['enrichment-metrics'],
    queryFn: fetchEnrichmentMetrics,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['enrichment-metrics'] });
  };

  return {
    ...query,
    refresh,
    overall: query.data?.overall,
    brands: query.data?.brands || [],
    lowColorBrands: query.data?.lowColorBrands || [],
    lowTdsBrands: query.data?.lowTdsBrands || [],
    regionalBrands: query.data?.regionalBrands || [],
  };
}
