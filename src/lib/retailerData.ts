// Static retailer data for fallback when database is unavailable

export interface RetailerInfo {
  slug: string;
  name: string;
  logo_url: string;
  website_url: string;
  trust_score: number;
  shipping_speed_rating: number;
  customer_service_rating: number;
  return_policy_days: number;
  return_policy_type: 'no_questions' | 'restocking_fee' | 'store_credit';
  restocking_fee_percent: number;
  free_shipping_threshold: number | null;
  flat_rate_shipping: number | null;
  regions_served: string[];
  membership_program: string | null;
}

export const RETAILERS: Record<string, RetailerInfo> = {
  'amazon': {
    slug: 'amazon',
    name: 'Amazon',
    logo_url: '/images/retailers/amazon.svg',
    website_url: 'https://amazon.com',
    trust_score: 4.8,
    shipping_speed_rating: 5.0,
    customer_service_rating: 4.5,
    return_policy_days: 30,
    return_policy_type: 'no_questions',
    restocking_fee_percent: 0,
    free_shipping_threshold: 25,
    flat_rate_shipping: null,
    regions_served: ['US', 'CA', 'UK', 'EU', 'JP', 'AU'],
    membership_program: 'prime',
  },
  'bambu-lab': {
    slug: 'bambu-lab',
    name: 'Bambu Lab',
    logo_url: '/images/brands/bambu-lab.webp',
    website_url: 'https://store.bambulab.com',
    trust_score: 4.9,
    shipping_speed_rating: 4.5,
    customer_service_rating: 4.8,
    return_policy_days: 30,
    return_policy_type: 'no_questions',
    restocking_fee_percent: 0,
    free_shipping_threshold: 49,
    flat_rate_shipping: null,
    regions_served: ['US', 'CA', 'UK', 'EU', 'JP', 'AU'],
    membership_program: null,
  },
  'matterhackers': {
    slug: 'matterhackers',
    name: 'MatterHackers',
    logo_url: '/images/brands/matterhackers.webp',
    website_url: 'https://matterhackers.com',
    trust_score: 4.2,
    shipping_speed_rating: 4.0,
    customer_service_rating: 4.8,
    return_policy_days: 14,
    return_policy_type: 'restocking_fee',
    restocking_fee_percent: 15,
    free_shipping_threshold: 35,
    flat_rate_shipping: null,
    regions_served: ['US'],
    membership_program: null,
  },
  'polymaker': {
    slug: 'polymaker',
    name: 'Polymaker',
    logo_url: '/images/brands/polymaker.webp',
    website_url: 'https://polymaker.com',
    trust_score: 4.5,
    shipping_speed_rating: 4.0,
    customer_service_rating: 4.5,
    return_policy_days: 30,
    return_policy_type: 'no_questions',
    restocking_fee_percent: 0,
    free_shipping_threshold: 49,
    flat_rate_shipping: null,
    regions_served: ['US', 'CA', 'UK', 'EU', 'AU'],
    membership_program: null,
  },
  'prusa': {
    slug: 'prusa',
    name: 'Prusa Research',
    logo_url: '/images/brands/prusa-research.png',
    website_url: 'https://prusa3d.com',
    trust_score: 4.7,
    shipping_speed_rating: 4.0,
    customer_service_rating: 4.9,
    return_policy_days: 14,
    return_policy_type: 'no_questions',
    restocking_fee_percent: 0,
    free_shipping_threshold: 75,
    flat_rate_shipping: null,
    regions_served: ['US', 'CA', 'UK', 'EU', 'AU'],
    membership_program: 'insider',
  },
  'fillamentum': {
    slug: 'fillamentum',
    name: 'Fillamentum',
    logo_url: '/images/brands/fillamentum.webp',
    website_url: 'https://fillamentum.com',
    trust_score: 4.6,
    shipping_speed_rating: 3.5,
    customer_service_rating: 4.5,
    return_policy_days: 14,
    return_policy_type: 'restocking_fee',
    restocking_fee_percent: 10,
    free_shipping_threshold: 100,
    flat_rate_shipping: null,
    regions_served: ['EU', 'US'],
    membership_program: null,
  },
  'colorfabb': {
    slug: 'colorfabb',
    name: 'ColorFabb',
    logo_url: '/images/brands/colorfabb.webp',
    website_url: 'https://colorfabb.com',
    trust_score: 4.5,
    shipping_speed_rating: 3.5,
    customer_service_rating: 4.5,
    return_policy_days: 14,
    return_policy_type: 'no_questions',
    restocking_fee_percent: 0,
    free_shipping_threshold: 75,
    flat_rate_shipping: null,
    regions_served: ['EU', 'US', 'CA'],
    membership_program: null,
  },
  'esun': {
    slug: 'esun',
    name: 'eSun',
    logo_url: '/images/brands/esun.webp',
    website_url: 'https://esun3d.com',
    trust_score: 4.0,
    shipping_speed_rating: 3.5,
    customer_service_rating: 3.8,
    return_policy_days: 30,
    return_policy_type: 'restocking_fee',
    restocking_fee_percent: 15,
    free_shipping_threshold: 50,
    flat_rate_shipping: null,
    regions_served: ['US', 'EU', 'AU'],
    membership_program: null,
  },
  'overture': {
    slug: 'overture',
    name: 'Overture',
    logo_url: '/images/brands/overture.webp',
    website_url: 'https://overture3d.com',
    trust_score: 4.1,
    shipping_speed_rating: 4.0,
    customer_service_rating: 4.0,
    return_policy_days: 30,
    return_policy_type: 'no_questions',
    restocking_fee_percent: 0,
    free_shipping_threshold: 39,
    flat_rate_shipping: null,
    regions_served: ['US'],
    membership_program: null,
  },
  'hatchbox': {
    slug: 'hatchbox',
    name: 'Hatchbox',
    logo_url: '/images/brands/hatchbox.webp',
    website_url: 'https://hatchbox3d.com',
    trust_score: 4.3,
    shipping_speed_rating: 4.0,
    customer_service_rating: 4.2,
    return_policy_days: 30,
    return_policy_type: 'no_questions',
    restocking_fee_percent: 0,
    free_shipping_threshold: 39,
    flat_rate_shipping: null,
    regions_served: ['US'],
    membership_program: null,
  },
};

export function getRetailerBySlug(slug: string): RetailerInfo | undefined {
  return RETAILERS[slug.toLowerCase()];
}

export function getRetailerByUrl(url: string): RetailerInfo | undefined {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('amazon.')) return RETAILERS['amazon'];
  if (urlLower.includes('bambulab.') || urlLower.includes('bambu-lab.')) return RETAILERS['bambu-lab'];
  if (urlLower.includes('matterhackers.')) return RETAILERS['matterhackers'];
  if (urlLower.includes('polymaker.')) return RETAILERS['polymaker'];
  if (urlLower.includes('prusa3d.') || urlLower.includes('prusament.')) return RETAILERS['prusa'];
  if (urlLower.includes('fillamentum.')) return RETAILERS['fillamentum'];
  if (urlLower.includes('colorfabb.')) return RETAILERS['colorfabb'];
  if (urlLower.includes('esun3d.') || urlLower.includes('esun.')) return RETAILERS['esun'];
  if (urlLower.includes('overture3d.') || urlLower.includes('overture.')) return RETAILERS['overture'];
  if (urlLower.includes('hatchbox3d.') || urlLower.includes('hatchbox.')) return RETAILERS['hatchbox'];
  
  return undefined;
}

export function detectRetailerFromVendor(vendor: string): RetailerInfo | undefined {
  const vendorLower = vendor.toLowerCase().replace(/\s+/g, '-');
  
  // Direct matches
  if (RETAILERS[vendorLower]) return RETAILERS[vendorLower];
  
  // Partial matches
  for (const [key, retailer] of Object.entries(RETAILERS)) {
    if (vendorLower.includes(key) || retailer.name.toLowerCase().includes(vendor.toLowerCase())) {
      return retailer;
    }
  }
  
  return undefined;
}
