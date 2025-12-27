/**
 * NINJATEK IMAGE & DATA SCRAPER (Enhanced WooCommerce)
 * 
 * Uses Firecrawl for WooCommerce product page scraping
 * Enhanced extraction patterns for:
 * - Product images (WooCommerce gallery, data-large_image, OG tags)
 * - Prices (sale/regular from structured price elements)
 * - TDS links (PDF patterns in description)
 * - MPN/SKU from WooCommerce SKU element
 * - Weight from product specs
 * - Color from variant selectors and title
 * 
 * DEBUG ENHANCED: Comprehensive logging for troubleshooting
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  validateScrapedProduct, 
  sanitizeScrapedProduct,
  type ScrapedProduct 
} from "../_shared/scraper-validation.ts";
import { getColorHex, getColorFamily, extractColorFromTitle, COLOR_HEX_MAP } from "../_shared/color-mapping.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting - NinjaTek can be slow
const RATE_LIMIT_MS = 2500;
const MAX_RETRIES = 3;

interface ScrapeResult {
  id: string;
  title: string;
  status: 'updated' | 'skipped' | 'error' | 'no_data';
  image?: string | null;
  tds?: string | null;
  price?: number | null;
  weight?: number | null;
  colorHex?: string | null;
  mpn?: string | null;
  validationErrors?: string[];
  validationWarnings?: string[];
  error?: string;
  debugInfo?: Record<string, unknown>;
}

/**
 * Enhanced WooCommerce price extraction with debug logging
 */
function extractWooCommercePrice(html: string, markdown: string): { price: number | null; compareAtPrice: number | null; debugInfo: string[] } {
  let price: number | null = null;
  let compareAtPrice: number | null = null;
  const debugInfo: string[] = [];
  
  // Strategy 1: Sale price (in <ins> tag) with original price (in <del> tag)
  const saleMatch = html.match(/<del[^>]*>.*?<bdi>\s*\$\s*(\d+(?:\.\d{2})?)\s*<\/bdi>.*?<\/del>.*?<ins[^>]*>.*?<bdi>\s*\$\s*(\d+(?:\.\d{2})?)\s*<\/bdi>.*?<\/ins>/is);
  if (saleMatch) {
    compareAtPrice = parseFloat(saleMatch[1]);
    price = parseFloat(saleMatch[2]);
    debugInfo.push(`Sale price found: $${price} (was $${compareAtPrice})`);
    if (price > 0 && price < 200) {
      return { price, compareAtPrice, debugInfo };
    }
  }
  
  // Strategy 2: WooCommerce Price amount with bdi element
  const priceAmountMatch = html.match(/<span class="woocommerce-Price-amount[^"]*"[^>]*>.*?<bdi>\s*\$\s*(\d+(?:\.\d{2})?)\s*<\/bdi>/i);
  if (priceAmountMatch?.[1]) {
    price = parseFloat(priceAmountMatch[1]);
    debugInfo.push(`WooCommerce bdi price: $${price}`);
    if (price > 0 && price < 200) {
      return { price, compareAtPrice: null, debugInfo };
    }
  }
  
  // Strategy 3: Simple price span
  const simplePriceMatch = html.match(/<span class="woocommerce-Price-amount[^"]*"[^>]*>\s*\$?\s*(\d+(?:\.\d{2})?)\s*<\/span>/i);
  if (simplePriceMatch?.[1]) {
    price = parseFloat(simplePriceMatch[1]);
    debugInfo.push(`Simple price span: $${price}`);
    if (price > 0 && price < 200) {
      return { price, compareAtPrice: null, debugInfo };
    }
  }
  
  // Strategy 4: Meta tag price
  const metaPriceMatch = html.match(/<meta[^>]*property="product:price:amount"[^>]*content="(\d+(?:\.\d{2})?)"/i) ||
                         html.match(/<meta[^>]*content="(\d+(?:\.\d{2})?)"[^>]*property="product:price:amount"/i);
  if (metaPriceMatch?.[1]) {
    price = parseFloat(metaPriceMatch[1]);
    debugInfo.push(`Meta tag price: $${price}`);
    if (price > 0 && price < 200) {
      return { price, compareAtPrice: null, debugInfo };
    }
  }
  
  // Strategy 5: JSON-LD structured data
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
        const json = JSON.parse(jsonContent);
        if (json.offers?.price || json['@graph']?.find((item: Record<string, unknown>) => item.offers)) {
          const offers = json.offers || json['@graph']?.find((item: Record<string, unknown>) => item.offers)?.offers;
          if (offers?.price) {
            price = parseFloat(offers.price);
            debugInfo.push(`JSON-LD price: $${price}`);
            if (price > 0 && price < 200) {
              return { price, compareAtPrice: null, debugInfo };
            }
          }
        }
      } catch {
        // Invalid JSON, continue
      }
    }
  }
  
  // Strategy 6: Markdown price patterns
  const mdPriceMatch = markdown.match(/\$(\d+(?:\.\d{2})?)/);
  if (mdPriceMatch?.[1]) {
    price = parseFloat(mdPriceMatch[1]);
    debugInfo.push(`Markdown price: $${price}`);
    if (price >= 15 && price <= 150) {
      return { price, compareAtPrice: null, debugInfo };
    }
  }
  
  debugInfo.push('No valid price found');
  return { price: null, compareAtPrice: null, debugInfo };
}

/**
 * Enhanced WooCommerce image extraction with debug logging
 */
function extractWooCommerceImage(html: string): { imageUrl: string | null; debugInfo: string[] } {
  const debugInfo: string[] = [];
  
  // Strategy 1: JSON-LD structured data (most reliable for WooCommerce)
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
        const json = JSON.parse(jsonContent);
        const image = json.image || json['@graph']?.find((item: Record<string, unknown>) => item.image)?.image;
        if (image) {
          const imgUrl = Array.isArray(image) ? image[0] : image;
          if (typeof imgUrl === 'string' && imgUrl.includes('.')) {
            debugInfo.push(`Found JSON-LD image: ${imgUrl.substring(0, 60)}...`);
            return { imageUrl: imgUrl, debugInfo };
          }
        }
      } catch {
        // Invalid JSON, continue
      }
    }
  }
  
  // Strategy 2: data-large_image attribute (highest resolution for WooCommerce)
  const largeImageMatch = html.match(/data-large_image="([^"]+)"/i);
  if (largeImageMatch?.[1]) {
    debugInfo.push(`Found data-large_image: ${largeImageMatch[1].substring(0, 60)}...`);
    return { imageUrl: largeImageMatch[1], debugInfo };
  }
  
  // Strategy 3: WooCommerce product gallery main image
  const galleryMatch = html.match(/class="woocommerce-product-gallery__image[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"/i);
  if (galleryMatch?.[1]) {
    debugInfo.push(`Found gallery image: ${galleryMatch[1].substring(0, 60)}...`);
    return { imageUrl: galleryMatch[1], debugInfo };
  }
  
  // Strategy 4: WooCommerce product gallery wrapper with data-thumb
  const galleryWrapperMatch = html.match(/class="woocommerce-product-gallery__wrapper"[^>]*>[\s\S]*?data-large_image="([^"]+)"/i);
  if (galleryWrapperMatch?.[1]) {
    debugInfo.push(`Found gallery wrapper image: ${galleryWrapperMatch[1].substring(0, 60)}...`);
    return { imageUrl: galleryWrapperMatch[1], debugInfo };
  }
  
  // Strategy 5: OG image (reliable fallback)
  const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                      html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
  if (ogImageMatch?.[1] && !ogImageMatch[1].includes('placeholder') && !ogImageMatch[1].includes('logo')) {
    debugInfo.push(`Found og:image: ${ogImageMatch[1].substring(0, 60)}...`);
    return { imageUrl: ogImageMatch[1], debugInfo };
  }
  
  // Strategy 6: Twitter image
  const twitterImageMatch = html.match(/<meta\s+(?:name="twitter:image"|property="twitter:image")\s+content="([^"]+)"/i);
  if (twitterImageMatch?.[1] && !twitterImageMatch[1].includes('placeholder')) {
    debugInfo.push(`Found twitter:image: ${twitterImageMatch[1].substring(0, 60)}...`);
    return { imageUrl: twitterImageMatch[1], debugInfo };
  }
  
  // Strategy 7: First product image in wp-content/uploads for NinjaTek specifically
  const ninjatekImageMatch = html.match(/src="(https:\/\/ninjatek\.com\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))"/i);
  if (ninjatekImageMatch?.[1] && 
      !ninjatekImageMatch[1].includes('placeholder') && 
      !ninjatekImageMatch[1].includes('icon') && 
      !ninjatekImageMatch[1].includes('logo')) {
    // Remove size suffix to get full-size image
    const fullSizeUrl = ninjatekImageMatch[1].replace(/-\d+x\d+\./, '.');
    debugInfo.push(`Found NinjaTek wp-content image: ${fullSizeUrl.substring(0, 60)}...`);
    return { imageUrl: fullSizeUrl, debugInfo };
  }
  
  // Strategy 8: Any high-quality product image with size indicators
  const sizedImageMatch = html.match(/src="([^"]+(?:1024x|800x|600x|product)[^"]*\.(?:jpg|jpeg|png|webp))"/i);
  if (sizedImageMatch?.[1] && !sizedImageMatch[1].includes('placeholder') && !sizedImageMatch[1].includes('icon')) {
    debugInfo.push(`Found sized product image: ${sizedImageMatch[1].substring(0, 60)}...`);
    return { imageUrl: sizedImageMatch[1], debugInfo };
  }
  
  // Strategy 9: Any image with product in class
  const productClassImageMatch = html.match(/class="[^"]*product[^"]*"[^>]*src="([^"]+\.(?:jpg|jpeg|png|webp))"/i) ||
                                  html.match(/src="([^"]+\.(?:jpg|jpeg|png|webp))"[^>]*class="[^"]*product[^"]*"/i);
  if (productClassImageMatch?.[1] && 
      !productClassImageMatch[1].includes('placeholder') && 
      !productClassImageMatch[1].includes('icon')) {
    debugInfo.push(`Found product class image: ${productClassImageMatch[1].substring(0, 60)}...`);
    return { imageUrl: productClassImageMatch[1], debugInfo };
  }
  
  // Strategy 10: Any attachment image in content
  const attachmentMatch = html.match(/class="attachment-[^"]*"[^>]*src="([^"]+)"/i);
  if (attachmentMatch?.[1] && !attachmentMatch[1].includes('icon')) {
    debugInfo.push(`Found attachment image: ${attachmentMatch[1].substring(0, 60)}...`);
    return { imageUrl: attachmentMatch[1], debugInfo };
  }
  
  debugInfo.push('No valid image found');
  return { imageUrl: null, debugInfo };
}

/**
 * Enhanced TDS URL extraction with NinjaTek-specific patterns
 */
function extractNinjaTekTds(html: string, markdown: string): { tdsUrl: string | null; debugInfo: string[] } {
  const debugInfo: string[] = [];
  const tdsPatterns = [
    // NinjaTek uses these patterns
    { pattern: /href="([^"]*TDS[^"]*\.pdf)"/gi, name: 'TDS pattern' },
    { pattern: /href="([^"]*technical[_-]?data[_-]?sheet[^"]*\.pdf)"/gi, name: 'Technical data sheet' },
    { pattern: /href="([^"]*_TDS_[^"]*\.pdf)"/gi, name: '_TDS_ pattern' },
    { pattern: /href="(https?:\/\/[^"]*ninjatek[^"]*\.pdf)"/gi, name: 'NinjaTek PDF' },
    { pattern: /href="([^"]*datasheet[^"]*\.pdf)"/gi, name: 'Datasheet' },
    { pattern: /href="([^"]*safety[_-]?data[^"]*\.pdf)"/gi, name: 'Safety data' },
    { pattern: /href="(https?:\/\/cdn[^"]*\.pdf)"/gi, name: 'CDN PDF' },
    { pattern: /href="([^"]*spec[_-]?sheet[^"]*\.pdf)"/gi, name: 'Spec sheet' },
    { pattern: /href="([^"]*product[_-]?info[^"]*\.pdf)"/gi, name: 'Product info' },
  ];
  
  for (const { pattern, name } of tdsPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        let url = match[1];
        if (!url.startsWith('http')) {
          url = url.startsWith('/') ? `https://ninjatek.com${url}` : `https://ninjatek.com/${url}`;
        }
        debugInfo.push(`Found TDS via ${name}: ${url.substring(0, 60)}...`);
        return { tdsUrl: url, debugInfo };
      }
    }
  }
  
  // Check markdown for PDF links
  const mdPdfMatch = markdown.match(/\[.*?(?:TDS|datasheet|spec).*?\]\((https?:\/\/[^\)]+\.pdf)\)/i) ||
                     markdown.match(/\((https?:\/\/[^\)]*(?:TDS|datasheet)[^\)]*\.pdf)\)/i);
  if (mdPdfMatch?.[1]) {
    debugInfo.push(`Found TDS in markdown: ${mdPdfMatch[1].substring(0, 60)}...`);
    return { tdsUrl: mdPdfMatch[1], debugInfo };
  }
  
  // Check for any PDF link as last resort
  const anyPdfMatch = html.match(/href="(https?:\/\/[^"]+\.pdf)"/i);
  if (anyPdfMatch?.[1] && !anyPdfMatch[1].includes('msds') && !anyPdfMatch[1].includes('invoice')) {
    debugInfo.push(`Found generic PDF: ${anyPdfMatch[1].substring(0, 60)}...`);
    return { tdsUrl: anyPdfMatch[1], debugInfo };
  }
  
  debugInfo.push('No TDS found');
  return { tdsUrl: null, debugInfo };
}

/**
 * Extract MPN/SKU from WooCommerce product page
 */
function extractWooCommerceMpn(html: string): string | null {
  // WooCommerce SKU element
  const skuMatch = html.match(/<span class="sku[^"]*">([^<]+)<\/span>/i);
  if (skuMatch?.[1]) {
    const sku = skuMatch[1].trim();
    if (sku && sku !== 'N/A' && sku.length > 0) {
      return sku;
    }
  }
  
  // Meta tag SKU
  const metaSkuMatch = html.match(/<meta[^>]*property="product:retailer_item_id"[^>]*content="([^"]+)"/i);
  if (metaSkuMatch?.[1]) {
    return metaSkuMatch[1];
  }
  
  // Product ID from data attribute
  const dataSkuMatch = html.match(/data-product_sku="([^"]+)"/i);
  if (dataSkuMatch?.[1]) {
    return dataSkuMatch[1];
  }
  
  // JSON-LD SKU
  const jsonLdMatch = html.match(/"sku"\s*:\s*"([^"]+)"/i);
  if (jsonLdMatch?.[1]) {
    return jsonLdMatch[1];
  }
  
  return null;
}

/**
 * Extract weight from product page
 */
function extractNinjaTekWeight(html: string, markdown: string, title: string): number | null {
  const text = `${title} ${markdown} ${html}`;
  
  // Common NinjaTek spool weights
  const weightPatterns = [
    /Net\s*Weight[:\s]*(\d+(?:\.\d+)?)\s*(?:g|grams?)/gi,
    /Weight[:\s]*(\d+(?:\.\d+)?)\s*(?:g|grams?)/gi,
    /(\d+(?:\.\d+)?)\s*(?:grams?|g)\b/gi,
    /(\d+(?:\.\d+)?)\s*kg\b/gi,
  ];
  
  for (const pattern of weightPatterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      let weight = parseFloat(match[1]);
      if (pattern.source.includes('kg')) {
        weight = weight * 1000;
      }
      // Valid filament weights: 100g to 5kg
      if (weight >= 100 && weight <= 5000) {
        return Math.round(weight);
      }
    }
  }
  
  // Default weights based on NinjaTek product lines
  const titleLower = title.toLowerCase();
  if (titleLower.includes('0.5kg') || titleLower.includes('500g')) return 500;
  if (titleLower.includes('1kg') || titleLower.includes('1000g')) return 1000;
  if (titleLower.includes('2kg') || titleLower.includes('2000g')) return 2000;
  
  return null;
}

/**
 * Enhanced color extraction from NinjaTek title and page
 */
function extractNinjaTekColor(html: string, title: string): { colorName: string | null; colorHex: string | null } {
  // First try extracting from title
  const { colorName: titleColor, colorHex: titleHex } = extractColorFromTitle(title);
  if (titleColor && titleHex) {
    return { colorName: titleColor, colorHex: `#${titleHex}` };
  }
  
  // Try WooCommerce variation selector
  const variationMatch = html.match(/data-attribute_pa_color="([^"]+)"/i) ||
                         html.match(/<option[^>]*selected[^>]*value="([^"]+)"[^>]*data-attribute_name="attribute_pa_color"/i);
  if (variationMatch?.[1]) {
    const colorName = variationMatch[1].replace(/-/g, ' ').trim();
    const hex = getColorHex(colorName);
    return { colorName, colorHex: hex ? `#${hex}` : null };
  }
  
  // Try to find color in breadcrumbs or product categories
  const categoryMatch = html.match(/product-cat-([a-z\-]+)/i);
  if (categoryMatch?.[1]) {
    const category = categoryMatch[1].replace(/-/g, ' ');
    const hex = getColorHex(category);
    if (hex) {
      return { colorName: category, colorHex: `#${hex}` };
    }
  }
  
  // Fallback to title extraction without hex
  if (titleColor) {
    return { colorName: titleColor, colorHex: null };
  }
  
  return { colorName: null, colorHex: null };
}

/**
 * Try to scrape NinjaTek product using direct fetch (for static pages)
 */
async function scrapeNinjaTekDirect(productUrl: string): Promise<{ html: string; markdown: string } | null> {
  try {
    console.log(`[NINJATEK] 📡 Trying direct fetch: ${productUrl}`);
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    
    if (!response.ok) {
      console.log(`[NINJATEK] ❌ Direct fetch failed: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    console.log(`[NINJATEK] ✅ Direct fetch succeeded, HTML length: ${html.length}`);
    return { html, markdown: '' };
  } catch (error) {
    console.error(`[NINJATEK] ❌ Direct fetch error:`, error);
    return null;
  }
}

/**
 * Extract data from NinjaTek WooCommerce product page using Firecrawl with direct fetch fallback
 */
async function scrapeNinjaTekProduct(
  productUrl: string, 
  productTitle: string,
  firecrawlKey: string
): Promise<{ product: ScrapedProduct | null; debugInfo: Record<string, unknown> }> {
  const debugInfo: Record<string, unknown> = {
    url: productUrl,
    title: productTitle,
    startTime: new Date().toISOString(),
  };
  
  console.log(`[NINJATEK] 🔍 Scraping: ${productUrl}`);
  
  // First try direct fetch (faster and often works for WooCommerce)
  const directResult = await scrapeNinjaTekDirect(productUrl);
  
  if (directResult && directResult.html.length > 5000) {
    debugInfo.method = 'direct_fetch';
    debugInfo.htmlLength = directResult.html.length;
    
    // Extract data from direct fetch result
    const html = directResult.html;
    const markdown = '';
    
    // Use existing extraction functions
    const { imageUrl, debugInfo: imageDebug } = extractWooCommerceImage(html);
    const { price, compareAtPrice, debugInfo: priceDebug } = extractWooCommercePrice(html, markdown);
    const { tdsUrl, debugInfo: tdsDebug } = extractNinjaTekTds(html, markdown);
    const mpn = extractWooCommerceMpn(html);
    const weight = extractNinjaTekWeight(html, markdown, productTitle);
    const { colorName, colorHex } = extractNinjaTekColor(html, productTitle);
    
    debugInfo.imageExtraction = imageDebug;
    debugInfo.priceExtraction = priceDebug;
    debugInfo.tdsExtraction = tdsDebug;
    debugInfo.extractedData = { imageUrl: !!imageUrl, price, tdsUrl: !!tdsUrl, mpn, weight, colorName, colorHex };
    
    console.log(`[NINJATEK] 📦 Direct fetch results: image=${!!imageUrl}, price=${price}, tds=${!!tdsUrl}`);
    
    return {
      product: {
        productId: productUrl.split('/').pop()?.split('?')[0] || productUrl,
        title: productTitle,
        price,
        compareAtPrice,
        url: productUrl,
        imageUrl,
        tdsUrl,
        netWeightG: weight,
        mpn,
        colorName,
        colorHex,
        colorFamily: colorName ? getColorFamily(colorName) : null,
        available: true,
        currency: 'USD',
        scrapedAt: new Date(),
        source: 'ninjatek-direct',
      },
      debugInfo,
    };
  }
  
  // Fallback to Firecrawl if direct fetch fails
  console.log(`[NINJATEK] 📡 Direct fetch insufficient, trying Firecrawl...`);
  debugInfo.method = 'firecrawl';
  
  let retries = 0;
  while (retries <= MAX_RETRIES) {
    try {
      console.log(`[NINJATEK] 📡 Calling Firecrawl (attempt ${retries + 1}/${MAX_RETRIES + 1})...`);
      
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({
          url: productUrl,
          formats: ['markdown', 'html'],
          onlyMainContent: false, // Need full page for meta tags and structured data
          waitFor: 4000, // NinjaTek pages can be slow
        }),
      });

      debugInfo.firecrawlStatus = response.status;
      
      if (!response.ok) {
        if (response.status === 429 && retries < MAX_RETRIES) {
          console.log(`[NINJATEK] ⏳ Rate limited (429), waiting 15s and retrying...`);
          await new Promise(r => setTimeout(r, 15000));
          retries++;
          continue;
        }
        const errorText = await response.text();
        debugInfo.firecrawlError = errorText;
        throw new Error(`Firecrawl error: ${response.status} - ${errorText.substring(0, 100)}`);
      }

      const scrapeData = await response.json();
      const html = scrapeData.data?.html || '';
      const markdown = scrapeData.data?.markdown || '';
      
      debugInfo.htmlLength = html.length;
      debugInfo.markdownLength = markdown.length;
      
      console.log(`[NINJATEK] 📄 Received HTML: ${html.length} chars, Markdown: ${markdown.length} chars`);
      
      if (html.length < 500) {
        console.log(`[NINJATEK] ⚠️ HTML too short, may be blocked or error page`);
        debugInfo.warning = 'HTML too short';
      }

      // Extract all data using enhanced functions with debug info
      const imageResult = extractWooCommerceImage(html);
      const priceResult = extractWooCommercePrice(html, markdown);
      const tdsResult = extractNinjaTekTds(html, markdown);
      const mpn = extractWooCommerceMpn(html);
      const weight = extractNinjaTekWeight(html, markdown, productTitle);
      const { colorName, colorHex } = extractNinjaTekColor(html, productTitle);
      
      // Collect debug info
      debugInfo.imageDebug = imageResult.debugInfo;
      debugInfo.priceDebug = priceResult.debugInfo;
      debugInfo.tdsDebug = tdsResult.debugInfo;
      
      // Log extraction results
      console.log(`[NINJATEK] 🖼️ Image: ${imageResult.imageUrl ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`[NINJATEK] 💰 Price: ${priceResult.price ? `$${priceResult.price}` : 'NOT FOUND'}`);
      console.log(`[NINJATEK] 📄 TDS: ${tdsResult.tdsUrl ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`[NINJATEK] 🏷️ MPN: ${mpn || 'NOT FOUND'}`);
      console.log(`[NINJATEK] ⚖️ Weight: ${weight ? `${weight}g` : 'NOT FOUND'}`);
      console.log(`[NINJATEK] 🎨 Color: ${colorName || 'NOT FOUND'} (${colorHex || 'no hex'})`);
      
      // Extract product ID from URL
      const urlParts = productUrl.split('/');
      const productId = urlParts.filter(p => p && p !== 'products').pop() || productUrl;

      const scrapedProduct: ScrapedProduct = {
        productId,
        title: productTitle,
        price: priceResult.price,
        compareAtPrice: priceResult.compareAtPrice,
        url: productUrl,
        imageUrl: imageResult.imageUrl,
        tdsUrl: tdsResult.tdsUrl,
        netWeightG: weight,
        mpn,
        colorName,
        colorHex,
        colorFamily: colorName ? getColorFamily(colorName) : null,
        available: true,
        currency: 'USD',
        scrapedAt: new Date(),
        source: 'ninjatek-woocommerce-scraper',
      };

      debugInfo.extractedData = {
        hasImage: !!imageResult.imageUrl,
        hasPrice: !!priceResult.price,
        hasTds: !!tdsResult.tdsUrl,
        hasMpn: !!mpn,
        hasWeight: !!weight,
        hasColor: !!colorName,
      };

      return { product: scrapedProduct, debugInfo };
      
    } catch (error) {
      debugInfo.error = error instanceof Error ? error.message : String(error);
      
      if (retries < MAX_RETRIES) {
        console.log(`[NINJATEK] ❌ Error, retrying (${retries + 1}/${MAX_RETRIES}): ${error}`);
        retries++;
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      console.error(`[NINJATEK] ❌ Failed after ${MAX_RETRIES} retries:`, error);
      return { product: null, debugInfo };
    }
  }
  
  return { product: null, debugInfo };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[NINJATEK] ═══════════════════════════════════════════════════════');
  console.log('[NINJATEK] 🚀 NINJATEK ENHANCED SCRAPER STARTED');
  console.log(`[NINJATEK] 📅 ${new Date().toISOString()}`);
  console.log('[NINJATEK] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    console.log(`[NINJATEK] 🔑 FIRECRAWL_API_KEY: ${firecrawlKey ? 'CONFIGURED' : 'MISSING!'}`);
    
    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY not configured - please add it in Supabase Edge Function secrets');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse options
    let limit = 50;
    let skipExisting = true;
    let forceUpdate = false;
    try {
      const body = await req.json();
      limit = body.limit ?? 50;
      skipExisting = body.skipExisting ?? true;
      forceUpdate = body.forceUpdate ?? false;
    } catch {
      // Use defaults
    }

    console.log(`[NINJATEK] ⚙️ Options: limit=${limit}, skipExisting=${skipExisting}, forceUpdate=${forceUpdate}`);

    // Fetch NinjaTek filaments with product URLs
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, vendor, featured_image, tds_url, variant_price')
      .eq('vendor', 'NinjaTek')
      .not('product_url', 'is', null);
    
    if (skipExisting && !forceUpdate) {
      query = query.or('featured_image.is.null,featured_image.eq.');
    }
    
    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`[NINJATEK] 📊 Found ${filaments?.length || 0} filaments to process (limit: ${limit})`);

    if (!filaments || filaments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No filaments to process - all may already have images',
        processed: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: ScrapeResult[] = [];
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const filament of filaments || []) {
      if (!filament.product_url) {
        results.push({ id: filament.id, title: filament.product_title, status: 'skipped', error: 'No URL' });
        skipped++;
        continue;
      }

      console.log(`[NINJATEK] ───────────────────────────────────────────────────────`);
      console.log(`[NINJATEK] 📦 Processing: ${filament.product_title}`);
      console.log(`[NINJATEK] 🔗 URL: ${filament.product_url}`);

      const { product: scrapedProduct, debugInfo } = await scrapeNinjaTekProduct(
        filament.product_url,
        filament.product_title,
        firecrawlKey
      );

      if (!scrapedProduct) {
        console.log(`[NINJATEK] ❌ Scrape failed - debug info:`, JSON.stringify(debugInfo, null, 2));
        results.push({ 
          id: filament.id, 
          title: filament.product_title, 
          status: 'error', 
          error: 'Scrape failed',
          debugInfo 
        });
        errors++;
        continue;
      }

      // Validate the scraped product
      const validation = validateScrapedProduct(scrapedProduct);
      
      if (!validation.valid) {
        console.log(`[NINJATEK] ⚠️ Validation errors: ${validation.errors.join(', ')}`);
      }
      if (validation.warnings.length > 0) {
        console.log(`[NINJATEK] ⚠️ Validation warnings: ${validation.warnings.join(', ')}`);
      }

      // Sanitize the product data
      const sanitized = sanitizeScrapedProduct(scrapedProduct as unknown as Record<string, unknown>);

      // Build update payload - only update fields that have new values
      const updateData: Record<string, unknown> = {};
      
      if (sanitized.imageUrl && (!filament.featured_image || forceUpdate)) {
        updateData.featured_image = sanitized.imageUrl;
      }
      if (sanitized.tdsUrl && (!filament.tds_url || forceUpdate)) {
        updateData.tds_url = sanitized.tdsUrl;
      }
      if (sanitized.price && (!filament.variant_price || forceUpdate)) {
        updateData.variant_price = sanitized.price;
      }
      if (sanitized.netWeightG) {
        updateData.net_weight_g = sanitized.netWeightG;
      }
      if (sanitized.colorHex) {
        updateData.color_hex = sanitized.colorHex;
      }
      if (sanitized.mpn) {
        updateData.mpn = sanitized.mpn;
      }
      
      // Always update last_scraped_at
      updateData.last_scraped_at = new Date().toISOString();

      if (Object.keys(updateData).length > 1) { // More than just last_scraped_at
        const { error: updateError } = await supabase
          .from('filaments')
          .update(updateData)
          .eq('id', filament.id);

        if (updateError) {
          console.error(`[NINJATEK] ❌ Update failed: ${updateError.message}`);
          results.push({ 
            id: filament.id, 
            title: filament.product_title, 
            status: 'error', 
            error: updateError.message 
          });
          errors++;
        } else {
          console.log(`[NINJATEK] ✅ Updated: image=${!!sanitized.imageUrl}, tds=${!!sanitized.tdsUrl}, price=${sanitized.price}, weight=${sanitized.netWeightG}`);
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: 'updated',
            image: sanitized.imageUrl as string | null,
            tds: sanitized.tdsUrl as string | null,
            price: sanitized.price as number | null,
            weight: sanitized.netWeightG as number | null,
            colorHex: sanitized.colorHex as string | null,
            mpn: sanitized.mpn as string | null,
            validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined,
            debugInfo,
          });
          updated++;
        }
      } else {
        console.log(`[NINJATEK] ⏭️ No new data extracted`);
        results.push({ 
          id: filament.id, 
          title: filament.product_title, 
          status: 'no_data',
          debugInfo 
        });
        skipped++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('[NINJATEK] ═══════════════════════════════════════════════════════');
    console.log(`[NINJATEK] ✅ COMPLETED in ${duration}s`);
    console.log(`[NINJATEK] 📊 Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
    console.log('[NINJATEK] ═══════════════════════════════════════════════════════');

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      updated,
      skipped,
      errors,
      duration,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[NINJATEK] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
