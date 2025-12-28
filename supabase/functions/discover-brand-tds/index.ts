import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TdsDiscoveryResult {
  filamentId: string;
  productTitle: string;
  productUrl: string | null;
  tdsUrl: string | null;
  source: string;
  success: boolean;
  error?: string;
}

// Common TDS URL patterns across manufacturers
const TDS_PATTERNS = [
  // Direct PDF links
  /href="([^"]+(?:tds|technical[-_]?data|datasheet|spec(?:ification)?[-_]?sheet)[^"]*\.pdf)"/gi,
  /href="([^"]+\.pdf)"[^>]*>(?:[^<]*(?:TDS|Technical|Datasheet|Specification|Spec\s*Sheet))/gi,
  // CDN-hosted PDFs
  /href="([^"]+cdn[^"]+\.pdf)"/gi,
  // Google Drive/Docs links
  /href="(https:\/\/drive\.google\.com\/[^"]+)"/gi,
  // Dropbox links
  /href="(https:\/\/(?:www\.)?dropbox\.com\/[^"]+\.pdf[^"]*)"/gi,
];

// Known TDS URL patterns by brand with centralized TDS URLs
interface BrandTdsConfig {
  patterns?: RegExp[];
  knownUrls?: Record<string, string>;
}

const BRAND_TDS_CONFIGS: Record<string, BrandTdsConfig> = {
  // === MAJOR BRANDS WITH KNOWN TDS URL PATTERNS ===
  
  'anycubic': {
    patterns: [
      /href="([^"]*nice-cdn\.com[^"]*\.pdf)"/gi,
      /href="([^"]*anycubic[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PLA_V3.0.pdf',
      'pla+': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PLA_V3.0.pdf',
      'pla basic': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PLA_V3.0.pdf',
      'high speed pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_High_Speed_PLA.pdf',
      'hs pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_High_Speed_PLA.pdf',
      'silk pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_SILK_PLA.pdf',
      'matte pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_Matte_PLA.pdf',
      'petg': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PETG.pdf',
      'abs': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_ABS.pdf',
      'tpu': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_TPU.pdf',
      'asa': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_ASA.pdf',
    }
  },
  
  'creality': {
    patterns: [
      /href="([^"]*download\.creality\.com[^"]*\.pdf)"/gi,
      /href="([^"]*creality[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://download.creality.com/download/filament/TDS_PLA.pdf',
      'pla+': 'https://download.creality.com/download/filament/TDS_PLA_Plus.pdf',
      'hyper pla': 'https://download.creality.com/download/filament/TDS_Hyper_PLA.pdf',
      'petg': 'https://download.creality.com/download/filament/TDS_PETG.pdf',
      'hyper petg': 'https://download.creality.com/download/filament/TDS_Hyper_PETG.pdf',
      'abs': 'https://download.creality.com/download/filament/TDS_ABS.pdf',
      'tpu': 'https://download.creality.com/download/filament/TDS_TPU.pdf',
      'silk pla': 'https://download.creality.com/download/filament/TDS_Silk_PLA.pdf',
      'matte pla': 'https://download.creality.com/download/filament/TDS_Matte_PLA.pdf',
      'asa': 'https://download.creality.com/download/filament/TDS_ASA.pdf',
    }
  },
  
  'elegoo': {
    patterns: [
      /href="([^"]*cdn\.shopify\.com[^"]*elegoo[^"]*\.pdf)"/gi,
      /href="([^"]*elegoo[^"]*\.pdf)"/gi,
      /data-url="([^"]+\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_PLA_TDS.pdf',
      'pla+': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_PLA_Plus_TDS.pdf',
      'rapid pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Rapid_PLA_TDS.pdf',
      'silk pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Silk_PLA_TDS.pdf',
      'matte pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Matte_PLA_TDS.pdf',
      'marble pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Marble_PLA_TDS.pdf',
      'glow pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Glow_PLA_TDS.pdf',
      'petg': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_PETG_TDS.pdf',
      'abs': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_ABS_TDS.pdf',
      'tpu': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_TPU_TDS.pdf',
      'asa': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_ASA_TDS.pdf',
    }
  },
  
  'push-plastic': {
    patterns: [
      /href="([^"]*pushplastic[^"]*\.pdf)"/gi,
      /href="([^"]*\.pdf)"[^>]*>(?:[^<]*TDS)/gi,
    ],
    knownUrls: {
      'pla': 'https://www.pushplastic.com/pages/pla-technical-data-sheet',
      'petg': 'https://www.pushplastic.com/pages/petg-technical-data-sheet',
      'abs': 'https://www.pushplastic.com/pages/abs-technical-data-sheet',
      'asa': 'https://www.pushplastic.com/pages/asa-technical-data-sheet',
      'tpu': 'https://www.pushplastic.com/pages/tpu-technical-data-sheet',
      'nylon': 'https://www.pushplastic.com/pages/nylon-technical-data-sheet',
      'pc': 'https://www.pushplastic.com/pages/polycarbonate-technical-data-sheet',
      'hips': 'https://www.pushplastic.com/pages/hips-technical-data-sheet',
      'pva': 'https://www.pushplastic.com/pages/pva-technical-data-sheet',
      'cf-pla': 'https://www.pushplastic.com/pages/cf-pla-technical-data-sheet',
      'cf-petg': 'https://www.pushplastic.com/pages/cf-petg-technical-data-sheet',
    }
  },
  
  // === PREMIUM TPU BRANDS ===
  
  'ninjatek': {
    patterns: [
      /href="([^"]*ninjatek[^"]*\.pdf)"/gi,
      /href="([^"]*wp-content\/uploads[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'ninjaflex': 'https://ninjatek.com/wp-content/uploads/NinjaFlex-TDS.pdf',
      'ninjaflex 85a': 'https://ninjatek.com/wp-content/uploads/NinjaFlex-TDS.pdf',
      'cheetah': 'https://ninjatek.com/wp-content/uploads/Cheetah-TDS.pdf',
      'cheetah 95a': 'https://ninjatek.com/wp-content/uploads/Cheetah-TDS.pdf',
      'armadillo': 'https://ninjatek.com/wp-content/uploads/Armadillo-TDS.pdf',
      'armadillo 75d': 'https://ninjatek.com/wp-content/uploads/Armadillo-TDS.pdf',
      'chinchilla': 'https://ninjatek.com/wp-content/uploads/Chinchilla-TDS.pdf',
      'eel': 'https://ninjatek.com/wp-content/uploads/Eel-TDS.pdf',
    }
  },
  
  // === EUROPEAN BRANDS ===
  
  'azurefilm': {
    patterns: [
      /href="([^"]*azurefilm[^"]*\.pdf)"/gi,
      /href="([^"]*wp-content\/uploads[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PLA_TDS.pdf',
      'pla pro': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PLA_Pro_TDS.pdf',
      'petg': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PETG_TDS.pdf',
      'abs': 'https://azurefilm.com/wp-content/uploads/AzureFilm_ABS_TDS.pdf',
      'asa': 'https://azurefilm.com/wp-content/uploads/AzureFilm_ASA_TDS.pdf',
      'tpu': 'https://azurefilm.com/wp-content/uploads/AzureFilm_TPU_TDS.pdf',
      'pc': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PC_TDS.pdf',
      'pa': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PA_TDS.pdf',
      'nylon': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PA_TDS.pdf',
    }
  },
  
  'treed-filaments': {
    patterns: [
      /href="([^"]*treed[^"]*\.pdf)"/gi,
      /href="([^"]*scheda[^"]*tecnica[^"]*\.pdf)"/gi,
      /href="([^"]*technical[^"]*\.pdf)"/gi,
    ]
  },
  
  'recreus': {
    patterns: [
      /href="([^"]*recreus[^"]*\.pdf)"/gi,
      /href="([^"]*filaflex[^"]*\.pdf)"/gi,
      /href="([^"]*ficha[^"]*tecnica[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'filaflex': 'https://recreus.com/wp-content/uploads/FilaFlex_TDS.pdf',
      'filaflex 82a': 'https://recreus.com/wp-content/uploads/FilaFlex_82A_TDS.pdf',
      'filaflex 70a': 'https://recreus.com/wp-content/uploads/FilaFlex_70A_TDS.pdf',
      'filaflex 60a': 'https://recreus.com/wp-content/uploads/FilaFlex_60A_TDS.pdf',
    }
  },
  
  'gst3d': {
    patterns: [
      /href="([^"]*gst3d[^"]*\.pdf)"/gi,
      /href="([^"]*ficha[^"]*\.pdf)"/gi,
    ]
  },
  
  'recycling-fabrik': {
    patterns: [
      /href="([^"]*recycling[^"]*\.pdf)"/gi,
      /href="([^"]*datenblatt[^"]*\.pdf)"/gi,
      /href="([^"]*technische[^"]*daten[^"]*\.pdf)"/gi,
    ]
  },
  
  // === CHINESE BRANDS ===
  
  'sainsmart': {
    patterns: [
      /href="([^"]*cdn\.shopify\.com[^"]*sainsmart[^"]*\.pdf)"/gi,
      /href="([^"]*sainsmart[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'tpu': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_TPU_95A_TDS.pdf',
      'tpu 95a': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_TPU_95A_TDS.pdf',
      'pla': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_PLA_TDS.pdf',
      'petg': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_PETG_TDS.pdf',
      'abs': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_ABS_TDS.pdf',
    }
  },
  
  'geeetech': {
    patterns: [
      /href="([^"]*geeetech[^"]*\.pdf)"/gi,
      /href="([^"]*\.pdf)"[^>]*>(?:[^<]*(?:TDS|技术|参数))/gi,
    ]
  },
  
  'kingroon': {
    patterns: [
      /href="([^"]*kingroon[^"]*\.pdf)"/gi,
    ]
  },
  
  'sunlu': {
    patterns: [
      /href="([^"]*sunlu[^"]*\.pdf)"/gi,
      /href="([^"]*\.pdf)"[^>]*>(?:[^<]*(?:TDS|技术|下载))/gi,
    ],
    knownUrls: {
      'pla': 'https://www.sunlu.com/downloads/SUNLU_PLA_TDS.pdf',
      'pla+': 'https://www.sunlu.com/downloads/SUNLU_PLA_Plus_TDS.pdf',
      'petg': 'https://www.sunlu.com/downloads/SUNLU_PETG_TDS.pdf',
      'abs': 'https://www.sunlu.com/downloads/SUNLU_ABS_TDS.pdf',
      'tpu': 'https://www.sunlu.com/downloads/SUNLU_TPU_TDS.pdf',
      'silk pla': 'https://www.sunlu.com/downloads/SUNLU_Silk_PLA_TDS.pdf',
    }
  },
  
  'jayo': {
    patterns: [
      /href="([^"]*jayo[^"]*\.pdf)"/gi,
      /href="([^"]*\.pdf)"[^>]*>(?:[^<]*(?:TDS|Technical))/gi,
    ]
  },
  
  'duramic-3d': {
    patterns: [
      /href="([^"]*duramic[^"]*\.pdf)"/gi,
    ]
  },
  
  'sovol': {
    patterns: [
      /href="([^"]*sovol[^"]*\.pdf)"/gi,
    ]
  },
  
  'flashforge': {
    patterns: [
      /href="([^"]*flashforge[^"]*\.pdf)"/gi,
    ]
  },
  
  'eryone': {
    patterns: [
      /href="([^"]*eryone[^"]*\.pdf)"/gi,
      /href="([^"]*cdn\.shopify\.com[^"]*\.pdf)"/gi,
    ]
  },
  
  'amolen': {
    patterns: [
      /href="([^"]*amolen[^"]*\.pdf)"/gi,
    ]
  },
  
  // === NORTH AMERICAN BRANDS ===
  
  'filaments-ca': {
    patterns: [
      /href="([^"]*filaments\.ca[^"]*\.pdf)"/gi,
      /href="([^"]*cdn\.shopify\.com[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'ecotough pla': 'https://filaments.ca/pages/ecotough-pla-technical-data-sheet',
      'pla': 'https://filaments.ca/pages/pla-technical-data-sheet',
      'petg': 'https://filaments.ca/pages/petg-technical-data-sheet',
      'abs': 'https://filaments.ca/pages/abs-technical-data-sheet',
      'tpu': 'https://filaments.ca/pages/tpu-technical-data-sheet',
      'asa': 'https://filaments.ca/pages/asa-technical-data-sheet',
    }
  },
  
  'fusion-filaments': {
    patterns: [
      /href="([^"]*fusion[^"]*\.pdf)"/gi,
    ]
  },
  
  'iiidmax': {
    patterns: [
      /href="([^"]*iiidmax[^"]*\.pdf)"/gi,
      /href="([^"]*3dmax[^"]*\.pdf)"/gi,
    ]
  },
  
  'numakers': {
    patterns: [
      /href="([^"]*numakers[^"]*\.pdf)"/gi,
    ]
  },
  
  'atomic-filament': {
    patterns: [
      /href="([^"]*atomicfilament[^"]*\.pdf)"/gi,
      /href="([^"]*atomic[^"]*\.pdf)"/gi,
    ]
  },
  
  'protopasta': {
    patterns: [
      /href="([^"]*protopasta[^"]*\.pdf)"/gi,
      /href="([^"]*\.pdf)"[^>]*>(?:[^<]*(?:Technical|Safety|Material))/gi,
    ]
  },
  
  'printed-solid': {
    patterns: [
      /href="([^"]*printedsolid[^"]*\.pdf)"/gi,
      /href="([^"]*jessie[^"]*\.pdf)"/gi,
    ]
  },
  
  'taulman3d': {
    patterns: [
      /href="([^"]*taulman[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'nylon 645': 'https://taulman3d.com/files/Nylon_645_TDS.pdf',
      'nylon 680': 'https://taulman3d.com/files/Nylon_680_TDS.pdf',
      'nylon 910': 'https://taulman3d.com/files/Nylon_910_TDS.pdf',
      't-lyne': 'https://taulman3d.com/files/T-Lyne_TDS.pdf',
      't-glase': 'https://taulman3d.com/files/T-Glase_TDS.pdf',
      'bridge': 'https://taulman3d.com/files/Bridge_TDS.pdf',
      'pctpe': 'https://taulman3d.com/files/PCTPE_TDS.pdf',
    }
  },

  // === OTHER BRANDS ===
  
  'voxelpla': {
    patterns: [
      /href="([^"]*voxelpla[^"]*\.pdf)"/gi,
    ]
  },
};

// List of priority brands for multi-brand TDS discovery
const PRIORITY_TDS_BRANDS = [
  // Zero TDS coverage brands
  'elegoo', 'azurefilm', 'push-plastic', 'filaments-ca', 
  'geeetech', 'sainsmart', 'recycling-fabrik', 'anycubic',
  'treed-filaments', 'fusion-filaments', 'kingroon', 'iiidmax',
  'recreus', 'gst3d', 'creality', 'flashforge', 'numakers',
  'sovol', 'jayo', 'duramic-3d', 'amolen', 'eryone',
  // Low TDS coverage brands
  'ninjatek', 'atomic-filament', 'printed-solid', 'taulman3d',
  'voxelpla', 'protopasta', 'sunlu'
];

/**
 * Try to match product title to known TDS URL for a brand
 */
function matchKnownTdsUrl(productTitle: string, brandSlug: string): string | null {
  const config = BRAND_TDS_CONFIGS[brandSlug];
  if (!config?.knownUrls) return null;
  
  const titleLower = productTitle.toLowerCase();
  
  // Sort by pattern length (longest first) for most specific match
  const sortedPatterns = Object.entries(config.knownUrls)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sortedPatterns) {
    if (titleLower.includes(pattern)) {
      return url;
    }
  }
  
  return null;
}

/**
 * Get brand-specific regex patterns
 */
function getBrandPatterns(brandSlug: string): RegExp[] {
  return BRAND_TDS_CONFIGS[brandSlug]?.patterns || [];
}

// Extract TDS URL from HTML content
function extractTdsUrl(html: string, brandSlug: string, baseUrl: string): string | null {
  // First try brand-specific patterns
  const brandPatterns = getBrandPatterns(brandSlug);
  for (const pattern of brandPatterns) {
    const matches = html.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      let url = match[1];
      if (url && !url.startsWith('http')) {
        try {
          url = new URL(url, baseUrl).href;
        } catch {
          continue;
        }
      }
      if (url && isValidTdsUrl(url)) {
        return url;
      }
    }
  }

  // Then try generic patterns
  for (const pattern of TDS_PATTERNS) {
    const matches = html.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      let url = match[1];
      if (url && !url.startsWith('http')) {
        try {
          url = new URL(url, baseUrl).href;
        } catch {
          continue;
        }
      }
      if (url && isValidTdsUrl(url)) {
        return url;
      }
    }
  }

  // Look for JSON-LD structured data with document links
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
        const data = JSON.parse(jsonContent);
        const documentUrl = findDocumentInJsonLd(data);
        if (documentUrl) return documentUrl;
      } catch {}
    }
  }

  return null;
}

// Check if URL looks like a valid TDS PDF
function isValidTdsUrl(url: string): boolean {
  const lower = url.toLowerCase();
  
  // Must be a PDF or document link
  if (!lower.includes('.pdf') && !lower.includes('drive.google') && !lower.includes('dropbox')) {
    return false;
  }
  
  // Exclude common non-TDS PDFs
  const excludePatterns = [
    'invoice', 'order', 'receipt', 'manual', 'guide', 'instruction',
    'warranty', 'terms', 'privacy', 'cookie', 'return', 'sds', 'safety'
  ];
  
  for (const exclude of excludePatterns) {
    if (lower.includes(exclude)) {
      return false;
    }
  }
  
  return true;
}

// Find document URL in JSON-LD data
function findDocumentInJsonLd(data: any): string | null {
  if (!data) return null;
  
  if (typeof data === 'string' && data.includes('.pdf')) {
    return data;
  }
  
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findDocumentInJsonLd(item);
      if (result) return result;
    }
  }
  
  if (typeof data === 'object') {
    for (const key of ['document', 'datasheet', 'technicalDocument', 'specification', 'pdf', 'url']) {
      if (data[key] && typeof data[key] === 'string' && data[key].includes('.pdf')) {
        return data[key];
      }
    }
    for (const value of Object.values(data)) {
      const result = findDocumentInJsonLd(value);
      if (result) return result;
    }
  }
  
  return null;
}

// Validate TDS URL is accessible
async function validateTdsUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { 
      brandSlug, 
      limit = 50, 
      dryRun = true, 
      validateUrls = false,
      all = false,  // Multi-brand discovery mode
      limitPerBrand = 25  // Limit per brand in multi-brand mode
    } = await req.json();

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Multi-brand discovery mode
    if (all) {
      console.log(`[discover-brand-tds] Starting multi-brand TDS discovery for ${PRIORITY_TDS_BRANDS.length} brands`);
      
      const allResults: Record<string, { found: number; failed: number; results: TdsDiscoveryResult[] }> = {};
      let totalFound = 0;
      let totalFailed = 0;
      
      for (const slug of PRIORITY_TDS_BRANDS) {
        console.log(`[discover-brand-tds] Processing brand: ${slug}`);
        
        // Get brand info
        const { data: brand } = await supabase
          .from('automated_brands')
          .select('brand_name, base_url')
          .eq('brand_slug', slug)
          .single();
        
        if (!brand) {
          console.log(`[discover-brand-tds] Brand not found: ${slug}`);
          continue;
        }
        
        // Get filaments missing TDS
        const { data: filaments } = await supabase
          .from('filaments')
          .select('id, product_title, product_url')
          .ilike('vendor', brand.brand_name)
          .is('tds_url', null)
          .not('product_url', 'is', null)
          .limit(limitPerBrand);
        
        if (!filaments?.length) {
          console.log(`[discover-brand-tds] No filaments needing TDS for ${slug}`);
          continue;
        }
        
        const brandResults: TdsDiscoveryResult[] = [];
        let brandFound = 0;
        let brandFailed = 0;
        
        for (const filament of filaments) {
          const result: TdsDiscoveryResult = {
            filamentId: filament.id,
            productTitle: filament.product_title,
            productUrl: filament.product_url,
            tdsUrl: null,
            source: 'none',
            success: false,
          };
          
          // Step 1: Try known TDS URL patterns (no API call needed)
          const knownUrl = matchKnownTdsUrl(filament.product_title, slug);
          if (knownUrl) {
            if (validateUrls) {
              const isValid = await validateTdsUrl(knownUrl);
              if (isValid) {
                result.tdsUrl = knownUrl;
                result.source = 'known_pattern';
              }
            } else {
              result.tdsUrl = knownUrl;
              result.source = 'known_pattern';
            }
          }
          
          // Step 2: Scrape product page if no known URL found
          if (!result.tdsUrl && filament.product_url) {
            try {
              const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${firecrawlKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: filament.product_url,
                  formats: ['html'],
                  onlyMainContent: false,
                }),
              });

              if (scrapeResponse.ok) {
                const scrapeData = await scrapeResponse.json();
                const html = scrapeData.data?.html || '';
                const tdsUrl = extractTdsUrl(html, slug, brand.base_url);
                
                if (tdsUrl) {
                  if (validateUrls) {
                    const isValid = await validateTdsUrl(tdsUrl);
                    if (isValid) {
                      result.tdsUrl = tdsUrl;
                      result.source = 'product_page';
                    }
                  } else {
                    result.tdsUrl = tdsUrl;
                    result.source = 'product_page';
                  }
                }
              }
              
              // Rate limiting
              await new Promise(r => setTimeout(r, 1000));
            } catch (err) {
              result.error = err instanceof Error ? err.message : 'Scrape failed';
            }
          }
          
          if (result.tdsUrl) {
            result.success = true;
            brandFound++;
            totalFound++;
            
            if (!dryRun) {
              await supabase
                .from('filaments')
                .update({ tds_url: result.tdsUrl })
                .eq('id', filament.id);
            }
          } else {
            result.error = result.error || 'No TDS URL found';
            brandFailed++;
            totalFailed++;
          }
          
          brandResults.push(result);
        }
        
        allResults[slug] = { found: brandFound, failed: brandFailed, results: brandResults };
        console.log(`[discover-brand-tds] ${slug}: ${brandFound} found, ${brandFailed} failed`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          mode: 'multi_brand',
          brandsProcessed: Object.keys(allResults).length,
          totalFound,
          totalFailed,
          dryRun,
          results: allResults,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single brand discovery mode
    if (!brandSlug) {
      return new Response(
        JSON.stringify({ success: false, error: 'brandSlug is required (or use all: true for multi-brand mode)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[discover-brand-tds] Starting TDS discovery for ${brandSlug}, limit: ${limit}, dryRun: ${dryRun}`);

    // Get brand configuration
    const { data: brand, error: brandError } = await supabase
      .from('automated_brands')
      .select('brand_name, base_url')
      .eq('brand_slug', brandSlug)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ success: false, error: `Brand not found: ${brandSlug}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get filaments missing TDS URLs
    const { data: filaments, error: filamentsError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url')
      .ilike('vendor', brand.brand_name)
      .is('tds_url', null)
      .not('product_url', 'is', null)
      .limit(limit);

    if (filamentsError) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch filaments: ${filamentsError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[discover-brand-tds] Found ${filaments?.length || 0} filaments missing TDS`);

    const results: TdsDiscoveryResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const filament of filaments || []) {
      const result: TdsDiscoveryResult = {
        filamentId: filament.id,
        productTitle: filament.product_title,
        productUrl: filament.product_url,
        tdsUrl: null,
        source: 'none',
        success: false,
      };

      if (!filament.product_url) {
        result.error = 'No product URL';
        results.push(result);
        failCount++;
        continue;
      }

      // Step 1: Try known TDS URL patterns first (no API call)
      const knownUrl = matchKnownTdsUrl(filament.product_title, brandSlug);
      if (knownUrl) {
        if (validateUrls) {
          const isValid = await validateTdsUrl(knownUrl);
          if (isValid) {
            result.tdsUrl = knownUrl;
            result.source = 'known_pattern';
          }
        } else {
          result.tdsUrl = knownUrl;
          result.source = 'known_pattern';
        }
      }

      // Step 2: Scrape product page if no known URL
      if (!result.tdsUrl) {
        try {
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: filament.product_url,
              formats: ['html'],
              onlyMainContent: false,
            }),
          });

          if (!scrapeResponse.ok) {
            result.error = `Scrape failed: ${scrapeResponse.status}`;
            results.push(result);
            failCount++;
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }

          const scrapeData = await scrapeResponse.json();
          const html = scrapeData.data?.html || '';
          const tdsUrl = extractTdsUrl(html, brandSlug, brand.base_url);

          if (tdsUrl) {
            result.tdsUrl = tdsUrl;
            result.source = 'product_page';
            
            if (validateUrls) {
              const isValid = await validateTdsUrl(tdsUrl);
              if (!isValid) {
                result.error = 'TDS URL validation failed';
                result.tdsUrl = null;
              }
            }
          }
        } catch (err) {
          result.error = err instanceof Error ? err.message : 'Unknown error';
        }
      }

      if (result.tdsUrl) {
        result.success = true;
        successCount++;

        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update({ tds_url: result.tdsUrl })
            .eq('id', filament.id);

          if (updateError) {
            console.error(`[discover-brand-tds] Failed to update filament ${filament.id}:`, updateError);
          }
        }
      } else {
        result.error = result.error || 'No TDS URL found';
        failCount++;
      }

      results.push(result);
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`[discover-brand-tds] Complete: ${successCount} found, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        brandSlug,
        totalProcessed: results.length,
        tdsFound: successCount,
        tdsFailed: failCount,
        dryRun,
        results: results.slice(0, 100),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[discover-brand-tds] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
