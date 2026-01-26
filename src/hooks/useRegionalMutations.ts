import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RegionCode, CurrencyCode } from '@/types/regional';

export interface RegionalUrlInput {
  id?: string;
  product_id: string;
  product_type: 'filament' | 'printer';
  region_code: RegionCode;
  store_url: string;
  store_name?: string;
  currency_code: CurrencyCode;
  is_primary?: boolean;
  is_verified?: boolean;
}

export interface RegionalPriceInput {
  id?: string;
  product_id: string;
  product_type: 'filament' | 'printer';
  region_code: RegionCode;
  currency_code: CurrencyCode;
  current_price?: number | null;
  msrp?: number | null;
  compare_at_price?: number | null;
}

export function useSaveRegionalUrls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      productType,
      urls,
    }: {
      productId: string;
      productType: 'filament' | 'printer';
      urls: RegionalUrlInput[];
    }) => {
      // First, delete existing URLs for this product
      const { error: deleteError } = await supabase
        .from('product_regional_urls')
        .delete()
        .eq('product_id', productId)
        .eq('product_type', productType);

      if (deleteError) {
        throw new Error(`Failed to clear existing URLs: ${deleteError.message}`);
      }

      // Then insert new URLs
      if (urls.length > 0) {
        const toInsert = urls.map((url) => ({
          product_id: productId,
          product_type: productType,
          region_code: url.region_code,
          store_url: url.store_url,
          store_name: url.store_name || null,
          currency_code: url.currency_code,
          is_primary: url.is_primary || false,
          is_verified: url.is_verified || false,
        }));

        const { error: insertError } = await supabase
          .from('product_regional_urls')
          .insert(toInsert);

        if (insertError) {
          throw new Error(`Failed to save URLs: ${insertError.message}`);
        }
      }

      // Update the has_regional_urls flag on the product
      const tableName = productType === 'filament' ? 'filaments' : 'printers';
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          has_regional_urls: urls.length > 0,
          available_regions: urls.map((u) => u.region_code),
        })
        .eq('id', productId);

      if (updateError) {
        console.error('Failed to update product flags:', updateError);
      }

      return { success: true, count: urls.length };
    },
    onSuccess: (data, variables) => {
      toast.success(`Saved ${data.count} regional URL(s)`);
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['admin-filaments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-printers'] });
      queryClient.invalidateQueries({ queryKey: ['product-regional-urls', variables.productId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSaveRegionalPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      productType,
      prices,
    }: {
      productId: string;
      productType: 'filament' | 'printer';
      prices: RegionalPriceInput[];
    }) => {
      // Upsert prices - use region as the key
      for (const price of prices) {
        const { error } = await supabase
          .from('product_regional_prices')
          .upsert(
            {
              product_id: productId,
              product_type: productType,
              region_code: price.region_code,
              currency_code: price.currency_code,
              current_price: price.current_price,
              msrp: price.msrp,
              compare_at_price: price.compare_at_price,
            },
            {
              onConflict: 'product_id,product_type,region_code',
            }
          );

        if (error) {
          throw new Error(`Failed to save ${price.region_code} price: ${error.message}`);
        }
      }

      return { success: true, count: prices.length };
    },
    onSuccess: (data, variables) => {
      toast.success(`Saved ${data.count} regional price(s)`);
      queryClient.invalidateQueries({ queryKey: ['admin-filaments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-printers'] });
      queryClient.invalidateQueries({ queryKey: ['product-regional-prices', variables.productId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useFetchRegionalData(productId: string | null, productType: 'filament' | 'printer') {
  const queryClient = useQueryClient();

  const fetchUrls = async () => {
    if (!productId) return [];
    
    const { data, error } = await supabase
      .from('product_regional_urls')
      .select('*')
      .eq('product_id', productId)
      .eq('product_type', productType)
      .order('region_code');

    if (error) {
      console.error('Error fetching regional URLs:', error);
      return [];
    }

    return data || [];
  };

  const fetchPrices = async () => {
    if (!productId) return [];
    
    const { data, error } = await supabase
      .from('product_regional_prices')
      .select('*')
      .eq('product_id', productId)
      .eq('product_type', productType)
      .order('region_code');

    if (error) {
      console.error('Error fetching regional prices:', error);
      return [];
    }

    return data || [];
  };

  return { fetchUrls, fetchPrices };
}
