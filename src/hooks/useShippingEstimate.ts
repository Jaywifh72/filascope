import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { estimateShipping, ShippingEstimate } from "@/lib/shippingZones";
import { Retailer } from "./useRetailerData";

export interface ShippingEstimateResult extends ShippingEstimate {
  retailerId: string;
  retailerName: string;
}

export function useShippingEstimates(
  zipCode: string | undefined,
  country: string,
  cartTotal: number,
  retailers: Retailer[] | undefined
) {
  return useMemo(() => {
    if (!zipCode || !retailers) return [];
    
    return retailers.map(retailer => {
      const estimate = estimateShipping(
        zipCode,
        country,
        cartTotal,
        retailer.free_shipping_threshold,
        retailer.flat_rate_shipping,
        'US' // Assume US origin for now
      );
      
      return {
        ...estimate,
        retailerId: retailer.id,
        retailerName: retailer.name,
      };
    });
  }, [zipCode, country, cartTotal, retailers]);
}

export function useShippingEstimateFromDb(
  retailerId: string | undefined,
  zipPrefix: string | undefined,
  country: string
) {
  return useQuery({
    queryKey: ['shipping-estimate', retailerId, zipPrefix, country],
    queryFn: async () => {
      if (!retailerId || !zipPrefix) return null;
      
      const { data, error } = await supabase
        .from('shipping_estimates')
        .select('*')
        .eq('retailer_id', retailerId)
        .eq('dest_country', country)
        .eq('dest_zip_prefix', zipPrefix)
        .single();
      
      if (error) {
        // No specific estimate found, will use zone-based calculation
        return null;
      }
      
      return data;
    },
    enabled: !!retailerId && !!zipPrefix,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export function calculateTotalCost(
  productPrice: number,
  shippingCost: number,
  importFees: number = 0
): number {
  return Math.round((productPrice + shippingCost + importFees) * 100) / 100;
}

export function formatShippingCost(estimate: ShippingEstimate, isPrimeMember: boolean = false): string {
  if (estimate.isFree) {
    return 'Free Shipping';
  }
  
  if (isPrimeMember && estimate.cost === 0) {
    return 'Free with Prime';
  }
  
  return `$${estimate.cost.toFixed(2)}`;
}
