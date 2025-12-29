import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OverallMetrics {
  total: number;
  withColorHex: number;
  withTds: number;
  withImage: number;
  withEur: number;
  withGbp: number;
  withCad: number;
  withAud: number;
  withJpy: number;
}

export interface BrandMetrics {
  brandSlug: string;
  brandName: string;
  totalProducts: number;
  withColorHex: number;
  withTds: number;
  withImage: number;
  withoutImage: number;
  withEur: number;
  withGbp: number;
  withCad: number;
  withAud: number;
  withJpy: number;
  colorCoverage: number;
  tdsCoverage: number;
  imageCoverage: number;
  eurCoverage: number;
  gbpCoverage: number;
  cadCoverage: number;
  audCoverage: number;
  jpyCoverage: number;
  supportedRegions: string[];
}

interface EnrichmentMetricsData {
  overall: OverallMetrics;
  brands: BrandMetrics[];
  lowColorBrands: BrandMetrics[];
  lowTdsBrands: BrandMetrics[];
  lowImageBrands: BrandMetrics[];
  regionalBrands: BrandMetrics[];
}

async function fetchEnrichmentMetrics(): Promise<EnrichmentMetricsData> {
  // Fetch overall metrics
  const { data: overallData, error: overallError } = await supabase
    .from('filaments')
    .select('id, color_hex, tds_url, featured_image, price_eur, price_gbp, price_cad, price_aud, price_jpy');

  if (overallError) throw overallError;

  const overall: OverallMetrics = {
    total: overallData?.length || 0,
    withColorHex: overallData?.filter(f => f.color_hex !== null).length || 0,
    withTds: overallData?.filter(f => f.tds_url !== null).length || 0,
    withImage: overallData?.filter(f => f.featured_image !== null).length || 0,
    withEur: overallData?.filter(f => f.price_eur !== null).length || 0,
    withGbp: overallData?.filter(f => f.price_gbp !== null).length || 0,
    withCad: overallData?.filter(f => f.price_cad !== null).length || 0,
    withAud: overallData?.filter(f => f.price_aud !== null).length || 0,
    withJpy: overallData?.filter(f => f.price_jpy !== null).length || 0,
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
    .select('vendor, color_hex, tds_url, featured_image, price_eur, price_gbp, price_cad, price_aud, price_jpy');

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
    const withImage = vendorFilaments.filter(f => f.featured_image !== null).length;
    const withEur = vendorFilaments.filter(f => f.price_eur !== null).length;
    const withGbp = vendorFilaments.filter(f => f.price_gbp !== null).length;
    const withCad = vendorFilaments.filter(f => f.price_cad !== null).length;
    const withAud = vendorFilaments.filter(f => f.price_aud !== null).length;
    const withJpy = vendorFilaments.filter(f => f.price_jpy !== null).length;

    return {
      brandSlug: brand.brand_slug,
      brandName: brand.brand_name,
      totalProducts: total,
      withColorHex,
      withTds,
      withImage,
      withoutImage: total - withImage,
      withEur,
      withGbp,
      withCad,
      withAud,
      withJpy,
      colorCoverage: total > 0 ? Math.round((withColorHex / total) * 1000) / 10 : 0,
      tdsCoverage: total > 0 ? Math.round((withTds / total) * 1000) / 10 : 0,
      imageCoverage: total > 0 ? Math.round((withImage / total) * 1000) / 10 : 0,
      eurCoverage: total > 0 ? Math.round((withEur / total) * 1000) / 10 : 0,
      gbpCoverage: total > 0 ? Math.round((withGbp / total) * 1000) / 10 : 0,
      cadCoverage: total > 0 ? Math.round((withCad / total) * 1000) / 10 : 0,
      audCoverage: total > 0 ? Math.round((withAud / total) * 1000) / 10 : 0,
      jpyCoverage: total > 0 ? Math.round((withJpy / total) * 1000) / 10 : 0,
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

  const lowImageBrands = brands
    .filter(b => b.imageCoverage < 90)
    .sort((a, b) => a.imageCoverage - b.imageCoverage);

  const regionalBrands = brands
    .filter(b => b.supportedRegions && b.supportedRegions.length > 0)
    .sort((a, b) => b.totalProducts - a.totalProducts);

  return {
    overall,
    brands,
    lowColorBrands,
    lowTdsBrands,
    lowImageBrands,
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
    lowImageBrands: query.data?.lowImageBrands || [],
    regionalBrands: query.data?.regionalBrands || [],
  };
}
