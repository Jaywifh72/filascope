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

// ========== ABS FALLBACK IMAGE MAPPING ==========
// When scraping fails for ABS (JS-rendered color picker), use these known images
// Source: https://us.store.bambulab.com/products/abs-filament (manually extracted)
const ABS_COLOR_IMAGES: Record<string, string> = {
  'silver': 'https://store.bblcdn.com/s7/default/69834a7536c540e489913a0f8e707e5e/ABSsilver.png',
  'black': 'https://store.bblcdn.com/s7/default/cfdefec225e6430c82cbe2f8766b6f70/ABS_Black.png',
  'white': 'https://store.bblcdn.com/s7/default/1ad485ff4a72413b90e944ffde4fa861/ABS_White.png',
  'bambu green': 'https://store.bblcdn.com/s7/default/910be80e4fcf43ddbd66c40773ecce0f/ABSbambugreen.png',
  'orange': 'https://store.bblcdn.com/s7/default/25d7b833bf694c70b9ef3cd649f3cf36/ABSorange.png',
  'red': 'https://store.bblcdn.com/s7/default/95bd38c6dc604bdab7b3d2fc7b67e0ee/ABS_Red.png',
  'blue': 'https://store.bblcdn.com/s7/default/3b2f526b80734e429d9a424e07f3c36b/ABS_Blue.png',
  'olive': 'https://store.bblcdn.com/s7/default/e45f66c840c7454b860b0ffb17787dda/80cf6768c03d129dfa6a01ac67a5b402.jpg',
  'tangerine yellow': 'https://store.bblcdn.com/s7/default/599d443346194649beee96e12f32d074/7376d19b161f2a93a4051e47289d0505.jpg',
  'azure': 'https://store.bblcdn.com/s7/default/1de0e532e21642e1a4a857c6e01fa1d3/0be9a584b30358020d8706f2aa8ec9c2.jpg',
  'navy blue': 'https://store.bblcdn.com/s7/default/a840092ea2804025a123e115128c1299/000878ce6144c05ffac949f66b05a18b.jpg',
  'purple': 'https://store.bblcdn.com/s7/default/a840092ea2804025a123e115128c1299/ABS_Purple.jpg',
};

interface DiscoveredProduct {
  url: string;
  collectionTitle: string;
}

// Color variant with associated image
interface ColorVariantData {
  colorName: string;
  colorHex: string | null;
  imageUrl: string | null;
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
 * Extract color variants with their associated images from __NEXT_DATA__ JSON
 * Bambu Lab stores variant images in the page props
 * 
 * Enhanced Pattern: Also extracts all CDN images and matches them to color names
 * based on URL patterns like "PLA_Tough_Black.png" or "ABS-Red-1kg.webp"
 */
function extractColorVariantsWithImages(html: string, markdown: string, productUrl: string): ColorVariantData[] {
  const variants: ColorVariantData[] = [];
  const seenColors = new Set<string>();
  
  // Build a map of color names to images from HTML patterns
  const colorImageMap = new Map<string, string>();
  
  // ========== ENHANCED PATTERN: Extract ALL CDN images and match by color name in URL ==========
  // Bambu Lab images follow naming patterns like:
  // - https://store.bblcdn.com/.../PLA_Tough_Black.png
  // - https://store.bblcdn.com/.../PLA-Matte_Ivory-White.png
  // - https://store.bblcdn.com/.../PETG-Basic-Blue.jpg
  const cdnImageMatches = html.matchAll(/https:\/\/store\.bblcdn\.com[^"'\s<>]+\.(?:png|jpg|jpeg|webp)/gi);
  const allCdnImages = [...new Set([...cdnImageMatches].map(m => m[0]))]; // Dedupe
  
  // Filter to likely PRODUCT images - more permissive now
  // EXCLUDE: logos, icons, banners, shipping, badges, thumbnails
  // INCLUDE: filament spools, material images, product shots
  const productImages = allCdnImages.filter(url => {
    const lower = url.toLowerCase();
    const filename = lower.split('/').pop() || '';
    
    // Exclude non-product images
    if (lower.includes('logo') || lower.includes('icon') || lower.includes('banner') ||
        lower.includes('badge') || lower.includes('shipping') || lower.includes('cart') ||
        lower.includes('checkout') || lower.includes('nav')) {
      return false;
    }
    
    // Include if filename has color indicators or is a spool image
    // Many Bambu Lab images have color names in the filename like "PLA-Matte_Ivory-White.png"
    const colorIndicators = [
      'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
      'grey', 'gray', 'brown', 'tan', 'gold', 'silver', 'jade', 'ivory', 'charcoal',
      'coral', 'cyan', 'navy', 'olive', 'maroon', 'salmon', 'lime', 'clear', 'natural',
      'magenta', 'teal', 'cream', 'bronze', 'copper', 'beige', 'slate', 'scarlet',
      'lemon', 'grass', 'sakura', 'marine', 'midnight', 'mandarin', 'caramel', 'plum',
      'nardo', 'desert', 'terracotta', 'latte', 'bone', 'ash', 'apple', 'chocolate',
      'ice', 'sky', 'dark', 'cold', 'warm', 'matte', 'silk', 'translucent', 'galaxy',
      'rainbow', 'gradient', 'multicolor', 'dual'
    ];
    
    // Check if filename contains any color indicator
    for (const indicator of colorIndicators) {
      if (filename.includes(indicator)) return true;
    }
    
    // Also include spool images and material-specific images
    if (filename.includes('spool') || filename.includes('spl') ||
        filename.includes('pla') || filename.includes('petg') || filename.includes('abs') ||
        filename.includes('tpu') || filename.includes('pa-') || filename.includes('pa_') ||
        filename.includes('pc_') || filename.includes('pc-') || filename.includes('asa')) {
      return true;
    }
    
    return false;
  });
  
  console.log(`[BambuLab] Found ${allCdnImages.length} total CDN images, ${productImages.length} likely product images`);
  
  // Enhanced color matching: match compound colors in filenames
  // Example: "PLA-Matte_Ivory-White.png" should map to "Matte Ivory White"
  // Example: "PLA-Basic_Blue-Gray.png" should map to "Blue Gray"
  // Example: "PETG_Jade_White.png" should map to "Jade White"
  
  for (const imageUrl of productImages) {
    const filename = (imageUrl.split('/').pop() || '').toLowerCase();
    
    // Remove file extension and common prefixes
    const cleanFilename = filename
      .replace(/\.(png|jpg|jpeg|webp).*$/, '') // Remove extension and params
      .replace(/^(pla|petg|abs|tpu|pa|pc|asa|pva)[-_]?/i, '') // Remove material prefix
      .replace(/^(matte|silk|basic|tough|hf|translucent|cf|gf)[-_]?/i, '') // Remove type prefix
      .replace(/[-_]+/g, ' ') // Convert separators to spaces
      .trim();
    
    // Skip generic/non-color filenames
    if (!cleanFilename || cleanFilename.length < 3 || 
        /^\d+$/.test(cleanFilename) || // Just numbers
        /^[a-f0-9]{8,}$/i.test(cleanFilename) || // GUID
        /spool|web|product|filament|original|v\d|_\d/i.test(cleanFilename)) {
      continue;
    }
    
    // This is likely a color-specific image - store the extracted color name
    // The key should match what we'll look up later (lowercase, normalized)
    const colorKey = cleanFilename.toLowerCase().replace(/\s+/g, ' ').trim();
    
    if (colorKey.length >= 3 && !colorImageMap.has(colorKey)) {
      colorImageMap.set(colorKey, imageUrl);
      console.log(`[BambuLab] Mapped color "${colorKey}" to image: ${imageUrl.substring(0, 80)}...`);
    }
    
    // Also store individual color components for partial matching
    // e.g., "ivory white" -> store both "ivory white" AND "ivory" AND "white" 
    const colorWords = colorKey.split(' ').filter(w => w.length >= 3);
    for (const word of colorWords) {
      if (!colorImageMap.has(word) && !['the', 'and', 'for', 'spl', 'web'].includes(word)) {
        colorImageMap.set(word, imageUrl);
      }
    }
  }
  
  console.log(`[BambuLab] CDN URL pattern matching found ${colorImageMap.size} color-image mappings`);
  
  // ========== PATTERN 0 (HIGHEST PRIORITY): Color Selector <li value="ColorName (SKU)"> ==========
  // Bambu Lab's color selector uses this structure:
  // <li value="Gold (13405)" class="...property_selector..."><img src="https://store.bblcdn.com/s7/...">
  // This is the MOST RELIABLE pattern - directly maps color name to its swatch image
  
  // Pattern: <li value="ColorName (optional SKU)"> followed by <img src="...">
  // Match the li element and extract color from value attribute, then find img inside
  const colorSelectorRegex = /<li[^>]*value="([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="(https:\/\/store\.bblcdn\.com[^"]+)"[^>]*>/gi;
  let colorSelectorMatches = 0;
  
  for (const match of html.matchAll(colorSelectorRegex)) {
    const rawValue = match[1].trim(); // e.g., "Gold (13405)" or "Titan Gray"
    const imageUrl = match[2];
    
    // Extract clean color name - remove SKU in parentheses if present
    const colorName = rawValue.replace(/\s*\([^)]+\)$/, '').trim();
    
    // Validate color name
    if (!colorName || colorName.length < 2) continue;
    if (/^[0-9]+$/.test(colorName)) continue; // Just numbers
    if (/^[a-f0-9]{8,}$/i.test(colorName)) continue; // GUID
    if (!isValidColorName(colorName)) continue;
    
    const colorKey = colorName.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // IMPORTANT: Prioritize this over CDN filename patterns - overwrite if exists
    colorImageMap.set(colorKey, imageUrl);
    colorSelectorMatches++;
    console.log(`[BambuLab] Color selector: "${colorName}" -> ${imageUrl.substring(0, 70)}...`);
  }
  
  console.log(`[BambuLab] Color selector pattern found ${colorSelectorMatches} color-image mappings`);
  
  // ========== PATTERN 1: Extract images from variant gallery/picker HTML ==========
  // Look for patterns like: <img src="...Black.png..." alt="Black">
  const imgPatterns = [
    /<img[^>]*src="(https:\/\/store\.bblcdn\.com[^"]+)"[^>]*alt="([A-Z][a-zA-Z\s]+)"[^>]*>/gi,
    /<img[^>]*alt="([A-Z][a-zA-Z\s]+)"[^>]*src="(https:\/\/store\.bblcdn\.com[^"]+)"[^>]*>/gi,
  ];
  
  for (const pattern of imgPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const src = match[1].includes('bblcdn.com') ? match[1] : match[2];
      const alt = match[1].includes('bblcdn.com') ? match[2] : match[1];
      
      if (alt && isValidColorName(alt) && src && !src.includes('logo')) {
        const colorKey = alt.toLowerCase();
        // Don't overwrite color selector mappings
        if (!colorImageMap.has(colorKey)) {
          colorImageMap.set(colorKey, src);
        }
      }
    }
  }
  
  // ========== PATTERN 2: Try to find variant data in JSON-LD or embedded scripts ==========
  const scriptMatches = html.matchAll(/<script[^>]*>([^<]*variant[^<]*image[^<]*)<\/script>/gi);
  for (const scriptMatch of scriptMatches) {
    try {
      // Look for variant objects with image URLs
      const variantImages = scriptMatch[1].matchAll(/"(?:title|name)":\s*"([^"]+)"[^}]*"(?:image|src|featured_image)":\s*(?:\{[^}]*"src":\s*)?"([^"]+)"/gi);
      for (const vm of variantImages) {
        const colorName = vm[1];
        const imageUrl = vm[2];
        if (isValidColorName(colorName) && imageUrl && !imageUrl.includes('logo')) {
          const colorKey = colorName.toLowerCase();
          if (!colorImageMap.has(colorKey)) {
            colorImageMap.set(colorKey, imageUrl.replace(/^\/\//, 'https://'));
          }
        }
      }
    } catch (e) {
      // Continue
    }
  }
  
  // Try __NEXT_DATA__ JSON first (most reliable for color-image mapping)
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      // Navigate to product variants in Next.js page props - check multiple paths
      const productVariants = nextData?.props?.pageProps?.product?.variants || 
                              nextData?.props?.pageProps?.data?.product?.variants ||
                              nextData?.props?.pageProps?.initialData?.product?.variants || [];
      
      // Also check for images in product.images array with position/alt mapping
      const productImages = nextData?.props?.pageProps?.product?.images ||
                            nextData?.props?.pageProps?.data?.product?.images || [];
      
      // Build a position-to-image map
      const positionImageMap = new Map<number, string>();
      for (const img of productImages) {
        if (img.position !== undefined && img.src) {
          positionImageMap.set(img.position, img.src.replace(/^\/\//, 'https://'));
        }
        // Also try alt text matching
        if (img.alt && img.src && isValidColorName(img.alt)) {
          colorImageMap.set(img.alt.toLowerCase(), img.src.replace(/^\/\//, 'https://'));
        }
      }
      
      for (const v of productVariants) {
        const colorName = v?.option1 || v?.selectedOptions?.[0]?.value || v?.title;
        if (!colorName || !isValidColorName(colorName)) continue;
        
        // Skip duplicates
        const colorKey = colorName.toLowerCase();
        if (seenColors.has(colorKey)) continue;
        seenColors.add(colorKey);
        
        // Get image URL - check multiple possible locations
        let imageUrl = v?.image?.src || v?.featured_image?.src || v?.featured_image || null;
        
        // Try position mapping
        if (!imageUrl && v?.image_id) {
          const posImg = positionImageMap.get(v.image_id);
          if (posImg) imageUrl = posImg;
        }
        
        // Try color name mapping from HTML patterns - use flexible matching
        if (!imageUrl) {
          imageUrl = findBestImageForColor(colorKey, colorImageMap);
        }
        
        // Clean up image URL (remove query params that might cause issues)
        if (imageUrl && typeof imageUrl === 'string') {
          // Ensure HTTPS
          imageUrl = imageUrl.replace(/^\/\//, 'https://');
        }
        
        variants.push({
          colorName: colorName.trim(),
          colorHex: getBambuLabColorHex(colorName) || getColorHex(colorName) || null,
          imageUrl,
        });
      }
      
      if (variants.length > 0) {
        console.log(`[BambuLab] Extracted ${variants.length} color variants from __NEXT_DATA__`);
        const withImages = variants.filter(v => v.imageUrl).length;
        console.log(`[BambuLab] ${withImages}/${variants.length} variants have color-specific images`);
        return variants;
      }
    } catch (e) {
      // JSON parse failed, continue with fallback methods
      console.log(`[BambuLab] __NEXT_DATA__ parse failed, using HTML fallback`);
    }
  }
  
  // Fallback: Use extractColorsFromPageContent and check colorImageMap for images
  const colorNames = extractColorsFromPageContent(markdown, html);
  for (const colorName of colorNames) {
    const colorKey = colorName.toLowerCase();
    if (seenColors.has(colorKey)) continue;
    seenColors.add(colorKey);
    
    variants.push({
      colorName,
      colorHex: getBambuLabColorHex(colorName) || getColorHex(colorName) || null,
      imageUrl: findBestImageForColor(colorKey, colorImageMap),
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
        }].filter(v => v.colorName);  // Remove if no default color
    
    // If still no variants, create one without a color name
    if (colorVariantsToProcess.length === 0) {
      colorVariantsToProcess = [{
        colorName: '',
        colorHex: null,
        imageUrl: null,
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
          product_url: product.productUrl,
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
