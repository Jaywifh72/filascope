import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RETAILERS, RetailerInfo } from "@/lib/retailerData";

export interface Retailer {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  trust_score: number | null;
  shipping_speed_rating: number | null;
  customer_service_rating: number | null;
  return_policy_days: number | null;
  return_policy_type: string | null;
  restocking_fee_percent: number | null;
  free_shipping_threshold: number | null;
  flat_rate_shipping: number | null;
  regions_served: string[] | null;
  membership_program: string | null;
}

export function useRetailerData() {
  return useQuery({
    queryKey: ['retailers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('retailers')
        .select('*')
        .order('trust_score', { ascending: false });
      
      if (error) {
        console.error('Error fetching retailers:', error);
        // Fallback to static data
        return Object.values(RETAILERS).map(r => ({
          id: r.slug,
          ...r,
        })) as Retailer[];
      }
      
      return data as Retailer[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useRetailerBySlug(slug: string | undefined) {
  const { data: retailers } = useRetailerData();
  
  if (!slug) return undefined;
  
  const fromDb = retailers?.find(r => r.slug === slug);
  if (fromDb) return fromDb;
  
  // Fallback to static data
  const staticRetailer = RETAILERS[slug];
  if (staticRetailer) {
    return {
      id: staticRetailer.slug,
      ...staticRetailer,
    } as Retailer;
  }
  
  return undefined;
}

export function getRetailerFromUrl(url: string, retailers: Retailer[] | undefined): Retailer | undefined {
  if (!retailers || !url) return undefined;
  
  const urlLower = url.toLowerCase();
  
  // Match by website URL patterns
  for (const retailer of retailers) {
    if (retailer.website_url && urlLower.includes(new URL(retailer.website_url).hostname.replace('www.', ''))) {
      return retailer;
    }
  }
  
  // Common patterns
  if (urlLower.includes('amazon.')) return retailers.find(r => r.slug === 'amazon');
  if (urlLower.includes('bambulab.') || urlLower.includes('bambu-lab.')) return retailers.find(r => r.slug === 'bambu-lab');
  if (urlLower.includes('matterhackers.')) return retailers.find(r => r.slug === 'matterhackers');
  if (urlLower.includes('polymaker.')) return retailers.find(r => r.slug === 'polymaker');
  if (urlLower.includes('prusa3d.') || urlLower.includes('prusament.')) return retailers.find(r => r.slug === 'prusa');
  
  return undefined;
}
