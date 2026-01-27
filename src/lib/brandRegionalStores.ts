/**
 * Regional Store URL Configuration for Filament Brands
 * 
 * This maps each brand to their regional store URL patterns.
 * Zero database changes - purely client-side URL transformation.
 */

export type RegionCode = 'US' | 'CA' | 'UK' | 'EU' | 'AU' | 'JP' | 'CN' | 'KR' | 'IN' | 'MX' | 'BR' | 'NZ' | 'DE' | 'FR' | 'ES' | 'IT' | 'PL';

export interface RegionConfig {
  subdomain?: string;
  pathPrefix?: string;
  domain?: string;
  currency: string;
}

export interface BrandStoreConfig {
  /** URL pattern type: subdomain (us.store.com), path (/en-us/), or global (single store) */
  pattern: 'subdomain' | 'path' | 'global';
  /** Base domain without subdomain */
  baseDomain: string;
  /** Regional configurations */
  regions?: Partial<Record<RegionCode, RegionConfig>>;
  /** Default currency for global stores */
  defaultCurrency?: string;
  /** Fallback region if user's region not available */
  fallbackRegion?: RegionCode;
}

/**
 * Comprehensive brand regional store configuration
 * Add new brands here as needed - zero risk to existing code
 */
export const BRAND_REGIONAL_STORES: Record<string, BrandStoreConfig> = {
  // === CANADIAN MANUFACTURERS ===
  
  'Matter3D': {
    pattern: 'global',
    baseDomain: 'matter3d.com',
    defaultCurrency: 'CAD',
    fallbackRegion: 'CA',
    regions: {
      CA: { subdomain: 'www', currency: 'CAD' },
      US: { subdomain: 'www', currency: 'CAD' }, // Ships to US, prices in CAD
    }
  },

  // === MAJOR BRANDS WITH REGIONAL STORES ===
  
  'Bambu Lab': {
    pattern: 'subdomain',
    baseDomain: 'store.bambulab.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
      JP: { subdomain: 'jp', currency: 'JPY' },
      CN: { subdomain: 'cn', currency: 'CNY' },
    }
  },

  'Polymaker': {
    pattern: 'subdomain',
    baseDomain: 'polymaker.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },

  'Creality': {
    pattern: 'subdomain',
    baseDomain: 'store.creality.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
    }
  },

  'Anycubic': {
    pattern: 'subdomain',
    baseDomain: 'anycubic.com',
    fallbackRegion: 'US',
    regions: {
      // North America
      US: { subdomain: 'store', currency: 'USD' },  // store.anycubic.com
      CA: { subdomain: 'ca', currency: 'CAD' },     // ca.anycubic.com
      // Europe - subdomains
      UK: { subdomain: 'uk', currency: 'GBP' },     // uk.anycubic.com
      EU: { subdomain: 'eu', currency: 'EUR' },     // eu.anycubic.com
      DE: { subdomain: 'de', currency: 'EUR' },     // de.anycubic.com
      FR: { subdomain: 'fr', currency: 'EUR' },     // fr.anycubic.com
      // Europe - different domains (use domain override)
      ES: { domain: 'www.anycubic.es', currency: 'EUR' },         // anycubic.es
      IT: { domain: 'anycubic.it', currency: 'EUR' },             // anycubic.it
      PL: { domain: 'anycubicofficial.pl', currency: 'PLN' },     // anycubicofficial.pl
      // Asia Pacific
      AU: { domain: 'www.anycubic.au', currency: 'AUD' },         // anycubic.au
    }
  },

  'Elegoo': {
    pattern: 'subdomain',
    baseDomain: 'elegoo.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'us', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
    }
  },

  'QIDI': {
    pattern: 'subdomain',
    baseDomain: 'qidi3d.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },

  'Flashforge': {
    pattern: 'subdomain',
    baseDomain: 'flashforge.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      CA: { subdomain: 'ca', currency: 'CAD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
      DE: { subdomain: 'de', currency: 'EUR' },
      FR: { subdomain: 'fr', currency: 'EUR' },
      ES: { subdomain: 'es', currency: 'EUR' },
      AU: { subdomain: 'au', currency: 'AUD' },
    }
  },

  'Eryone': {
    pattern: 'subdomain',
    baseDomain: 'eryone3d.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },

  'Jayo': {
    pattern: 'subdomain',
    baseDomain: 'jayo3d.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      UK: { subdomain: 'uk', currency: 'GBP' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },

  'Kingroon': {
    pattern: 'subdomain',
    baseDomain: 'kingroon.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },

  'Sovol': {
    pattern: 'subdomain',
    baseDomain: 'sovol3d.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },

  'Artillery': {
    pattern: 'subdomain',
    baseDomain: 'artillery3d.com',
    fallbackRegion: 'US',
    regions: {
      US: { subdomain: 'www', currency: 'USD' },
      EU: { subdomain: 'eu', currency: 'EUR' },
    }
  },

  // === GLOBAL STORES (Single URL, multi-currency checkout) ===

  'Prusa Research': {
    pattern: 'global',
    baseDomain: 'www.prusa3d.com',
    defaultCurrency: 'EUR',
  },

  'Prusament': {
    pattern: 'global',
    baseDomain: 'www.prusa3d.com',
    defaultCurrency: 'EUR',
  },

  'ColorFabb': {
    pattern: 'global',
    baseDomain: 'colorfabb.com',
    defaultCurrency: 'EUR',
  },

  'Fillamentum': {
    pattern: 'global',
    baseDomain: 'fillamentum.com',
    defaultCurrency: 'EUR',
  },

  'FormFutura': {
    pattern: 'global',
    baseDomain: 'formfutura.com',
    defaultCurrency: 'EUR',
  },

  'eSun': {
    pattern: 'global',
    baseDomain: 'www.esun3dstore.com',
    defaultCurrency: 'USD',
  },

  'SUNLU': {
    pattern: 'global',
    baseDomain: 'www.sunlu.com',
    defaultCurrency: 'USD',
  },

  'Hatchbox': {
    pattern: 'global',
    baseDomain: 'www.hatchbox3d.com',
    defaultCurrency: 'USD',
  },

  'Overture': {
    pattern: 'global',
    baseDomain: 'overture3d.com',
    defaultCurrency: 'USD',
  },

  'Inland': {
    pattern: 'global',
    baseDomain: 'www.microcenter.com',
    defaultCurrency: 'USD',
  },

  'MatterHackers': {
    pattern: 'global',
    baseDomain: 'www.matterhackers.com',
    defaultCurrency: 'USD',
  },

  '3DXTech': {
    pattern: 'global',
    baseDomain: '3dxtech.com',
    defaultCurrency: 'USD',
  },

  'NinjaTek': {
    pattern: 'global',
    baseDomain: 'ninjatek.com',
    defaultCurrency: 'USD',
  },

  'Atomic Filament': {
    pattern: 'global',
    baseDomain: 'atomicfilament.com',
    defaultCurrency: 'USD',
  },

  'Proto-pasta': {
    pattern: 'global',
    baseDomain: 'www.proto-pasta.com',
    defaultCurrency: 'USD',
  },

  'Printed Solid': {
    pattern: 'global',
    baseDomain: 'printedsolid.com',
    defaultCurrency: 'USD',
  },

  'Fiberlogy': {
    pattern: 'global',
    baseDomain: 'fiberlogy.com',
    defaultCurrency: 'EUR',
  },

  'Extrudr': {
    pattern: 'global',
    baseDomain: 'www.extrudr.com',
    defaultCurrency: 'EUR',
  },

  'BASF Forward AM': {
    pattern: 'global',
    baseDomain: 'forward-am.com',
    defaultCurrency: 'EUR',
  },

  'Kimya': {
    pattern: 'global',
    baseDomain: 'www.kimya.fr',
    defaultCurrency: 'EUR',
  },

  'Spectrum Filaments': {
    pattern: 'global',
    baseDomain: 'spectrumfilaments.com',
    defaultCurrency: 'EUR',
  },

  'Raise3D': {
    pattern: 'global',
    baseDomain: 'www.raise3d.com',
    defaultCurrency: 'USD',
  },

  'Zortrax': {
    pattern: 'global',
    baseDomain: 'zortrax.com',
    defaultCurrency: 'EUR',
  },

  'Tiertime': {
    pattern: 'global',
    baseDomain: 'shop.tiertime.com',
    defaultCurrency: 'USD',
  },

  'Ultimaker': {
    pattern: 'global',
    baseDomain: 'ultimaker.com',
    defaultCurrency: 'EUR',
  },

  'Markforged': {
    pattern: 'global',
    baseDomain: 'markforged.com',
    defaultCurrency: 'USD',
  },

  'AMOLEN': {
    pattern: 'global',
    baseDomain: 'amolen.com',
    defaultCurrency: 'USD',
  },

  // Eryone moved to regional section above

  'Geeetech': {
    pattern: 'global',
    baseDomain: 'www.geeetech.com',
    defaultCurrency: 'USD',
  },

  'Gizmo Dorks': {
    pattern: 'global',
    baseDomain: 'gizmodorks.com',
    defaultCurrency: 'USD',
  },

  'Ziro': {
    pattern: 'global',
    baseDomain: 'ziro3d.com',
    defaultCurrency: 'USD',
  },

  'Voxelab': {
    pattern: 'global',
    baseDomain: 'www.voxelab3dp.com',
    defaultCurrency: 'USD',
  },

  // Kingroon moved to regional section above

  'Longer': {
    pattern: 'global',
    baseDomain: 'www.longer3d.com',
    defaultCurrency: 'USD',
  },

  // Artillery moved to regional section above

  // Sovol moved to regional section above

  'Tronxy': {
    pattern: 'global',
    baseDomain: 'www.tronxy.com',
    defaultCurrency: 'USD',
  },

  'Two Trees': {
    pattern: 'global',
    baseDomain: 'www.twotrees3d.com',
    defaultCurrency: 'USD',
  },

  'FLSUN': {
    pattern: 'global',
    baseDomain: 'flsun3d.com',
    defaultCurrency: 'USD',
  },

  'Phrozen': {
    pattern: 'global',
    baseDomain: 'phrozen3d.com',
    defaultCurrency: 'USD',
  },

  'Phaetus': {
    pattern: 'global',
    baseDomain: 'www.phaetus.com',
    defaultCurrency: 'USD',
  },

  'E3D': {
    pattern: 'global',
    baseDomain: 'e3d-online.com',
    defaultCurrency: 'GBP',
  },

  'Slice Engineering': {
    pattern: 'global',
    baseDomain: 'www.sliceengineering.com',
    defaultCurrency: 'USD',
  },

  'Bondtech': {
    pattern: 'global',
    baseDomain: 'www.bondtech.se',
    defaultCurrency: 'EUR',
  },
  
  // === ADDITIONAL GLOBAL BRANDS (for Carbon Fiber and other products) ===
  
  'TreeD Filaments': {
    pattern: 'global',
    baseDomain: 'treedfilaments.com',
    defaultCurrency: 'EUR',
  },
  
  'Push Plastic': {
    pattern: 'global',
    baseDomain: 'www.pushplastic.com',
    defaultCurrency: 'USD',
  },
  
  'Numakers': {
    pattern: 'global',
    baseDomain: 'numakers.com',
    defaultCurrency: 'USD',
  },
  
  'IC3D Printers': {
    pattern: 'global',
    baseDomain: 'ic3dprinters.com',
    defaultCurrency: 'USD',
  },
  
  'AzureFilm': {
    pattern: 'global',
    baseDomain: 'azurefilm.com',
    defaultCurrency: 'EUR',
  },
  
  '3D-Fuel': {
    pattern: 'global',
    baseDomain: '3dfuel.com',
    defaultCurrency: 'USD',
  },
};

/**
 * Get brand config with case-insensitive matching
 */
export function getBrandConfig(vendor: string | null | undefined): BrandStoreConfig | null {
  if (!vendor) return null;
  
  // Direct match
  if (BRAND_REGIONAL_STORES[vendor]) {
    return BRAND_REGIONAL_STORES[vendor];
  }
  
  // Case-insensitive match
  const normalizedVendor = vendor.toLowerCase().trim();
  for (const [brand, config] of Object.entries(BRAND_REGIONAL_STORES)) {
    if (brand.toLowerCase() === normalizedVendor) {
      return config;
    }
  }
  
  // Partial match for common variations (case-insensitive mappings)
  const variations: Record<string, string> = {
    'bambulab': 'Bambu Lab',
    'bambu': 'Bambu Lab',
    'prusa': 'Prusa Research',
    'colorfabb': 'ColorFabb',
    'esun': 'eSun',
    'sunlu': 'SUNLU',
    'qidi tech': 'QIDI',
    'qidi': 'QIDI',
    'proto-pasta': 'Proto-pasta',
    'protopasta': 'Proto-pasta',
    'amolen': 'AMOLEN',
    'spectrum': 'Spectrum Filaments',
    'spectrum filaments': 'Spectrum Filaments',
    'treed': 'TreeD Filaments',
    'treed filaments': 'TreeD Filaments',
    '3dxtech': '3DXTech',
    'atomic': 'Atomic Filament',
    'atomic filament': 'Atomic Filament',
    'formfutura': 'FormFutura',
    'fillamentum': 'Fillamentum',
    'gizmo dorks': 'Gizmo Dorks',
    'gizmodorks': 'Gizmo Dorks',
    'ultimaker': 'Ultimaker',
    'push plastic': 'Push Plastic',
    'pushplastic': 'Push Plastic',
    'numakers': 'Numakers',
    'ic3d': 'IC3D Printers',
    'ic3d printers': 'IC3D Printers',
    'matter3d': 'Matter3D',
    '3d-fuel': '3D-Fuel',
    '3dfuel': '3D-Fuel',
    'azurefilm': 'AzureFilm',
    'hatchbox': 'Hatchbox',
    'overture': 'Overture',
    'extrudr': 'Extrudr',
    'prusament': 'Prusament',
    'geeetech': 'Geeetech',
    'ziro': 'Ziro',
  };
  
  const variation = variations[normalizedVendor];
  if (variation && BRAND_REGIONAL_STORES[variation]) {
    return BRAND_REGIONAL_STORES[variation];
  }
  
  return null;
}
