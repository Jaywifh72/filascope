import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BrandDataQuality {
  brandSlug: string;
  brandName: string;
  totalProducts: number;
  withPrices: number;
  withImages: number;
  withTds: number;
  withMpn: number;
  withColorHex: number;
  withCodes: number;
  withAmazonLinks: number;
  withAmazonPrices: number;
  completenessScore: number;
  categories: {
    basic: number;
    pricing: number;
    identifiers: number;
    enrichment: number;
  };
}

export interface FieldCoverage {
  field: string;
  label: string;
  category: string;
  filledCount: number;
  totalCount: number;
  percentage: number;
}

export function useBrandDataQuality(brandSlug?: string) {
  return useQuery({
    queryKey: ['brand-data-quality', brandSlug],
    queryFn: async () => {
      if (!brandSlug) return null;

      // Get brand info
      const { data: brand, error: brandError } = await supabase
        .from('automated_brands')
        .select('*')
        .eq('brand_slug', brandSlug)
        .single();

      if (brandError) throw brandError;
      if (!brand) return null;

      // Calculate completeness score
      const total = brand.product_count || 0;
      if (total === 0) {
        return {
          brandSlug: brand.brand_slug,
          brandName: brand.brand_name,
          totalProducts: 0,
          withPrices: 0,
          withImages: 0,
          withTds: 0,
          withMpn: 0,
          withColorHex: 0,
          withCodes: 0,
          withAmazonLinks: 0,
          withAmazonPrices: 0,
          completenessScore: 0,
          categories: { basic: 0, pricing: 0, identifiers: 0, enrichment: 0 },
        } as BrandDataQuality;
      }

      const withPrices = brand.products_with_prices || 0;
      const withImages = brand.products_with_images || 0;
      const withTds = brand.products_with_tds || 0;
      const withMpn = brand.products_with_mpn || 0;
      const withColorHex = brand.products_with_color_hex || 0;
      const withCodes = brand.products_with_codes || 0;
      const withAmazonLinks = brand.products_with_amazon_links || 0;
      const withAmazonPrices = brand.products_with_amazon_prices || 0;

      // Calculate category scores
      const basicScore = Math.round(((withPrices + withImages) / (total * 2)) * 100);
      const pricingScore = Math.round((withPrices / total) * 100);
      const identifiersScore = Math.round(((withMpn + withCodes) / (total * 2)) * 100);
      const enrichmentScore = Math.round(((withTds + withColorHex) / (total * 2)) * 100);

      // Overall completeness (weighted)
      const completenessScore = Math.round(
        (basicScore * 0.4 + pricingScore * 0.3 + identifiersScore * 0.15 + enrichmentScore * 0.15)
      );

      return {
        brandSlug: brand.brand_slug,
        brandName: brand.brand_name,
        totalProducts: total,
        withPrices,
        withImages,
        withTds,
        withMpn,
        withColorHex,
        withCodes,
        withAmazonLinks,
        withAmazonPrices,
        completenessScore,
        categories: {
          basic: basicScore,
          pricing: pricingScore,
          identifiers: identifiersScore,
          enrichment: enrichmentScore,
        },
      } as BrandDataQuality;
    },
    enabled: !!brandSlug,
    staleTime: 60_000, // 1 minute
  });
}

export function useAllBrandsDataQuality() {
  return useQuery({
    queryKey: ['all-brands-data-quality'],
    queryFn: async () => {
      const { data: brands, error } = await supabase
        .from('automated_brands')
        .select(`
          brand_slug,
          brand_name,
          display_name,
          platform_type,
          base_url,
          product_count,
          products_with_prices,
          products_with_images,
          products_with_tds,
          products_with_mpn,
          products_with_color_hex,
          products_with_codes,
          products_with_amazon_links,
          products_with_amazon_prices,
          last_scrape_at,
          scraping_enabled,
          scraping_active
        `)
        .eq('is_visible', true)
        .order('display_name');

      if (error) throw error;

      return brands.map(brand => {
        const total = brand.product_count || 0;
        if (total === 0) {
          return {
            ...brand,
            completenessScore: 0,
            categories: { basic: 0, pricing: 0, identifiers: 0, enrichment: 0 },
          };
        }

        const withPrices = brand.products_with_prices || 0;
        const withImages = brand.products_with_images || 0;
        const withTds = brand.products_with_tds || 0;
        const withMpn = brand.products_with_mpn || 0;
        const withColorHex = brand.products_with_color_hex || 0;
        const withCodes = brand.products_with_codes || 0;

        const basicScore = Math.round(((withPrices + withImages) / (total * 2)) * 100);
        const pricingScore = Math.round((withPrices / total) * 100);
        const identifiersScore = Math.round(((withMpn + withCodes) / (total * 2)) * 100);
        const enrichmentScore = Math.round(((withTds + withColorHex) / (total * 2)) * 100);

        const completenessScore = Math.round(
          (basicScore * 0.4 + pricingScore * 0.3 + identifiersScore * 0.15 + enrichmentScore * 0.15)
        );

        return {
          ...brand,
          completenessScore,
          categories: {
            basic: basicScore,
            pricing: pricingScore,
            identifiers: identifiersScore,
            enrichment: enrichmentScore,
          },
        };
      });
    },
    staleTime: 60_000,
  });
}

export function useFieldCoverage(brandSlug: string) {
  return useQuery({
    queryKey: ['field-coverage', brandSlug],
    queryFn: async () => {
      // Get brand info first
      const { data: brand } = await supabase
        .from('automated_brands')
        .select('brand_name')
        .eq('brand_slug', brandSlug)
        .single();

      if (!brand) return [];

      // Get filaments for this brand
      const { data: filaments, error } = await supabase
        .from('filaments')
        .select(`
          product_title,
          product_url,
          variant_price,
          featured_image,
          color_hex,
          mpn,
          tds_url,
          upc,
          ean,
          gtin,
          nozzle_temp_min_c,
          nozzle_temp_max_c,
          bed_temp_min_c,
          bed_temp_max_c,
          density_g_cm3,
          net_weight_g,
          material,
          diameter_nominal_mm
        `)
        .ilike('vendor', brand.brand_name);

      if (error) throw error;
      if (!filaments || filaments.length === 0) return [];

      const total = filaments.length;
      
      const fieldDefinitions = [
        { field: 'product_title', label: 'Product Title', category: 'Basic Info' },
        { field: 'product_url', label: 'Product URL', category: 'Basic Info' },
        { field: 'variant_price', label: 'Price', category: 'Pricing' },
        { field: 'featured_image', label: 'Image', category: 'Basic Info' },
        { field: 'color_hex', label: 'Color Hex', category: 'Enrichment' },
        { field: 'mpn', label: 'MPN', category: 'Identifiers' },
        { field: 'tds_url', label: 'TDS URL', category: 'Enrichment' },
        { field: 'upc', label: 'UPC', category: 'Identifiers' },
        { field: 'ean', label: 'EAN', category: 'Identifiers' },
        { field: 'gtin', label: 'GTIN', category: 'Identifiers' },
        { field: 'nozzle_temp_min_c', label: 'Nozzle Temp Min', category: 'Print Settings' },
        { field: 'nozzle_temp_max_c', label: 'Nozzle Temp Max', category: 'Print Settings' },
        { field: 'bed_temp_min_c', label: 'Bed Temp Min', category: 'Print Settings' },
        { field: 'bed_temp_max_c', label: 'Bed Temp Max', category: 'Print Settings' },
        { field: 'density_g_cm3', label: 'Density', category: 'Physical' },
        { field: 'net_weight_g', label: 'Net Weight', category: 'Physical' },
        { field: 'material', label: 'Material', category: 'Basic Info' },
        { field: 'diameter_nominal_mm', label: 'Diameter', category: 'Physical' },
      ];

      return fieldDefinitions.map(def => {
        const filledCount = filaments.filter(f => {
          const value = f[def.field as keyof typeof f];
          return value !== null && value !== undefined && value !== '';
        }).length;

        return {
          ...def,
          filledCount,
          totalCount: total,
          percentage: Math.round((filledCount / total) * 100),
        } as FieldCoverage;
      });
    },
    enabled: !!brandSlug,
    staleTime: 60_000,
  });
}
