/**
 * BAMBU LAB SYNC FUNCTION
 * 
 * 5-step architecture matching AzureFilm:
 * Step 0: Create sync log entry
 * Step 1: Discover products from collection page (Firecrawl HTML)
 * Step 2: Scrape each product page for H1 title and details
 * Step 3: Safety validation (minimum product threshold)
 * Step 4: Clean slate deletion
 * Step 5: Insert products with enrichment
 * 
 * Source: https://ca.store.bambulab.com/collections/bambu-lab-3d-printer-filament
 * Note: Bambu Lab uses a custom Next.js platform, NOT standard Shopify JSON API
 * 
 * CRITICAL IMAGE REQUIREMENT:
 * - S5 CDN (store.bblcdn.com/s5/): Full product photos (1920px) - MUST USE THESE
 * - S7 CDN (store.bblcdn.com/s7/): Tiny swatch thumbnails (~50px) - DO NOT USE
 * - S5 images are loaded dynamically via JavaScript, not in static HTML
 * - Must use hardcoded S5_PRODUCT_IMAGES mapping for reliable image extraction
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  BAMBULAB_STORE_INFO,
  BAMBULAB_SAFE_DELETE_THRESHOLD,
  isBambuLabNonFilament,
  generateBambuLabProductLineId,
  getBambuLabProductLineConfig,
  enrichBambuLabProduct,
  getBambuLabColorHex,
  isValidColorName,
} from '../_shared/bambulab-defaults.ts';
import { 
  shouldIncludeVariant, 
  extractWeightFromText,
  is285mmDiameter,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';
import { createDecisionLogger } from '../_shared/decision-logger.ts';
import { getColorHex, getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USD pricing (store shows USD prices on collection)
const USD_RATE = 1.0;

// ========== IMAGE TYPE DOCUMENTATION ==========
// Bambu Lab CDN has two image types:
// - S7 CDN (store.bblcdn.com/s7/): Small color swatch thumbnails (~50x50px) used in color picker UI
// - S5 CDN (store.bblcdn.com/s5/): Full product gallery images (1920px) shown when a color is selected
//
// CRITICAL: We must use S5 gallery images, NOT S7 swatch thumbnails!
// S5 URLs have __op__resize parameters for image processing (e.g., __op__resize,m_lfit,w_1920)
//
// PROBLEM: S5 images are loaded dynamically via JavaScript when a color is clicked.
// Firecrawl captures static HTML which only contains S7 swatch URLs.
// SOLUTION: Use hardcoded S5_PRODUCT_IMAGES mapping for each product line and color.

// Standard S5 image URL suffix for quality/format
const S5_PARAMS = '__op__resize,m_lfit,w_1920__op__format,f_auto__op__quality,q_80';

function s5Url(guid: string): string {
  return `https://store.bblcdn.com/s5/default/${guid}.jpg${S5_PARAMS}`;
}

// ========== HARDCODED S5 PRODUCT IMAGES ==========
// These are manually extracted gallery images for each product line and color.
// S5 images are loaded via JavaScript and CANNOT be scraped from static HTML.
// 
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                    MANUAL S5 GUID EXTRACTION PROCESS                        ║
// ╠══════════════════════════════════════════════════════════════════════════════╣
// ║ 1. Open product page: https://us.store.bambulab.com/products/{product-slug} ║
// ║ 2. Open DevTools (F12) → Network tab                                        ║
// ║ 3. Filter by "s5" in the search box                                         ║
// ║ 4. Click each color swatch one by one                                       ║
// ║ 5. Find request to: store.bblcdn.com/s5/default/{GUID}.jpg                  ║
// ║ 6. Copy the 32-character GUID                                               ║
// ║ 7. Add below using: 'color name': s5Url('GUID'),                           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
//
// KNOWN LIMITATIONS (DO NOT ATTEMPT):
// - Firecrawl waitFor does NOT help - S5 images require actual clicks
// - __NEXT_DATA__ JSON does NOT contain S5 image GUIDs
// - Variant IDs (?id= param) also cannot be scraped - accepted limitation
//
// Format: 'product-slug' -> { 'color name': s5Url('GUID') }
// Run Post Sync Check to identify which products still need S5 images.
//
// CURRENT STATUS (Updated 2026-01-05):
// ✅ COMPLETE: abs-filament, pla-tough-upgrade, petg-hf, petg-translucent (43 colors)
// ⏳ PENDING:  pla-basic-filament, pla-matte, pla-silk-upgrade, pla-translucent, etc. (~124 colors)

const S5_PRODUCT_IMAGES: Record<string, Record<string, string>> = {
  
  // ══════════════════════════════════════════════════════════════════════════════
  // COMPLETE - S5 Images Verified ✅
  // ══════════════════════════════════════════════════════════════════════════════
  
  // ========== ABS (12 COLORS - VERIFIED) ==========
  'abs-filament': {
    'silver': s5Url('69834a7536c540e489913a0f8e707e5e'),
    'black': s5Url('cfdefec225e6430c82cbe2f8766b6f70'),
    'white': s5Url('1ad485ff4a72413b90e944ffde4fa861'),
    'bambu green': s5Url('910be80e4fcf43ddbd66c40773ecce0f'),
    'orange': s5Url('25d7b833bf694c70b9ef3cd649f3cf36'),
    'red': s5Url('95bd38c6dc604bdab7b3d2fc7b67e0ee'),
    'blue': s5Url('3b2f526b80734e429d9a424e07f3c36b'),
    'olive': s5Url('80cf6768c03d129dfa6a01ac67a5b402'),
    'tangerine yellow': s5Url('7376d19b161f2a93a4051e47289d0505'),
    'azure': s5Url('0be9a584b30358020d8706f2aa8ec9c2'),
    'navy blue': s5Url('000878ce6144c05ffac949f66b05a18b'),
    'purple': s5Url('a840092ea2804025a123e115128c1299'),
  },
  
  // ========== PLA TOUGH+ (8 COLORS - VERIFIED) ==========
  'pla-tough-upgrade': {
    'black': 'https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(1).jpg',
    'white': 'https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(2).jpg',
    'yellow': 'https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(3).jpg',
    'orange': 'https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(4).jpg',
    'gray': 'https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(5).jpg',
    'silver': 'https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(6).jpg',
    'cyan': 'https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(7).jpg',
    'red': 'https://store.bblcdn.com/s5/default/12ef1d98dc1e4b3e898f5bbc43dc6bbe/PLA_Tough_(8).jpg',
  },
  
  // ========== PETG HF (14 COLORS - VERIFIED) ==========
  'petg-hf': {
    'black': 'https://store.bblcdn.com/s5/default/6583fc4c677b47c78a79b5af54707241.jpg',
    'white': 'https://store.bblcdn.com/s5/default/6f0f3ffb6bdb459f97d0f44a6d83fbf6.jpg',
    'red': 'https://store.bblcdn.com/s5/default/7de1911f91d34be280040a4ef84fdbd2.jpg',
    'gray': 'https://store.bblcdn.com/s5/default/22729c93daef4e0293f50584690457d0.jpg',
    'dark gray': 'https://store.bblcdn.com/s5/default/d96a3ffe711444f0a4d4b734f1519537.jpg',
    'cream': 'https://store.bblcdn.com/s5/default/132b2c639d284831ad3a65a5a2450ab3.jpg',
    'yellow': 'https://store.bblcdn.com/s5/default/695dad0142ca4d0c8ca64cd2cf5eaa6f.jpg',
    'orange': 'https://store.bblcdn.com/s5/default/048a5c2661644b849a6a955ccde1a877.jpg',
    'peanut brown': 'https://store.bblcdn.com/s5/default/a27c74b9bf7741b581ac70bfcb5e82f9.jpg',
    'lime green': 'https://store.bblcdn.com/s5/default/3eeb673909be49ae8cb99bd18f365614.jpg',
    'green': 'https://store.bblcdn.com/s5/default/9bd37be5d1b24bfb940af905904e7145.jpg',
    'forest green': 'https://store.bblcdn.com/s5/default/327777e6ed004cb0820532eb7e263a2d.jpg',
    'lake blue': 'https://store.bblcdn.com/s5/default/88d2cf2480094d6cbbba24a6751eb943.jpg',
    'blue': 'https://store.bblcdn.com/s5/default/729f2d6de88b4001938dcf49c97c2d8c.jpg',
  },
  
  // ========== PETG TRANSLUCENT (9 COLORS - VERIFIED) ==========
  'petg-translucent': {
    'translucent teal': 'https://store.bblcdn.com/s5/default/ffa37db2ff474b71b142f6f3225c7ded.jpg',
    'translucent light blue': 'https://store.bblcdn.com/s5/default/2e8d7b9c2a4147da979f544f73f85fb5.jpg',
    'clear': 'https://store.bblcdn.com/s5/default/1a74ea492a6f4b8ea23c7d84b145d316.png',
    'translucent gray': 'https://store.bblcdn.com/s5/default/18fb283d551c418f9246a22beec492ce.jpg',
    'translucent olive': 'https://store.bblcdn.com/s5/default/8534fe998fa145aeb6599bf16827cf58.jpg',
    'translucent brown': 'https://store.bblcdn.com/s5/default/2c6abde5b9bd4184a9a1ecf31be06500.jpg',
    'translucent orange': 'https://store.bblcdn.com/s5/default/6415b5d6fb1a473490a0eb605d9d59b0.jpg',
    'translucent pink': 'https://store.bblcdn.com/s5/default/3c06d1d78c3c40239fc582a8bd5a5261.jpg',
    'translucent purple': 'https://store.bblcdn.com/s5/default/d437c0bf73fa4bbdadf3b3a8f139e8b0.jpg',
  },
  
  // ══════════════════════════════════════════════════════════════════════════════
  // PENDING - Need Manual S5 GUID Extraction ⏳
  // Use DevTools Network tab to capture GUIDs when clicking color swatches
  // ══════════════════════════════════════════════════════════════════════════════
  
  // ========== PLA BASIC (30 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-basic-filament
  // Known colors: Jade White, Ivory White, Black, Beige, Silver, Orange, Yellow, 
  //               Green, Grass Green, Mint Green, Lake Blue, Blue, Light Blue,
  //               Navy Blue, Lavender, Purple, Magenta, Sakura Pink, Red, 
  //               Wine Red, Pink, Brown, Camel, Coffee, Chocolate, Gray, 
  //               Dark Gray, Olive, Bamboo Green, Mandarin Orange
  'pla-basic-filament': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
    // Example: 'jade white': s5Url('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
  },
  
  // ========== PLA MATTE (24 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-matte
  // Known colors: Charcoal, Dark Gray, Ash Gray, Silver, Ivory White, Lilac, 
  //               Sakura Pink, Coral Pink, Candy, Mandarin Orange, Lemon Yellow,
  //               Light Green, Teal, Aquamarine, Gray Blue, Lake Blue, Prussian Blue,
  //               Ink Blue, Deep Blue, Lavender, Purple, Wine Red, Scarlet Red, Brown
  'pla-matte': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PLA SILK+ (13 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-silk-upgrade
  // Known colors: White, Black, Pink, Red, Orange, Yellow, Gold, Cyan, 
  //               Blue, Dark Blue, Green, Purple, Silver
  'pla-silk-upgrade': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PLA TRANSLUCENT (10 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-translucent
  'pla-translucent': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PLA SILK MULTI-COLOR (5 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-silk-multicolor
  'pla-silk-multicolor': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PLA BASIC GRADIENT (3 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-basic-gradient
  'pla-basic-gradient': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PLA SPARKLE (6 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-sparkle
  'pla-sparkle': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PLA METAL (5 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-metal
  'pla-metal': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PLA GALAXY (3 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-galaxy
  'pla-galaxy': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PLA WOOD (4 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-wood
  'pla-wood': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PLA GLOW (5 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-glow
  'pla-glow': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PLA MARBLE (2 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-marble
  'pla-marble': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PLA-CF (7 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pla-cf
  'pla-cf': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PETG BASIC (10 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/petg-basic
  'petg-basic': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== SUPPORT FOR PLA (2 COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/support-for-pla
  'support-for-pla': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== SUPPORT W (1 COLOR - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/support-w
  'support-w': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== TPU 95A (COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/tpu-95a
  'tpu-95a': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== ASA (COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/asa
  'asa': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PAHT-CF (COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/paht-cf
  'paht-cf': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PA6-CF (COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pa6-cf
  'pa6-cf': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
  
  // ========== PET-CF (COLORS - PENDING) ==========
  // URL: https://us.store.bambulab.com/products/pet-cf
  'pet-cf': {
    // TODO: Extract S5 GUIDs via DevTools Network tab
  },
};

// Legacy fallback - keeping for backwards compatibility
const ABS_COLOR_IMAGES = S5_PRODUCT_IMAGES['abs-filament'] || {};

interface DiscoveredProduct {
  url: string;
  collectionTitle: string;
}

// Color variant with associated image and variant ID for URL
interface ColorVariantData {
  colorName: string;
  colorHex: string | null;
  imageUrl: string | null;
  variantId: string | null;  // Shopify/Bambu variant ID for ?id= URL parameter
}

interface ScrapedProduct {
  url: string;
  h1Title: string;
  price: number | null;
  imageUrl: string | null;  // Fallback/default image
  colorVariants: ColorVariantData[];  // Color-specific data with images
  weightGrams: number;
  available: boolean;
}

interface SyncResult {
  success: boolean;
  summary: {
    totalDiscovered: number;
    totalScraped: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  duration: string;
  duration_ms: number;
}

// ============================================================================
// STEP 1: DISCOVER PRODUCTS FROM COLLECTION PAGE (FIRECRAWL)
// ============================================================================

async function discoverProductsFromCollection(firecrawlKey: string): Promise<DiscoveredProduct[]> {
  const allProducts: DiscoveredProduct[] = [];
  const seenUrls = new Set<string>();
  
  const collectionUrl = BAMBULAB_STORE_INFO.productsUrl;
  console.log(`[BambuLab] Discovering products from collection: ${collectionUrl}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: collectionUrl,
        formats: ['links', 'markdown'],
        onlyMainContent: false,
        waitFor: 5000, // Wait for JS content to load
      }),
    });
    
    if (!response.ok) {
      console.error(`[BambuLab] Failed to scrape collection: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const links = data.data?.links || [];
    
    console.log(`[BambuLab] Found ${links.length} total links on page`);
    
    // Filter for product links - Bambu Lab uses both ca. and us. subdomains
    // Collection shows us. links but we can use ca. for CAD pricing
    const productLinks = links.filter((link: string) => {
      // Match patterns like:
      // https://us.store.bambulab.com/products/pla-basic-filament
      // https://ca.store.bambulab.com/products/pla-matte
      const isProductLink = /https:\/\/(us|ca|eu|uk|au)\.store\.bambulab\.com\/products\//.test(link);
      
      // Exclude non-product pages
      const isNotCollection = !link.includes('/collections/');
      const isNotCart = !link.includes('/cart');
      const isNotAccount = !link.includes('/account');
      
      return isProductLink && isNotCollection && isNotCart && isNotAccount;
    });
    
    console.log(`[BambuLab] Found ${productLinks.length} product links`);
    
    for (const link of productLinks) {
      // Normalize to CA store for consistent pricing
      const normalizedUrl = link.replace(
        /https:\/\/(us|eu|uk|au)\.store\.bambulab\.com/,
        'https://us.store.bambulab.com'
      );
      
      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        allProducts.push({
          url: normalizedUrl,
          collectionTitle: 'Filament',
        });
      }
    }
    
  } catch (error) {
    console.error(`[BambuLab] Error scraping collection:`, error);
  }
  
  console.log(`[BambuLab] Total unique products discovered: ${allProducts.length}`);
  return allProducts;
}

// ============================================================================
// STEP 2: SCRAPE PRODUCT PAGES FOR DETAILS
// ============================================================================

/**
 * Extract colors from both HTML and markdown content
 * Bambu Lab uses button elements and JSON-LD for color options
 */
function extractColorsFromPageContent(markdown: string, html: string = ''): string[] {
  const colors: string[] = [];
  
  // ============ HTML PATTERNS (PRIORITY) ============
  
  // Pattern H1: Button/option elements with color in aria-label or data-* attributes
  // <button aria-label="Color: White">
  const ariaMatches = html.matchAll(/aria-label="(?:Color|Colour|Select):\s*([^"]+)"/gi);
  for (const match of ariaMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H2: Option/variant buttons with title attribute
  // <button title="White">
  const titleMatches = html.matchAll(/<(?:button|div|span)[^>]*title="([A-Z][a-z]+(?:\s+[A-Za-z]+){0,2})"[^>]*(?:class="[^"]*(?:variant|swatch|option|color)[^"]*")/gi);
  for (const match of titleMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H3: JSON-LD structured data (Shopify/Next.js stores)
  const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const jsonLdMatch of jsonLdMatches) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      // Check for color options in product offers
      if (jsonData['@type'] === 'Product' && jsonData.offers) {
        const offers = Array.isArray(jsonData.offers) ? jsonData.offers : [jsonData.offers];
        for (const offer of offers) {
          if (offer.name && isValidColorName(offer.name)) {
            const colorName = offer.name.trim();
            if (!colors.includes(colorName)) {
              colors.push(colorName);
            }
          }
        }
      }
      // Check for variant options
      if (jsonData.hasVariant) {
        for (const variant of jsonData.hasVariant) {
          if (variant.name && isValidColorName(variant.name)) {
            const colorName = variant.name.trim();
            if (!colors.includes(colorName)) {
              colors.push(colorName);
            }
          }
        }
      }
    } catch (e) {
      // JSON parse failed, continue
    }
  }
  
  // Pattern H4: Variant swatch images with alt text containing color
  // <img alt="White" class="swatch-image">
  const imgSwatchMatches = html.matchAll(/<img[^>]*alt="([A-Z][a-z]+(?:\s+[A-Za-z]+){0,2})"[^>]*class="[^"]*(?:swatch|variant|option)[^"]*"/gi);
  for (const match of imgSwatchMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H5: Bambu Lab variant picker options (Next.js)
  // <span class="variant-option">White</span>
  const variantSpanMatches = html.matchAll(/<span[^>]*class="[^"]*(?:variant|option|color|swatch)[^"]*"[^>]*>([A-Z][a-z]+(?:\s+[A-Za-z]+){0,2})<\/span>/gi);
  for (const match of variantSpanMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H6: Data attributes with color values
  // <div data-color="White">
  const dataColorMatches = html.matchAll(/data-(?:color|variant|option)="([A-Z][a-z]+(?:\s+[A-Za-z]+){0,2})"/gi);
  for (const match of dataColorMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H7 (BAMBU LAB SPECIFIC): Variant selector <li value="ColorName (SKU)">
  // Example: <li value="Jade White (10100)" class="w-[42px] h-[42px] ... rounded-full">
  const liValueMatches = html.matchAll(/<li[^>]*value="([^"]+)"[^>]*class="[^"]*rounded-full[^"]*"/gi);
  for (const match of liValueMatches) {
    const fullValue = match[1];
    // Strip SKU from "Jade White (10100)" -> "Jade White"
    const colorName = fullValue.replace(/\s*\(\d+\)$/, '').trim();
    if (colorName && isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H8 (FALLBACK): Any <li value="ColorName"> or <li value="ColorName (SKU)">
  // More lenient pattern for edge cases
  const liValueFallback = html.matchAll(/<li[^>]*value="([A-Z][a-zA-Z\s]+)(?:\s*\([^)]+\))?"/gi);
  for (const match of liValueFallback) {
    const colorName = match[1].trim();
    if (colorName && isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H9: Button elements with value or data-value attribute (for ABS and other products)
  // Example: <button value="Black" class="...">
  const buttonValueMatches = html.matchAll(/<button[^>]*(?:value|data-value)="([A-Z][a-zA-Z\s]+)"[^>]*>/gi);
  for (const match of buttonValueMatches) {
    const colorName = match[1].trim();
    if (colorName && isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern H10: Dropdown/select option elements
  // Example: <option value="Black">Black</option>
  const optionMatches = html.matchAll(/<option[^>]*value="([A-Z][a-zA-Z\s]+)"[^>]*>/gi);
  for (const match of optionMatches) {
    const colorName = match[1].trim();
    if (colorName && isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // ============ MARKDOWN PATTERNS (FALLBACK) ============
  
  // Pattern M1: "Color : ColorName (SKU)" - primary pattern
  const colorLabelMatches = markdown.matchAll(/Color\s*:\s*([^(]+?)\s*\(/gi);
  for (const match of colorLabelMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern M2: "Selected: ColorName" - backup pattern
  const selectedMatches = markdown.matchAll(/Selected\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g);
  for (const match of selectedMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // Pattern M3: Color options list (e.g., "- White\n- Black\n- Red")
  const colorListMatches = markdown.matchAll(/^[\s-]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/gm);
  for (const match of colorListMatches) {
    const colorName = match[1].trim();
    if (isValidColorName(colorName) && !colors.includes(colorName)) {
      colors.push(colorName);
    }
  }
  
  // ============ JSON DATA PATTERN (for JS-rendered color pickers) ============
  // Pattern J1: Extract from __NEXT_DATA__ or similar embedded JSON
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i);
  if (nextDataMatch && colors.length === 0) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      // Navigate to product variants in Next.js page props
      const variants = nextData?.props?.pageProps?.product?.variants || 
                       nextData?.props?.pageProps?.data?.product?.variants || [];
      for (const variant of variants) {
        const colorName = variant?.option1 || variant?.selectedOptions?.[0]?.value || variant?.title;
        if (colorName && isValidColorName(colorName) && !colors.includes(colorName)) {
          colors.push(colorName);
        }
      }
    } catch (e) {
      // JSON parse failed, continue with other methods
    }
  }
  
  return colors;
}

/**
 * Find the best image match for a color name using flexible matching.
 * Handles compound color names like "Matte Apple Green" by trying:
 * 1. Exact match: "matte apple green"
 * 2. Stripped prefix match: "apple green" (without Matte/Silk/etc.)
 * 3. Last word match: "green"
 * 4. First significant word match: "apple"
 */
function findBestImageForColor(colorKey: string, colorImageMap: Map<string, string>): string | null {
  // Normalize the color key
  const normalized = colorKey.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // 1. Exact match
  if (colorImageMap.has(normalized)) {
    return colorImageMap.get(normalized) || null;
  }
  
  // 2. Strip common prefixes (Matte, Silk, Translucent, etc.) and try again
  const strippedPrefixes = normalized
    .replace(/^(matte|silk|translucent|basic|tough|galaxy)\s+/i, '')
    .trim();
  if (strippedPrefixes !== normalized && colorImageMap.has(strippedPrefixes)) {
    return colorImageMap.get(strippedPrefixes) || null;
  }
  
  // 3. Try partial matching - look for keys that contain significant parts of the color
  const words = normalized.split(' ').filter(w => w.length >= 3);
  
  // Try compound matches first (e.g., "ivory white" for "matte ivory white")
  for (let i = 0; i < words.length - 1; i++) {
    const compound = `${words[i]} ${words[i + 1]}`;
    if (colorImageMap.has(compound)) {
      return colorImageMap.get(compound) || null;
    }
  }
  
  // 4. Try individual significant words (prioritize later words which are usually the actual color)
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    // Skip common prefixes/modifiers
    if (['matte', 'silk', 'basic', 'dark', 'light', 'translucent', 'tough', 'galaxy'].includes(word)) {
      continue;
    }
    if (colorImageMap.has(word)) {
      return colorImageMap.get(word) || null;
    }
  }
  
  // 5. Last resort: check if any map key is contained in the color name
  for (const [key, url] of colorImageMap.entries()) {
    if (normalized.includes(key) && key.length >= 4) {
      return url;
    }
  }
  
  return null;
}

/**
 * Helper to extract color name from a CDN image filename
 * e.g., "PLA_Matte_Black.png" -> "black" or "matte black"
 */
function extractColorFromFilename(filename: string): string | null {
  // Remove extension and query params
  const clean = filename
    .replace(/\.(png|jpg|jpeg|webp).*$/i, '')
    .replace(/^(pla|petg|abs|tpu|pa|pc|asa|pva)[-_]?/i, '')
    .replace(/^(matte|silk|basic|tough|hf|translucent|cf|gf)[-_]?/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .toLowerCase();
  
  // Skip GUIDs and generic names
  if (!clean || clean.length < 3 || /^\d+$/.test(clean) || /^[a-f0-9]{8,}$/i.test(clean)) {
    return null;
  }
  if (/spool|web|product|filament|original|v\d|_\d/i.test(clean)) {
    return null;
  }
  
  return clean;
}

/**
 * Get S5 gallery image from hardcoded mapping
 * S5 images are loaded via JavaScript and cannot be scraped - we must use hardcoded mappings.
 * 
 * @param productSlug - Product slug from URL (e.g., 'pla-basic-filament')
 * @param colorName - Color name (e.g., 'Jade White')
 * @returns S5 gallery URL or null if not found
 */
function getHardcodedS5Image(productSlug: string, colorName: string): string | null {
  const normalizedSlug = productSlug.toLowerCase();
  const normalizedColor = colorName.toLowerCase().trim();
  
  const productImages = S5_PRODUCT_IMAGES[normalizedSlug];
  if (!productImages) {
    return null;
  }
  
  // Try exact match first
  if (productImages[normalizedColor]) {
    return productImages[normalizedColor];
  }
  
  // Try partial matches (for compound color names like "Matte Charcoal" -> "charcoal")
  for (const [colorKey, url] of Object.entries(productImages)) {
    // Check if the color name contains the key or vice versa
    if (normalizedColor.includes(colorKey) || colorKey.includes(normalizedColor)) {
      return url;
    }
    // Check for last word match (e.g., "jade white" matches "white")
    const lastWord = normalizedColor.split(' ').pop() || '';
    if (lastWord && colorKey === lastWord) {
      return url;
    }
  }
  
  return null;
}

/**
 * Extract product slug from URL
 * e.g., 'https://us.store.bambulab.com/products/pla-basic-filament' -> 'pla-basic-filament'
 */
function extractProductSlug(productUrl: string): string {
  const match = productUrl.match(/\/products\/([^/?#]+)/i);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Extract color variants with their associated S5 GALLERY images from HTML and __NEXT_DATA__
 * 
 * CRITICAL: We must use S5 CDN images (product gallery photos), NOT S7 swatch thumbnails!
 * - S5 CDN (store.bblcdn.com/s5/): Full product photos shown when color is selected (1920px)
 * - S7 CDN (store.bblcdn.com/s7/): Tiny swatch thumbnails in color picker UI (~50x50px)
 * 
 * Strategy:
 * 1. FIRST check hardcoded S5_PRODUCT_IMAGES mapping (most reliable)
 * 2. Try to find S5 images in HTML (rarely works - they're JS-loaded)
 * 3. Extract color names from color selector elements
 * 4. Fall back to S7 swatch only if NO S5 image found (with warning)
 */
function extractColorVariantsWithImages(html: string, markdown: string, productUrl: string): ColorVariantData[] {
  const variants: ColorVariantData[] = [];
  const seenColors = new Set<string>();
  
  // Get product slug for hardcoded S5 lookup
  const productSlug = extractProductSlug(productUrl);
  const hasHardcodedImages = productSlug && S5_PRODUCT_IMAGES[productSlug];
  
  if (hasHardcodedImages) {
    console.log(`[BambuLab] Using hardcoded S5 images for: ${productSlug}`);
  }
  
  // Build separate maps for S5 (gallery) and S7 (swatch) images
  const s5GalleryImages = new Map<string, string>(); // color -> S5 gallery URL
  const s7SwatchImages = new Map<string, string>();  // color -> S7 swatch URL (fallback only)
  const guidToS5Image = new Map<string, string>();   // GUID -> S5 URL (for matching)
  const colorImageMap = new Map<string, string>();   // Combined map for fallback matching
  
  // ========== STEP 1: Extract ALL S5 gallery images from HTML (if any) ==========
  // Note: S5 images are usually JS-loaded, so this often finds 0 images
  const s5ImageMatches = html.matchAll(/https:\/\/store\.bblcdn\.com\/s5\/[^"'\s<>]+\.(?:jpg|png|jpeg|webp)(?:__op__[^"'\s<>]*)?/gi);
  const allS5Images = [...new Set([...s5ImageMatches].map(m => m[0]))];
  
  console.log(`[BambuLab] Found ${allS5Images.length} S5 gallery images in HTML`);
  
  // Build GUID -> S5 URL map (GUIDs are 32-char hex strings)
  for (const s5Url of allS5Images) {
    // Exclude non-product images
    if (s5Url.toLowerCase().includes('logo') || s5Url.toLowerCase().includes('icon')) continue;
    
    // Extract GUID from URL like /s5/default/GUID.jpg
    const guidMatch = s5Url.match(/\/s5\/default\/([a-f0-9]{32})/i);
    if (guidMatch) {
      const guid = guidMatch[1].toLowerCase();
      guidToS5Image.set(guid, s5Url);
    }
    
    // Also try to extract color from filename patterns
    const filenameMatch = s5Url.match(/\/([^/]+)\.(jpg|png|jpeg|webp)/i);
    if (filenameMatch) {
      const colorFromFile = extractColorFromFilename(filenameMatch[1]);
      if (colorFromFile) {
        s5GalleryImages.set(colorFromFile, s5Url);
        colorImageMap.set(colorFromFile, s5Url);
      }
    }
  }
  
  // ========== STEP 2: Extract S7 swatch images and map via GUID ==========
  // Parse color selector elements: <li value="ColorName (SKU)"> followed by <img src="s7/...">
  const colorSelectorRegex = /<li[^>]*value="([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="(https:\/\/store\.bblcdn\.com\/s7[^"]+)"[^>]*>/gi;
  let s7ColorMatches = 0;
  
  for (const match of html.matchAll(colorSelectorRegex)) {
    const rawValue = match[1].trim(); // e.g., "Gold (13405)" or "Titan Gray"
    const s7SwatchUrl = match[2];
    
    // Extract clean color name - remove SKU in parentheses if present
    const colorName = rawValue.replace(/\s*\([^)]+\)$/, '').trim();
    
    // Validate color name
    if (!colorName || colorName.length < 2) continue;
    if (/^[0-9]+$/.test(colorName)) continue;
    if (/^[a-f0-9]{8,}$/i.test(colorName)) continue;
    if (!isValidColorName(colorName)) continue;
    
    const colorKey = colorName.toLowerCase().replace(/\s+/g, ' ').trim();
    s7ColorMatches++;
    
    // Store S7 swatch as fallback (but we'll try to find S5 first)
    s7SwatchImages.set(colorKey, s7SwatchUrl);
    
    // Try to find corresponding S5 gallery image via GUID
    // S7 URL format: /s7/default/GUID/filename.png
    const s7GuidMatch = s7SwatchUrl.match(/\/s7\/default\/([a-f0-9]{32})/i);
    if (s7GuidMatch) {
      const guid = s7GuidMatch[1].toLowerCase();
      
      // Check if we have an S5 image with same GUID
      if (guidToS5Image.has(guid)) {
        const s5Url = guidToS5Image.get(guid)!;
        s5GalleryImages.set(colorKey, s5Url);
        colorImageMap.set(colorKey, s5Url);
        console.log(`[BambuLab] Matched color "${colorKey}" to S5 gallery via GUID`);
      }
    }
    
    // If no S5 match found, still add S7 to colorImageMap as fallback
    if (!colorImageMap.has(colorKey)) {
      colorImageMap.set(colorKey, s7SwatchUrl);
    }
  }
  
  console.log(`[BambuLab] Found ${s7ColorMatches} colors from selector, ${s5GalleryImages.size} matched to S5 images`);
  
  // ========== STEP 3: Enhanced CDN filename matching ==========
  // For colors not matched by GUID, try filename pattern matching with S5 images
  const allCdnImages = [...allS5Images]; // Start with S5 images
  
  // Color indicators for filename matching
  const colorIndicators = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
    'grey', 'gray', 'brown', 'tan', 'gold', 'silver', 'jade', 'ivory', 'charcoal',
    'coral', 'cyan', 'navy', 'olive', 'maroon', 'salmon', 'lime', 'clear', 'natural',
    'magenta', 'teal', 'cream', 'bronze', 'copper', 'beige', 'slate', 'scarlet',
    'lemon', 'grass', 'sakura', 'marine', 'midnight', 'mandarin', 'caramel', 'plum',
    'nardo', 'desert', 'terracotta', 'latte', 'bone', 'ash', 'apple', 'chocolate',
    'ice', 'sky', 'dark', 'cold', 'warm', 'candy', 'titan'
  ];
  
  for (const imageUrl of allCdnImages) {
    const filename = (imageUrl.split('/').pop() || '').toLowerCase();
    const cleanFilename = filename
      .replace(/\.(png|jpg|jpeg|webp).*$/, '')
      .replace(/^(pla|petg|abs|tpu|pa|pc|asa|pva)[-_]?/i, '')
      .replace(/^(matte|silk|basic|tough|hf|translucent|cf|gf)[-_]?/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    
    if (!cleanFilename || cleanFilename.length < 3) continue;
    if (/^\d+$/.test(cleanFilename) || /^[a-f0-9]{8,}$/i.test(cleanFilename)) continue;
    
    const colorKey = cleanFilename.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Only add if it looks like a color and we don't have it yet
    const hasColorIndicator = colorIndicators.some(c => colorKey.includes(c));
    if (hasColorIndicator && !colorImageMap.has(colorKey)) {
      colorImageMap.set(colorKey, imageUrl);
    }
    
    // Also store individual words for partial matching
    const colorWords = colorKey.split(' ').filter(w => w.length >= 3 && colorIndicators.includes(w));
    for (const word of colorWords) {
      if (!colorImageMap.has(word)) {
        colorImageMap.set(word, imageUrl);
      }
    }
  }
  
  console.log(`[BambuLab] Total color-image mappings: ${colorImageMap.size}`);
  
  // ========== STEP 4: Extract images from __NEXT_DATA__ ==========
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const productVariants = nextData?.props?.pageProps?.product?.variants || 
                              nextData?.props?.pageProps?.data?.product?.variants ||
                              nextData?.props?.pageProps?.initialData?.product?.variants || [];
      
      const productImagesFromJson = nextData?.props?.pageProps?.product?.images ||
                                    nextData?.props?.pageProps?.data?.product?.images || [];
      
      // Add alt text mappings from product images
      for (const img of productImagesFromJson) {
        if (img.alt && img.src && isValidColorName(img.alt)) {
          const imgUrl = img.src.replace(/^\/\//, 'https://');
          // Prefer S5 images
          if (imgUrl.includes('/s5/') || !colorImageMap.has(img.alt.toLowerCase())) {
            colorImageMap.set(img.alt.toLowerCase(), imgUrl);
          }
        }
      }
      
      for (const v of productVariants) {
        const colorName = v?.option1 || v?.selectedOptions?.[0]?.value || v?.title;
        if (!colorName || !isValidColorName(colorName)) continue;
        
        const colorKey = colorName.toLowerCase();
        if (seenColors.has(colorKey)) continue;
        seenColors.add(colorKey);
        
        // Extract variant ID for URL parameter (e.g., ?id=624467991622688780)
        const variantId = v?.id?.toString() || null;
        
        // Get image URL - PRIORITY ORDER:
        // 1. Variant's featured_image from __NEXT_DATA__ (S5 gallery image)
        // 2. Hardcoded S5_PRODUCT_IMAGES fallback
        // 3. S5 from HTML
        // 4. S7 swatch as last resort
        
        let imageUrl: string | null = null;
        let imageSource = 'none';
        
        // PRIORITY 1: Variant's own featured_image from __NEXT_DATA__ (most accurate - S5 gallery)
        const variantFeaturedImg = v?.featured_image?.src || v?.featured_image;
        if (variantFeaturedImg && typeof variantFeaturedImg === 'string') {
          const variantImgUrl = variantFeaturedImg.replace(/^\/\//, 'https://');
          if (variantImgUrl.includes('/s5/')) {
            imageUrl = variantImgUrl;
            imageSource = 'variant_featured_s5';
          }
        }
        
        // PRIORITY 2: Check hardcoded S5 mapping
        if (!imageUrl && productSlug) {
          const hardcodedS5 = getHardcodedS5Image(productSlug, colorName);
          if (hardcodedS5) {
            imageUrl = hardcodedS5;
            imageSource = 'hardcoded_s5';
          }
        }
        
        // PRIORITY 3: S5 from HTML
        if (!imageUrl) {
          imageUrl = s5GalleryImages.get(colorKey) || null;
          if (imageUrl) imageSource = 'html_s5';
        }
        
        // PRIORITY 4: Try variant's image.src (may be S5)
        if (!imageUrl) {
          const variantImg = v?.image?.src;
          if (variantImg && typeof variantImg === 'string') {
            const variantImgUrl = variantImg.replace(/^\/\//, 'https://');
            if (variantImgUrl.includes('/s5/')) {
              imageUrl = variantImgUrl;
              imageSource = 'variant_image_s5';
            }
          }
        }
        
        // PRIORITY 5: Try flexible matching from colorImageMap (may include S5)
        if (!imageUrl) {
          const matched = findBestImageForColor(colorKey, colorImageMap);
          if (matched && matched.includes('/s5/')) {
            imageUrl = matched;
            imageSource = 'colormap_s5';
          }
        }
        
        // LAST RESORT: S7 swatch (not ideal - tiny thumbnails)
        if (!imageUrl && s7SwatchImages.has(colorKey)) {
          imageUrl = s7SwatchImages.get(colorKey) || null;
          if (imageUrl) {
            imageSource = 's7_swatch';
            console.log(`[BambuLab] WARNING: Using S7 swatch for "${colorKey}" - S5 extraction failed`);
          }
        }
        
        variants.push({
          colorName: colorName.trim(),
          colorHex: getBambuLabColorHex(colorName) || getColorHex(colorName) || null,
          imageUrl,
          variantId,
        });
      }
      
      if (variants.length > 0) {
        console.log(`[BambuLab] Extracted ${variants.length} color variants from __NEXT_DATA__`);
        const withS5 = variants.filter(v => v.imageUrl?.includes('/s5/')).length;
        const withS7 = variants.filter(v => v.imageUrl?.includes('/s7/')).length;
        const withHardcoded = variants.filter(v => {
          if (!v.imageUrl || !productSlug) return false;
          const hardcoded = getHardcodedS5Image(productSlug, v.colorName);
          return hardcoded && v.imageUrl === hardcoded;
        }).length;
        console.log(`[BambuLab] Images: ${withHardcoded} hardcoded S5, ${withS5 - withHardcoded} other S5, ${withS7} S7 swatch, ${variants.length - withS5 - withS7} other`);
        return variants;
      }
    } catch (e) {
      console.log(`[BambuLab] __NEXT_DATA__ parse failed, using HTML fallback`);
    }
  }
  
  // ========== STEP 5: Fallback to HTML color extraction ==========
  const colorNames = extractColorsFromPageContent(markdown, html);
  for (const colorName of colorNames) {
    const colorKey = colorName.toLowerCase();
    if (seenColors.has(colorKey)) continue;
    seenColors.add(colorKey);
    
    // PRIORITY ORDER for image assignment (same as __NEXT_DATA__ path)
    let imageUrl: string | null = null;
    
    // 1. Check hardcoded S5 mapping FIRST (most reliable)
    if (productSlug) {
      const hardcodedS5 = getHardcodedS5Image(productSlug, colorName);
      if (hardcodedS5) {
        imageUrl = hardcodedS5;
      }
    }
    
    // 2. Try S5 from HTML
    if (!imageUrl) {
      imageUrl = s5GalleryImages.get(colorKey) || null;
    }
    
    // 3. Try flexible matching (prefer S5)
    if (!imageUrl) {
      const matched = findBestImageForColor(colorKey, colorImageMap);
      if (matched && matched.includes('/s5/')) {
        imageUrl = matched;
      }
    }
    
    // 4. Last resort: S7 swatch
    if (!imageUrl && s7SwatchImages.has(colorKey)) {
      imageUrl = s7SwatchImages.get(colorKey) || null;
      if (imageUrl) {
        console.log(`[BambuLab] WARNING: Using S7 swatch for "${colorKey}" - add to S5_PRODUCT_IMAGES['${productSlug}']`);
      }
    }
    
    variants.push({
      colorName,
      colorHex: getBambuLabColorHex(colorName) || getColorHex(colorName) || null,
      imageUrl,
      variantId: null,  // No variant ID available from HTML fallback
    });
  }
  
  return variants;
}

// Helper to get default color for single-color products (e.g., CF, GF, PVA)
function getDefaultColorForProduct(title: string): string | null {
  const t = title.toLowerCase();
  
  // Carbon fiber products are typically black
  if (/-cf\b|carbon\s*fiber/i.test(t)) return 'Black';
  
  // Glass fiber products are typically natural/tan
  if (/-gf\b|glass\s*fiber/i.test(t)) return 'Natural';
  
  // PC is typically clear
  if (/\bpc\b/.test(t) && !/pc-cf|pc-gf/i.test(t)) return 'Clear';
  
  // PVA support is white
  if (/\bpva\b/i.test(t)) return 'White';
  
  // Generic support materials are white
  if (/\bsupport\b/i.test(t)) return 'White';
  
  // PPS-CF is black
  if (/pps-cf/i.test(t)) return 'Black';
  
  return null;
}

async function scrapeProductPage(url: string, firecrawlKey: string): Promise<ScrapedProduct | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: false, // Need full page for __NEXT_DATA__
        waitFor: 5000,
      }),
    });
    
    if (!response.ok) {
      console.error(`[BambuLab] Failed to scrape ${url}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const markdown = data.data?.markdown || '';
    const html = data.data?.html || '';
    
    // Extract H1 title (priority for product_title)
    let h1Title = '';
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                    markdown.match(/^#\s+(.+)$/m);
    if (h1Match) {
      h1Title = h1Match[1].trim();
    }
    
    // If no H1, try to extract from markdown headers
    if (!h1Title) {
      const mdHeaderMatch = markdown.match(/^##?\s+(.+)$/m);
      if (mdHeaderMatch) {
        h1Title = mdHeaderMatch[1].trim();
      }
    }
    
    // Extract price (USD)
    let price: number | null = null;
    const priceMatch = markdown.match(/\$(\d+(?:\.\d{2})?)\s*USD/i) ||
                       markdown.match(/From\s+\$(\d+(?:\.\d{2})?)/i) ||
                       markdown.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
    }
    
    // Extract fallback/default image URL
    let imageUrl: string | null = null;
    
    // Pattern 1: og:image meta tag (most reliable for product images)
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                         html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
    if (ogImageMatch && !ogImageMatch[1].includes('logo')) {
      imageUrl = ogImageMatch[1];
    }
    
    // Pattern 2: Product gallery images from HTML
    if (!imageUrl) {
      const galleryMatch = html.match(/data-(?:zoom-image|large-image|src)="(https:\/\/[^"]*(?:product|filament)[^"]+\.(?:jpg|jpeg|png|webp))"/i);
      if (galleryMatch) {
        imageUrl = galleryMatch[1];
      }
    }
    
    // Pattern 3: Main product image from img tags
    if (!imageUrl) {
      const mainImgMatch = html.match(/<img[^>]*class="[^"]*(?:product|main|featured|hero)[^"]*"[^>]*src="([^"]+)"/i) ||
                           html.match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*(?:product|main|featured|hero)[^"]*"/i);
      if (mainImgMatch && !mainImgMatch[1].includes('logo')) {
        imageUrl = mainImgMatch[1];
      }
    }
    
    // Pattern 4: Bambu Lab CDN images from markdown (fallback)
    if (!imageUrl) {
      const imgMatch = markdown.match(/!\[.*?\]\((https:\/\/store\.bblcdn\.com[^)]+)\)/);
      if (imgMatch && !imgMatch[1].includes('logo')) {
        imageUrl = imgMatch[1];
      }
    }
    
    // Extract color variants with their associated images
    let colorVariants = extractColorVariantsWithImages(html, markdown, url);
    
    // ABS fallback: If scraping returns 0 colors for ABS, use hardcoded known colors WITH images
    if (colorVariants.length === 0 && /\babs-filament\b/i.test(url)) {
      const absColors = ['Black', 'White', 'Silver', 'Red', 'Orange', 'Tangerine Yellow', 
                         'Bambu Green', 'Olive', 'Blue', 'Azure', 'Navy Blue', 'Purple'];
      colorVariants = absColors.map(colorName => ({
        colorName,
        colorHex: getBambuLabColorHex(colorName) || getColorHex(colorName) || null,
        imageUrl: ABS_COLOR_IMAGES[colorName.toLowerCase()] || null,
        variantId: null,  // No variant ID in fallback
      }));
      console.log(`[BambuLab] Using fallback colors WITH IMAGES for ABS: ${absColors.join(', ')}`);
    }
    
    console.log(`[BambuLab] Extracted ${colorVariants.length} color variants from ${url}: ${colorVariants.slice(0, 5).map(v => v.colorName).join(', ')}${colorVariants.length > 5 ? '...' : ''}`);
    
    // Extract weight (default 1000g for Bambu Lab spools)
    const weightGrams = extractWeightFromText(markdown) || 1000;
    
    // Check availability
    const soldOut = /sold\s*out/i.test(markdown);
    const available = !soldOut;
    
    return {
      url,
      h1Title,
      price,
      imageUrl,
      colorVariants,
      weightGrams,
      available,
    };
    
  } catch (error) {
    console.error(`[BambuLab] Error scraping ${url}:`, error);
    return null;
  }
}

async function scrapeProductPages(
  products: DiscoveredProduct[], 
  firecrawlKey: string
): Promise<ScrapedProduct[]> {
  const scraped: ScrapedProduct[] = [];
  
  console.log(`[BambuLab] Scraping ${products.length} product pages...`);
  
  // Process in batches of 5 for parallel efficiency
  const batchSize = 5;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(p => scrapeProductPage(p.url, firecrawlKey))
    );
    
    for (const result of batchResults) {
      if (result && result.h1Title) {
        scraped.push(result);
      }
    }
    
    // Progress logging
    console.log(`[BambuLab] Scraped ${Math.min(i + batchSize, products.length)}/${products.length} pages`);
    
    // Rate limit: 500ms between batches
    if (i + batchSize < products.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`[BambuLab] Successfully scraped ${scraped.length} products`);
  return scraped;
}

// ============================================================================
// STEP 3: FILTER AND PROCESS PRODUCTS
// ============================================================================

interface ProcessedProduct {
  productTitle: string;  // Full title with color (e.g., "PLA Tough+ Black")
  baseTitle: string;     // Base H1 title without color (e.g., "PLA Tough+")
  colorName: string | null;
  colorHex: string | null;
  price: number | null;
  imageUrl: string | null;
  productUrl: string;
  variantId: string | null;  // Shopify variant ID for ?id= URL parameter
  weightGrams: number;
  available: boolean;
}

function processScrapedProducts(products: ScrapedProduct[], decisionLogger: ReturnType<typeof createDecisionLogger>): ProcessedProduct[] {
  const processed: ProcessedProduct[] = [];
  const filterStats = createFilterStats();
  
  for (const product of products) {
    // Skip non-filament products
    if (isBambuLabNonFilament(product.h1Title)) {
      decisionLogger.logFilter(product.url, product.h1Title, { weight: 0, diameter: 1.75 }, { included: false, reason: 'non-filament detected' });
      console.log(`[BambuLab] Skipping non-filament: ${product.h1Title}`);
      continue;
    }
    
    // Skip 2.85mm diameter products (Bambu Lab only sells 1.75mm but check title anyway)
    if (is285mmDiameter(product.h1Title)) {
      decisionLogger.logFilter(product.url, product.h1Title, { weight: 0, diameter: 2.85 }, { included: false, reason: '2.85mm diameter detected' });
      console.log(`[BambuLab] Skipping 2.85mm product: ${product.h1Title}`);
      continue;
    }
    
    // Determine weight with sample/pack detection
    let weightGrams = extractWeightFromText(product.h1Title) || product.weightGrams;
    
    // If no weight found and "Sample" in title, assume sample weight
    if (!weightGrams && /\bsample\b/i.test(product.h1Title)) {
      weightGrams = 50;
      decisionLogger.logFilter(product.url, product.h1Title, { weight: 50, diameter: 1.75 }, { included: false, reason: 'sample product detected (50g)' });
      console.log(`[BambuLab] Detected sample product (50g): ${product.h1Title}`);
      continue; // Skip samples
    }
    
    // Check for pack count (N-pack = N x 1kg)
    if (!weightGrams) {
      const packMatch = product.h1Title.match(/(\d+)[\s-]*pack/i);
      if (packMatch) {
        weightGrams = parseInt(packMatch[1], 10) * 1000;
        console.log(`[BambuLab] Detected ${packMatch[1]}-pack (${weightGrams}g): ${product.h1Title}`);
      }
    }
    
    // Default to 1kg only for non-sample, non-pack products
    if (!weightGrams) {
      weightGrams = 1000;
    }
    
    // Use color variants from scraping (which now include color-specific images)
    // If no colors found, try to assign a default color for single-color products
    let colorVariantsToProcess: ColorVariantData[] = product.colorVariants.length > 0 
      ? product.colorVariants 
      : [{
          colorName: getDefaultColorForProduct(product.h1Title) || '',
          colorHex: null,
          imageUrl: null,
          variantId: null,
        }].filter(v => v.colorName);  // Remove if no default color
    
    // If still no variants, create one without a color name
    if (colorVariantsToProcess.length === 0) {
      colorVariantsToProcess = [{
        colorName: '',
        colorHex: null,
        imageUrl: null,
        variantId: null,
      }];
    }
    
    for (const colorVariant of colorVariantsToProcess) {
      // Apply variant filters
      const filterResult = shouldIncludeVariant(weightGrams, 1.75, product.h1Title);
      updateFilterStats(filterStats, filterResult);
      
      if (!filterResult.include) {
        decisionLogger.logFilter(product.url, product.h1Title, { weight: weightGrams, diameter: 1.75 }, { included: false, reason: filterResult.reason || 'filter failed' });
        console.log(`[BambuLab] Filtering: ${product.h1Title} (${filterResult.reason})`);
        continue;
      }
      
      decisionLogger.logFilter(product.url, product.h1Title, { weight: weightGrams, diameter: 1.75 }, { included: true, reason: 'passed all filters' });
      
      // Build full product title with color appended
      // e.g., "PLA Tough+" + "Black" -> "PLA Tough+ Black"
      const colorName = colorVariant.colorName || null;
      const productTitle = colorName 
        ? `${product.h1Title} ${colorName}`.trim()
        : product.h1Title;
      
      // Use color-specific image if available, otherwise fall back to product default
      const imageUrl = colorVariant.imageUrl || product.imageUrl;
      
      processed.push({
        productTitle,
        baseTitle: product.h1Title,
        colorName,
        colorHex: colorVariant.colorHex,
        price: product.price,
        imageUrl,
        productUrl: product.url,
        variantId: colorVariant.variantId,  // Pass through variant ID for URL
        weightGrams,
        available: product.available,
      });
    }
  }
  
  logFilterStats('Bambu Lab', filterStats);
  console.log(`[BambuLab] Processed ${processed.length} valid variants`);
  return processed;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    
    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    const dryRun = body.dryRun === true;
    
    console.log(`[BambuLab] Starting sync (cleanSlate: ${cleanSlate}, dryRun: ${dryRun})`);
    
    // ========================================================================
    // STEP 0: Create sync log entry
    // ========================================================================
    let syncLogId: string | null = null;
    
    if (!dryRun) {
      const { data: syncLog, error: syncLogError } = await supabase
        .from('brand_sync_logs')
        .insert({
          brand_slug: 'bambu-lab',
          sync_type: cleanSlate ? 'clean_slate' : 'incremental',
          status: 'running',
          started_at: new Date().toISOString(),
          triggered_by: 'manual',
        })
        .select('id')
        .single();
      
      if (syncLogError) {
        console.error('[BambuLab] Failed to create sync log:', syncLogError);
      }
      syncLogId = syncLog?.id;
    }
    
    // ========================================================================
    // STEP 1: Discover products from collection page
    // ========================================================================
    const discoveredProducts = await discoverProductsFromCollection(firecrawlKey);
    
    if (discoveredProducts.length === 0) {
      throw new Error('No product links discovered from collection page');
    }
    
    // ========================================================================
    // STEP 2: Scrape each product page
    // ========================================================================
    const scrapedProducts = await scrapeProductPages(discoveredProducts, firecrawlKey);
    
    if (scrapedProducts.length === 0) {
      throw new Error('No products successfully scraped');
    }
    
    // ========================================================================
    // STEP 3: Process and filter products (with decision logging)
    // ========================================================================
    const decisionLogger = createDecisionLogger({ brandSlug: 'bambu-lab', syncLogId: syncLogId || undefined });
    const processedProducts = processScrapedProducts(scrapedProducts, decisionLogger);
    
    // ========================================================================
    // STEP 4: Safety validation (STRICT - throw error if below threshold)
    // ========================================================================
    if (processedProducts.length < BAMBULAB_SAFE_DELETE_THRESHOLD) {
      throw new Error(
        `Safety check failed: Only ${processedProducts.length} products processed, ` +
        `minimum ${BAMBULAB_SAFE_DELETE_THRESHOLD} required for clean slate sync`
      );
    }
    
    console.log(`[BambuLab] Products ready for insertion: ${processedProducts.length}`);
    
    // Dry run - return early with discovery results
    if (dryRun) {
      const duration = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          summary: {
            totalDiscovered: discoveredProducts.length,
            totalScraped: scrapedProducts.length,
            totalVariants: processedProducts.length,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
          },
          sampleProducts: processedProducts.slice(0, 10).map(p => ({
            title: p.productTitle,
            color: p.colorName,
            price: p.price,
            weight: p.weightGrams,
          })),
          duration: `${(duration / 1000).toFixed(1)}s`,
          duration_ms: duration,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ========================================================================
    // STEP 5: Clean slate deletion (if enabled)
    // ========================================================================
    if (cleanSlate) {
      console.log('[BambuLab] Performing clean slate deletion...');
      
      const { error: deleteError, count: deleteCount } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'bambu lab');
      
      if (deleteError) {
        console.error('[BambuLab] Delete error:', deleteError);
        throw new Error(`Failed to delete existing products: ${deleteError.message}`);
      }
      
      console.log(`[BambuLab] Deleted ${deleteCount || 0} existing products`);
    }
    
    // ========================================================================
    // STEP 6: Insert products with enrichment
    // ========================================================================
    const productsToInsert: any[] = [];
    let skipped = 0;
    let errors = 0;
    
    for (const product of processedProducts) {
      try {
        // Enrich product with material info, finish type, etc.
        // Use baseTitle for enrichment (material detection) but productTitle for display
        const config = getBambuLabProductLineConfig(product.baseTitle);
        const enrichment = enrichBambuLabProduct(product.baseTitle);
        
        // Use color hex from processing (already resolved), or fallback
        let colorHex = product.colorHex;
        if (!colorHex && product.colorName) {
          colorHex = getBambuLabColorHex(product.colorName) || getColorHex(product.colorName);
        }
        const colorFamily = product.colorName ? getColorFamily(product.colorName) : null;
        
        // Determine material from product line ID
        let material = 'PLA';
        const plId = enrichment.productLineId.toLowerCase();
        if (plId.includes('tpu')) material = 'TPU';
        else if (plId.includes('abs')) material = 'ABS';
        else if (plId.includes('asa')) material = 'ASA';
        else if (plId.includes('petg')) material = 'PETG';
        else if (plId.includes('pc-')) material = 'PC';
        else if (plId.includes('pa-') || plId.includes('pa6')) material = 'PA';
        else if (plId.includes('pet-cf')) material = 'PET-CF';
        else if (plId.includes('pps')) material = 'PPS';
        else if (plId.includes('pva')) material = 'PVA';
        else if (plId.includes('support')) material = 'Support';
        
        // Build variant-specific product URL with ?id= parameter
        // This ensures "Buy Now" links go directly to the selected color variant
        const variantUrl = product.variantId 
          ? `${product.productUrl}?id=${product.variantId}`
          : product.productUrl;
        
        // Build product record - use baseTitle for product_title (matches page H1)
        // Color is stored separately in color_family field
        const productRecord = {
          product_title: product.baseTitle,  // H1 title without color (e.g., "PLA Tough+")
          vendor: BAMBULAB_STORE_INFO.vendor,
          material,
          finish_type: enrichment.finishType,
          product_line_id: enrichment.productLineId,
          color_family: product.colorName || colorFamily,
          color_hex: colorHex,
          variant_price: product.price,
          variant_compare_at_price: null,
          variant_available: product.available,
          featured_image: product.imageUrl,
          product_url: variantUrl,  // Variant-specific URL with ?id= parameter
          net_weight_g: product.weightGrams,
          diameter_nominal_mm: 1.75,
          is_nozzle_abrasive: config.isAbrasive,
          high_speed_capable: config.highSpeedCapable,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
        };
        
        productsToInsert.push(productRecord);
        
      } catch (error) {
        console.error(`[BambuLab] Error processing ${product.productTitle}:`, error);
        errors++;
      }
    }
    
    // Batch insert
    let created = 0;
    const batchSize = 50;
    
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      
      const { error: insertError, data: insertedData } = await supabase
        .from('filaments')
        .insert(batch)
        .select('id');
      
      if (insertError) {
        console.error(`[BambuLab] Batch insert error (${i}-${i + batch.length}):`, insertError);
        errors += batch.length;
      } else {
        created += insertedData?.length || batch.length;
      }
      
      // Progress logging
      if ((i + batchSize) % 100 === 0 || i + batchSize >= productsToInsert.length) {
        console.log(`[BambuLab] Inserted ${Math.min(i + batchSize, productsToInsert.length)}/${productsToInsert.length} products`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Update sync log
    if (syncLogId) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: errors > 0 && created === 0 ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round(duration / 1000),
          products_discovered: discoveredProducts.length,
          products_created: created,
          products_failed: errors,
        })
        .eq('id', syncLogId);
    }
    
    // Update brand product counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'bambu-lab' });
    
    console.log(`[BambuLab] Sync complete: ${created} created, ${skipped} skipped, ${errors} errors`);
    
    const result: SyncResult = {
      success: errors === 0 || created > 0,
      summary: {
        totalDiscovered: discoveredProducts.length,
        totalScraped: scrapedProducts.length,
        created,
        updated: 0,
        skipped,
        errors,
      },
      duration: `${(duration / 1000).toFixed(1)}s`,
      duration_ms: duration,
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[BambuLab] Sync failed:', error);
    const duration = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${(duration / 1000).toFixed(1)}s`,
        duration_ms: duration,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
