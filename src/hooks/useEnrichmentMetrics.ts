import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OverallMetrics {
  total: number;
  withColorHex: number;
  withTds: number;
  withImage: number;
  withFullParsing: number;
  withEur: number;
  withGbp: number;
  withCad: number;
  withAud: number;
  withJpy: number;
}

export interface BrandMetrics {
  brandId?: string;
  brandSlug: string;
  brandName: string;
  totalProducts: number;
  withColorHex: number;
  withTds: number;
  withImage: number;
  withoutImage: number;
  withFullParsing: number;
  withEur: number;
  withGbp: number;
  withCad: number;
  withAud: number;
  withJpy: number;
  colorCoverage: number;
  tdsCoverage: number;
  imageCoverage: number;
  parsingCoverage: number;
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
  lowParsingBrands: BrandMetrics[];
  regionalBrands: BrandMetrics[];
}

// Helper to check if a filament has full parsing (core specs extracted)
function hasFullParsing(f: { tds_url: string | null; nozzle_temp_min_c: number | null; drying_temp_c: number | null; density_g_cm3: number | null }) {
  return f.tds_url && f.nozzle_temp_min_c && f.drying_temp_c;
}

// Paginated fetch to bypass 1000-row limit
type FilamentMetricRow = {
  id?: string;
  vendor: string | null;
  color_hex: string | null;
  tds_url: string | null;
  featured_image: string | null;
  nozzle_temp_min_c: number | null;
  drying_temp_c: number | null;
  density_g_cm3: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_cad: number | null;
  price_aud: number | null;
  price_jpy: number | null;
};

async function fetchAllFilaments(): Promise<FilamentMetricRow[]> {
  const PAGE_SIZE = 1000;
  const allData: FilamentMetricRow[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('filaments')
      .select('id, vendor, color_hex, tds_url, featured_image, nozzle_temp_min_c, drying_temp_c, density_g_cm3, price_eur, price_gbp, price_cad, price_aud, price_jpy')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    if (data && data.length > 0) {
      allData.push(...data);
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allData;
}

async function fetchEnrichmentMetrics(): Promise<EnrichmentMetricsData> {
  // Fetch all filaments with pagination
  const allFilaments = await fetchAllFilaments();

  const overall: OverallMetrics = {
    total: allFilaments.length,
    withColorHex: allFilaments.filter(f => f.color_hex !== null).length,
    withTds: allFilaments.filter(f => f.tds_url !== null).length,
    withImage: allFilaments.filter(f => f.featured_image !== null).length,
    withFullParsing: allFilaments.filter(f => f.tds_url && f.nozzle_temp_min_c && f.drying_temp_c && f.density_g_cm3).length,
    withEur: allFilaments.filter(f => f.price_eur !== null).length,
    withGbp: allFilaments.filter(f => f.price_gbp !== null).length,
    withCad: allFilaments.filter(f => f.price_cad !== null).length,
    withAud: allFilaments.filter(f => f.price_aud !== null).length,
    withJpy: allFilaments.filter(f => f.price_jpy !== null).length,
  };

  const { data: brandsData, error: brandsError } = await supabase
    .from('automated_brands')
    .select('id, brand_slug, brand_name, supported_regions')
    .eq('is_visible', true);

  if (brandsError) throw brandsError;

  // Build vendor map from all filaments
  const vendorMap = new Map<string, FilamentMetricRow[]>();
  allFilaments.forEach(f => {
    const key = f.vendor?.toLowerCase() || '';
    if (!vendorMap.has(key)) vendorMap.set(key, []);
    vendorMap.get(key)!.push(f);
  });

  const brands: BrandMetrics[] = (brandsData || []).map(brand => {
    const vendorFilaments = vendorMap.get(brand.brand_name.toLowerCase()) || [];
    const total = vendorFilaments.length;
    const withColorHex = vendorFilaments.filter(f => f.color_hex !== null).length;
    const withTds = vendorFilaments.filter(f => f.tds_url !== null).length;
    const withImage = vendorFilaments.filter(f => f.featured_image !== null).length;
    const withFullParsing = vendorFilaments.filter(f => f.tds_url && f.nozzle_temp_min_c && f.drying_temp_c && f.density_g_cm3).length;
    const withEur = vendorFilaments.filter(f => f.price_eur !== null).length;
    const withGbp = vendorFilaments.filter(f => f.price_gbp !== null).length;
    const withCad = vendorFilaments.filter(f => f.price_cad !== null).length;
    const withAud = vendorFilaments.filter(f => f.price_aud !== null).length;
    const withJpy = vendorFilaments.filter(f => f.price_jpy !== null).length;

    return {
      brandId: brand.id,
      brandSlug: brand.brand_slug,
      brandName: brand.brand_name,
      totalProducts: total,
      withColorHex,
      withTds,
      withImage,
      withoutImage: total - withImage,
      withFullParsing,
      withEur,
      withGbp,
      withCad,
      withAud,
      withJpy,
      colorCoverage: total > 0 ? Math.round((withColorHex / total) * 1000) / 10 : 0,
      tdsCoverage: total > 0 ? Math.round((withTds / total) * 1000) / 10 : 0,
      imageCoverage: total > 0 ? Math.round((withImage / total) * 1000) / 10 : 0,
      parsingCoverage: withTds > 0 ? Math.round((withFullParsing / withTds) * 1000) / 10 : 0,
      eurCoverage: total > 0 ? Math.round((withEur / total) * 1000) / 10 : 0,
      gbpCoverage: total > 0 ? Math.round((withGbp / total) * 1000) / 10 : 0,
      cadCoverage: total > 0 ? Math.round((withCad / total) * 1000) / 10 : 0,
      audCoverage: total > 0 ? Math.round((withAud / total) * 1000) / 10 : 0,
      jpyCoverage: total > 0 ? Math.round((withJpy / total) * 1000) / 10 : 0,
      supportedRegions: brand.supported_regions || [],
    };
  }).filter(b => b.totalProducts > 0).sort((a, b) => b.totalProducts - a.totalProducts);

  const lowColorBrands = brands.filter(b => b.colorCoverage < 90).sort((a, b) => a.colorCoverage - b.colorCoverage);
  const lowTdsBrands = brands.filter(b => b.tdsCoverage < 50).sort((a, b) => b.totalProducts - a.totalProducts);
  const lowImageBrands = brands.filter(b => b.imageCoverage < 90).sort((a, b) => a.imageCoverage - b.imageCoverage);
  const lowParsingBrands = brands.filter(b => b.withTds > 0 && b.parsingCoverage < 80).sort((a, b) => b.withTds - a.withTds);
  const regionalBrands = brands.filter(b => b.supportedRegions && b.supportedRegions.length > 0).sort((a, b) => b.totalProducts - a.totalProducts);

  return { overall, brands, lowColorBrands, lowTdsBrands, lowImageBrands, lowParsingBrands, regionalBrands };
}

export function useEnrichmentMetrics() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['enrichment-metrics'],
    queryFn: fetchEnrichmentMetrics,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
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
    lowParsingBrands: query.data?.lowParsingBrands || [],
    regionalBrands: query.data?.regionalBrands || [],
  };
}
