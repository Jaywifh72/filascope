// WooCommerce + TreeD direct API v2 — deployed 2026-02-25
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  getRegionHeaders,
  getSpoofedHeaders,
  isGeoRedirectDomain,
  isGeoRedirect,
  detectRegionFromUrl,
  type FetchMethod,
} from "../_shared/regional-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
  compare_at_price: string | null;
  grams?: number;
}

interface ShopifyProduct {
  product: {
    id: number;
    title: string;
    variants: ShopifyVariant[];
  };
}

// Stock status types for granular reporting
type StockStatus = "in_stock" | "out_of_stock" | "low_stock" | "preorder" | "unknown";

interface PriceResponse {
  success: boolean;
  price: number | null;
  compareAtPrice: number | null;
  weightGrams: number | null;
  diameterMm: number | null;
  variantTitle: string | null;
  currency: string;
  available: boolean;
  stockStatus?: StockStatus; // Granular stock status for UI display
  source: "shopify" | "firecrawl" | "html" | "cached";
  fetchedAt: string;
  error?: string;
  is404?: boolean; // Indicates product page not found
  notAvailableInRegion?: boolean; // Indicates product is not sold in this region (graceful skip)
  refreshedAt?: string; // ISO timestamp when forceRefresh was used
  // New fields for currency validation
  sourceUrl?: string; // The actual URL that was scraped (may differ from input after regional transformation)
  detectedCurrency?: string; // Currency detected from page content (may differ from expected)
  currencyMismatch?: boolean; // True if detected currency doesn't match expected
  requestedCurrency?: string; // The currency the caller requested
}

interface BrandExtractionConfig {
  priceSectionAnchor?: string;
  pricePatterns?: string[];
  excludePatterns?: string[];
  priceRangeMin?: number;
  priceRangeMax?: number;
  currencyDetection?: string;
}

interface BrandConfig {
  id: string;
  brand_slug: string;
  brand_name: string;
  base_url: string;
  extraction_method: string;
  price_extraction_config: BrandExtractionConfig;
  extraction_working: boolean;
  default_currency: string | null;
}

// Regional store URL patterns for major brands
interface RegionalStoreConfig {
  pattern: "subdomain" | "path" | "global";
  baseDomain: string;
  regions: Record<string, { subdomain?: string; pathPrefix?: string; domain?: string; currency: string }>;
  fallbackRegion?: string;
}

const REGIONAL_STORE_CONFIGS: Record<string, RegionalStoreConfig> = {
  bambulab: {
    pattern: "subdomain",
    baseDomain: "store.bambulab.com",
    fallbackRegion: "US",
    regions: {
      US: { subdomain: "us", currency: "USD" },
      CA: { subdomain: "ca", currency: "CAD" },
      UK: { subdomain: "uk", currency: "GBP" },
      EU: { subdomain: "eu", currency: "EUR" },
      AU: { subdomain: "au", currency: "AUD" },
      JP: { subdomain: "jp", currency: "JPY" },
    },
  },
  polymaker: {
    pattern: "subdomain",
    baseDomain: "polymaker.com",
    fallbackRegion: "US",
    regions: {
      US: { subdomain: "us", currency: "USD" },
      CA: { subdomain: "ca", currency: "CAD" },
      // EU store (eu.polymaker.com) shut down Feb 2026 - deactivated
    },
  },
  elegoo: {
    pattern: "subdomain",
    baseDomain: "elegoo.com",
    fallbackRegion: "US",
    regions: {
      US: { subdomain: "us", currency: "USD" },
      CA: { subdomain: "ca", currency: "CAD" },
      UK: { subdomain: "uk", currency: "GBP" },
      EU: { subdomain: "eu", currency: "EUR" },
      AU: { subdomain: "au", currency: "AUD" },
    },
  },
  anycubic: {
    pattern: "subdomain",
    baseDomain: "anycubic.com",
    fallbackRegion: "US",
    regions: {
      US: { subdomain: "store", currency: "USD" },
      CA: { subdomain: "ca", currency: "CAD" },
      UK: { subdomain: "uk", currency: "GBP" },
      EU: { subdomain: "eu", currency: "EUR" },
      AU: { domain: "www.anycubic.au", currency: "AUD" },
    },
  },
  creality: {
    pattern: "path",
    baseDomain: "store.creality.com",
    fallbackRegion: "US",
    regions: {
      US: { pathPrefix: "", currency: "USD" },
      CA: { pathPrefix: "/ca", currency: "CAD" },
      UK: { pathPrefix: "/uk", currency: "GBP" },
      EU: { pathPrefix: "/eu", currency: "EUR" },
      AU: { pathPrefix: "/au", currency: "AUD" },
      JP: { pathPrefix: "/jp", currency: "JPY" },
    },
  },
  // Extrudr: path-based regional URLs with locale+region prefix: /en/{region}/products/{slug}/
  // ALL regions map to the "de" locale — Extrudr only sells in EUR.
  // NOTE: pathPrefix here is the segment injected AFTER /en/ (not prepended to full path).
  // The actual URL transformation is handled by normalizeExtrudrUrl() inside fetchExtrudrPriceDirect,
  // so transformToRegionalUrl returns the URL unchanged (pathPrefix = "") to avoid double-prefixing.
  extrudr: {
    pattern: "path",
    baseDomain: "www.extrudr.com",
    fallbackRegion: "EU",
    regions: {
      EU: { pathPrefix: "", currency: "EUR" },
      US: { pathPrefix: "", currency: "EUR" }, // EUR-only brand, no USD pricing
      CA: { pathPrefix: "", currency: "EUR" },
      UK: { pathPrefix: "", currency: "EUR" },
      AU: { pathPrefix: "", currency: "EUR" },
    },
  },
  // Prusa: single global store — ALL regions use www.prusa3d.com with EUR server-side pricing.
  // Prusa uses Global-e for client-side currency conversion, which Firecrawl cannot execute.
  // The __NEXT_DATA__ extraction always returns EUR; display currency is handled via exchange rates.
  prusa: {
    pattern: "path",
    baseDomain: "www.prusa3d.com",
    fallbackRegion: "EU",
    regions: {
      EU: { pathPrefix: "", currency: "EUR" },
      US: { pathPrefix: "", currency: "EUR" }, // Single store, EUR only server-side
      CA: { pathPrefix: "", currency: "EUR" },
      UK: { pathPrefix: "", currency: "EUR" },
      AU: { pathPrefix: "", currency: "EUR" },
    },
  },
};

// Currency to region code mapping
const CURRENCY_TO_REGION: Record<string, string> = {
  USD: "US",
  CAD: "CA",
  GBP: "UK",
  EUR: "EU",
  AUD: "AU",
  JPY: "JP",
  CNY: "CN",
};

// Normalize malformed Creality subdomain URLs to the correct path-based format.
// e.g. https://ca.creality.com/products/slug -> https://store.creality.com/ca/products/slug
// e.g. https://uk.creality.com/products/slug -> https://store.creality.com/uk/products/slug
function normalizeCrealityUrl(url: string): string {
  const CREALITY_REGION_SUBDOMAINS = ["ca", "uk", "eu", "au", "jp"];
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    // Match e.g. ca.creality.com or au.creality.com (but NOT store.creality.com)
    for (const region of CREALITY_REGION_SUBDOMAINS) {
      if (hostname === `${region}.creality.com`) {
        const normalized = `https://store.creality.com/${region}${urlObj.pathname}${urlObj.search}`;
        console.log(`[CREALITY NORMALIZE] Bad subdomain URL corrected: ${url} -> ${normalized}`);
        return normalized;
      }
    }
  } catch (_) { /* ignore */ }
  return url;
}

// Transform URL to regional store URL based on currency
function transformToRegionalUrl(
  url: string,
  requestedCurrency: string,
): { url: string; expectedCurrency: string; transformed: boolean } {
  // Fix malformed Creality subdomain URLs before any other processing
  url = normalizeCrealityUrl(url);
  const urlLower = url.toLowerCase();
  const regionCode = CURRENCY_TO_REGION[requestedCurrency] || "US";

  // Find matching brand config
  for (const [brandKey, config] of Object.entries(REGIONAL_STORE_CONFIGS)) {
    if (!urlLower.includes(config.baseDomain.toLowerCase())) continue;

    // Check if the URL already matches a regional store — if so, keep it and use that region's currency
    try {
      const urlObj = new URL(url);
      const currentHost = urlObj.hostname.toLowerCase();
      for (const [regionKey, regionCfg] of Object.entries(config.regions)) {
        const rc = regionCfg as { subdomain?: string; domain?: string; currency: string };
        if (rc.domain && currentHost === rc.domain.toLowerCase()) {
          // URL already on a full-domain regional store (e.g. anycubic.au)
          console.log(`URL already on ${regionKey} regional store (${currentHost}), keeping as-is`);
          return { url, expectedCurrency: rc.currency, transformed: false };
        }
        if (rc.subdomain) {
          const expectedHost = `${rc.subdomain}.${config.baseDomain}`.toLowerCase();
          if (currentHost === expectedHost && regionKey !== regionCode) {
            // URL is on a different region's subdomain than requested — keep URL, use its native currency
            console.log(
              `URL already on ${regionKey} regional store (${currentHost}), keeping as-is with currency ${rc.currency}`,
            );
            return { url, expectedCurrency: rc.currency, transformed: false };
          }
        }
      }
    } catch (_) {
      /* ignore parse errors, proceed with transformation */
    }

    const regionConfig = config.regions[regionCode];
    if (!regionConfig) {
      // No regional store for this region, use fallback
      const fallbackConfig = config.regions[config.fallbackRegion || "US"];
      console.log(`No ${regionCode} regional store for ${brandKey}, using fallback`);
      return { url, expectedCurrency: fallbackConfig?.currency || "USD", transformed: false };
    }

    try {
      const urlObj = new URL(url);
      const originalHost = urlObj.hostname;

      if (config.pattern === "subdomain") {
        // Replace subdomain: us.store.bambulab.com -> eu.store.bambulab.com
        if (regionConfig.domain) {
          // Full domain replacement (e.g., anycubic.au)
          urlObj.hostname = regionConfig.domain;
        } else if (regionConfig.subdomain) {
          // Subdomain replacement
          const hostParts = originalHost.split(".");
          if (hostParts.length >= 3) {
            hostParts[0] = regionConfig.subdomain;
          } else {
            hostParts.unshift(regionConfig.subdomain);
          }
          urlObj.hostname = hostParts.join(".");
        }

        const newUrl = urlObj.toString();
        if (newUrl !== url) {
          console.log(`Regional URL transformation: ${url} -> ${newUrl}`);
          return { url: newUrl, expectedCurrency: regionConfig.currency, transformed: true };
        }
      } else if (config.pattern === "path") {
        // Path-based regional URLs: store.creality.com/ca/products/handle
        const pathPrefix = regionConfig.pathPrefix || "";

        if (pathPrefix) {
          // Strip any existing region prefix from the path to avoid double-prefixing
          const knownPrefixes = Object.values(config.regions)
            .map((r) => r.pathPrefix)
            .filter((p): p is string => !!p && p.length > 0);

          let cleanPath = urlObj.pathname;
          for (const prefix of knownPrefixes) {
            if (cleanPath.startsWith(prefix + "/")) {
              cleanPath = cleanPath.substring(prefix.length);
              break;
            }
          }

          urlObj.pathname = pathPrefix + cleanPath;
          const newUrl = urlObj.toString();
          if (newUrl !== url) {
            console.log(`Regional URL transformation (path): ${url} -> ${newUrl}`);
            return { url: newUrl, expectedCurrency: regionConfig.currency, transformed: true };
          }
        }
      }
    } catch (e) {
      console.error("URL transformation error:", e);
    }

    return { url, expectedCurrency: regionConfig.currency, transformed: false };
  }

  // No transformation needed (global store or unknown brand)
  return { url, expectedCurrency: requestedCurrency, transformed: false };
}

// Detect currency from scraped page content
function detectCurrencyFromContent(markdown: string): string | null {
  // Look for explicit currency indicators
  const currencyPatterns: [RegExp, string][] = [
    [/\$[\d,]+(?:\.\d{2})?\s*EUR/i, "EUR"],
    [/\€[\d,]+(?:\.\d{2})?/g, "EUR"],
    [/EUR\s*\$?[\d,]+(?:\.\d{2})?/i, "EUR"],
    [/\$[\d,]+(?:\.\d{2})?\s*CAD/i, "CAD"],
    [/CA\$[\d,]+(?:\.\d{2})?/g, "CAD"],
    [/CAD\s*\$?[\d,]+(?:\.\d{2})?/i, "CAD"],
    [/\$[\d,]+(?:\.\d{2})?\s*GBP/i, "GBP"],
    [/£[\d,]+(?:\.\d{2})?/g, "GBP"],
    [/GBP\s*\$?[\d,]+(?:\.\d{2})?/i, "GBP"],
    [/\$[\d,]+(?:\.\d{2})?\s*AUD/i, "AUD"],
    [/AU\$[\d,]+(?:\.\d{2})?/g, "AUD"],
    [/AUD\s*\$?[\d,]+(?:\.\d{2})?/i, "AUD"],
    [/¥[\d,]+/g, "JPY"], // Could also be CNY, context needed
    [/\$[\d,]+(?:\.\d{2})?\s*JPY/i, "JPY"],
    [/JPY\s*\$?[\d,]+/i, "JPY"],
    [/\$[\d,]+(?:\.\d{2})?\s*USD/i, "USD"],
    [/US\$[\d,]+(?:\.\d{2})?/g, "USD"],
  ];

  // Count currency occurrences
  const currencyCounts: Record<string, number> = {};

  for (const [pattern, currency] of currencyPatterns) {
    const matches = markdown.match(pattern);
    if (matches) {
      currencyCounts[currency] = (currencyCounts[currency] || 0) + matches.length;
    }
  }

  // Return the most common currency, or null if only $ with no currency code
  const entries = Object.entries(currencyCounts);
  if (entries.length === 0) return null;

  entries.sort((a, b) => b[1] - a[1]);
  const [topCurrency, topCount] = entries[0];

  // Only return if we have reasonable confidence
  if (topCount >= 2) {
    console.log(`Detected currency from content: ${topCurrency} (${topCount} occurrences)`);
    return topCurrency;
  }

  return null;
}

// Initialize Supabase client for brand config lookup
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseKey);
}

// Extract domain from URL for brand matching
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Find brand config based on URL domain
async function findBrandConfigByUrl(url: string): Promise<BrandConfig | null> {
  const domain = extractDomain(url);
  if (!domain) return null;

  const supabase = getSupabaseClient();

  // Query automated_brands table for matching base_url
  const { data, error } = await supabase
    .from("automated_brands")
    .select(
      "id, brand_slug, brand_name, base_url, extraction_method, price_extraction_config, extraction_working, default_currency",
    )
    .eq("is_visible", true)
    .order("brand_name");

  if (error || !data) {
    console.log("Error fetching brand configs:", error);
    return null;
  }

  // Find matching brand by domain
  const brand = data.find((b) => {
    const brandDomain = extractDomain(b.base_url);
    return domain.includes(brandDomain) || brandDomain.includes(domain);
  });

  return brand || null;
}

// Log extraction attempt to database
async function logExtractionAttempt(
  brandId: string | null,
  brandSlug: string | null,
  productUrl: string,
  method: string,
  success: boolean,
  price: number | null,
  currency: string,
  errorMessage: string | null,
  rawSample: string | null,
  responseTimeMs: number,
) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("price_extraction_logs").insert({
      brand_id: brandId,
      brand_slug: brandSlug,
      product_url: productUrl,
      extraction_method: method,
      success,
      extracted_price: price,
      currency,
      error_message: errorMessage,
      raw_content_sample: rawSample?.substring(0, 500),
      response_time_ms: responseTimeMs,
    });
  } catch (err) {
    console.error("Failed to log extraction attempt:", err);
  }
}

// Rate limit manual refreshes: 1 per URL per minute (only successful extractions count)
async function canForceRefresh(productUrl: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

  const { data } = await supabase
    .from("price_extraction_logs")
    .select("id")
    .eq("product_url", productUrl)
    .eq("extraction_method", "manual_refresh")
    .eq("success", true)
    .gte("created_at", oneMinuteAgo)
    .limit(1);

  // Allow if no recent SUCCESSFUL manual refresh (failed extractions can be retried immediately)
  return !data || data.length === 0;
}

// Log broken URL (404) to database for admin review
async function logBrokenUrl(productUrl: string, errorType: string) {
  try {
    const supabase = getSupabaseClient();
    const storeDomain = extractDomain(productUrl);

    // Upsert to handle duplicates - increment detection count
    const { data: existing } = await supabase
      .from("broken_product_urls")
      .select("id, detection_count")
      .eq("product_url", productUrl)
      .maybeSingle();

    if (existing) {
      // Update existing record
      await supabase
        .from("broken_product_urls")
        .update({
          detection_count: (existing.detection_count || 1) + 1,
          last_detected_at: new Date().toISOString(),
          error_type: errorType,
        })
        .eq("id", existing.id);
      console.log(`Updated broken URL record for: ${productUrl} (count: ${(existing.detection_count || 1) + 1})`);
    } else {
      // Insert new record
      await supabase.from("broken_product_urls").insert({
        product_url: productUrl,
        store_domain: storeDomain,
        error_type: errorType,
        detection_count: 1,
        detected_at: new Date().toISOString(),
        last_detected_at: new Date().toISOString(),
      });
      console.log(`Logged new broken URL: ${productUrl}`);
    }
  } catch (err) {
    console.error("Failed to log broken URL:", err);
  }
}

// Check if a redirect URL is a valid product page (not homepage/category)
function isValidProductRedirect(originalUrl: string, newUrl: string): boolean {
  // Must be same domain
  const originalDomain = extractDomain(originalUrl);
  const newDomain = extractDomain(newUrl);
  if (originalDomain !== newDomain) {
    console.log(`Redirect to different domain rejected: ${newDomain}`);
    return false;
  }

  try {
    const newUrlObj = new URL(newUrl);
    const path = newUrlObj.pathname.toLowerCase();

    // Reject if redirected to homepage
    if (path === "/" || path === "") {
      console.log("Redirect to homepage rejected");
      return false;
    }

    // Reject common category/collection pages
    const categoryPatterns = [
      /^\/collections?\/?$/i,
      /^\/products?\/?$/i,
      /^\/shop\/?$/i,
      /^\/category\/?$/i,
      /^\/categories\/?$/i,
      /^\/search\/?$/i,
      /^\/filament\/?$/i,
      /^\/filaments?\/?$/i,
    ];

    if (categoryPatterns.some((p) => p.test(path))) {
      console.log(`Redirect to category page rejected: ${path}`);
      return false;
    }

    // Likely a valid product page if it has product-like path structure
    const productPatterns = [/\/products?\//i, /\/p\//i, /\/item\//i, /-filament/i, /filament-/i];

    // If path looks like a product page or is just different, accept it
    return true;
  } catch {
    return false;
  }
}

// Auto-update filament URL when a valid redirect is detected
async function handleUrlRedirect(originalUrl: string, newUrl: string): Promise<boolean> {
  try {
    // Validate the redirect
    if (!isValidProductRedirect(originalUrl, newUrl)) {
      console.log(`Invalid redirect rejected: ${originalUrl} -> ${newUrl}`);
      return false;
    }

    const supabase = getSupabaseClient();

    // Update filament(s) with the old URL to use the new URL
    const { data: updated, error } = await supabase
      .from("filaments")
      .update({
        product_url: newUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("product_url", originalUrl)
      .select("id, product_title");

    if (error) {
      console.error("Failed to update filament URL:", error);
      return false;
    }

    if (updated && updated.length > 0) {
      console.log(`Auto-updated ${updated.length} filament(s) URL: ${originalUrl} -> ${newUrl}`);

      // If there was a broken_product_urls record, mark it as resolved
      await supabase
        .from("broken_product_urls")
        .update({
          resolved_at: new Date().toISOString(),
          new_url: newUrl,
          notes: "Auto-resolved via redirect detection",
        })
        .eq("product_url", originalUrl);

      return true;
    }

    return false;
  } catch (err) {
    console.error("Error handling URL redirect:", err);
    return false;
  }
}

// ===== AUTO-RESOLUTION SYSTEM FOR 404 PRODUCT URLs =====

// Store search URL patterns - maps domains to search URL builders
const STORE_SEARCH_PATTERNS: Record<string, (query: string) => string> = {
  // Major stores with known search patterns
  "store.creality.com": (q) => `https://store.creality.com/search?q=${encodeURIComponent(q)}`,
  "us.store.bambulab.com": (q) => `https://us.store.bambulab.com/search?q=${encodeURIComponent(q)}`,
  "store.bambulab.com": (q) => `https://store.bambulab.com/search?q=${encodeURIComponent(q)}`,
  "www.prusa3d.com": (q) => `https://www.prusa3d.com/search/?s=${encodeURIComponent(q)}`,
  "prusa3d.com": (q) => `https://www.prusa3d.com/search/?s=${encodeURIComponent(q)}`,
  "us.polymaker.com": (q) => `https://us.polymaker.com/search?q=${encodeURIComponent(q)}`,
  "polymaker.com": (q) => `https://polymaker.com/search?q=${encodeURIComponent(q)}`,
  "www.esun3d.com": (q) => `https://www.esun3d.com/search?keyword=${encodeURIComponent(q)}`,
  "esun3d.com": (q) => `https://www.esun3d.com/search?keyword=${encodeURIComponent(q)}`,
  "overture3d.com": (q) => `https://overture3d.com/search?q=${encodeURIComponent(q)}`,
  "www.sunlu.com": (q) => `https://www.sunlu.com/search?q=${encodeURIComponent(q)}`,
  "sunlu.com": (q) => `https://www.sunlu.com/search?q=${encodeURIComponent(q)}`,
  "store.anycubic.com": (q) => `https://store.anycubic.com/search?q=${encodeURIComponent(q)}`,
  "www.elegoo.com": (q) => `https://www.elegoo.com/search?q=${encodeURIComponent(q)}`,
  "colorfabb.com": (q) => `https://colorfabb.com/search?q=${encodeURIComponent(q)}`,
  "fillamentum.com": (q) => `https://fillamentum.com/search?q=${encodeURIComponent(q)}`,
  "atomicfilament.com": (q) => `https://atomicfilament.com/search?q=${encodeURIComponent(q)}`,
  "ninjatek.com": (q) => `https://ninjatek.com/search?q=${encodeURIComponent(q)}`,
  "www.proto-pasta.com": (q) => `https://www.proto-pasta.com/search?q=${encodeURIComponent(q)}`,
  "amolen.com": (q) => `https://amolen.com/search?q=${encodeURIComponent(q)}`,
  "fiberlogy.com": (q) => `https://fiberlogy.com/search?q=${encodeURIComponent(q)}`,
  "www.3dfuel.com": (q) => `https://www.3dfuel.com/search?q=${encodeURIComponent(q)}`,
  "voxelpla.com": (q) => `https://voxelpla.com/search?q=${encodeURIComponent(q)}`,
  "ziro3d.com": (q) => `https://ziro3d.com/search?q=${encodeURIComponent(q)}`,
};

// Get store search URL using patterns or generic Shopify fallback
function getStoreSearchUrl(domain: string, query: string): string {
  const pattern = STORE_SEARCH_PATTERNS[domain] || STORE_SEARCH_PATTERNS[domain.replace("www.", "")];
  if (pattern) return pattern(query);

  // Generic Shopify fallback (most e-commerce stores use /search?q=)
  return `https://${domain}/search?q=${encodeURIComponent(query)}`;
}

interface ProductMetadata {
  id: string;
  product_title: string;
  material: string | null;
  vendor: string | null;
  net_weight_g: number | null;
  product_url: string | null; // Include product_url for resolution
}

// Extract slug from URL for fuzzy matching
function extractSlugFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split("/").filter((s) => s && s !== "products" && s !== "product");
    return segments[segments.length - 1] || null;
  } catch {
    return null;
  }
}

// Fetch product metadata from database for search resolution
// Supports fuzzy matching when exact URL match fails
async function getProductMetadataByUrl(productUrl: string): Promise<ProductMetadata | null> {
  const supabase = getSupabaseClient();

  // Try exact match first
  const { data, error } = await supabase
    .from("filaments")
    .select("id, product_title, material, vendor, net_weight_g, product_url")
    .eq("product_url", productUrl)
    .limit(1);

  if (error) {
    console.log("Error fetching product metadata:", error.message);
    return null;
  }

  if (data && data.length > 0) {
    console.log(`Found exact match: "${data[0].product_title}" (${data[0].vendor})`);
    return data[0];
  }

  // Fuzzy match: extract slug from URL and search by ILIKE
  console.log("No exact URL match, trying fuzzy slug match...");
  const slug = extractSlugFromUrl(productUrl);

  if (slug && slug.length > 5) {
    console.log(`Searching for products with URL containing slug: "${slug}"`);

    const { data: fuzzyData, error: fuzzyError } = await supabase
      .from("filaments")
      .select("id, product_title, material, vendor, net_weight_g, product_url")
      .ilike("product_url", `%${slug}%`)
      .limit(5);

    if (fuzzyError) {
      console.log("Error in fuzzy search:", fuzzyError.message);
      return null;
    }

    if (fuzzyData && fuzzyData.length > 0) {
      // Return the best match (first one that contains our slug)
      console.log(`Found fuzzy match: "${fuzzyData[0].product_title}" via slug "${slug}"`);
      console.log(`Database URL: ${fuzzyData[0].product_url}`);
      return fuzzyData[0];
    }
  }

  console.log("No product metadata found for URL:", productUrl);
  return null;
}

// Build optimized search query from product metadata
function buildSearchQuery(product: ProductMetadata): string {
  // Start with product title
  let query = product.product_title;

  // Remove common suffixes that don't help search
  // NOTE: RFID is intentionally KEPT as it's a key product differentiator for Creality
  query = query
    .replace(/3D\s*Print(ing)?\s*Filament/gi, "")
    .replace(/\d+\s*[gG]\s*/g, "") // Remove weight like "1000g"
    .replace(/\d+\s*[kK][gG]\s*/g, "") // Remove weight like "1kg"
    .replace(/\d+\.\d+\s*mm/gi, "") // Remove diameter like "1.75mm"
    // REMOVED: .replace(/RFID/gi, '') - RFID is important for Creality products
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Limit length for search - take first 6 meaningful words
  const words = query
    .split(" ")
    .filter((w) => w.length > 1)
    .slice(0, 6);
  return words.join(" ");
}

// Common abbreviations used in product URLs
const URL_ABBREVIATIONS: Record<string, string[]> = {
  cf: ["carbon", "fiber", "fibre"],
  gf: ["glass", "fiber", "fibre"],
  hs: ["high", "speed"],
  ht: ["high", "temp", "temperature"],
  rf: ["rfid"],
  abs: ["abs"],
  pla: ["pla"],
  petg: ["petg"],
  tpu: ["tpu"],
  asa: ["asa"],
  pc: ["polycarbonate"],
  pa: ["nylon", "polyamide"],
  pro: ["pro", "professional"],
  plus: ["plus"],
  max: ["max", "maximum"],
  lite: ["lite", "light"],
  matte: ["matte", "matt"],
  silk: ["silk"],
};

// Calculate similarity score between URL and product title
function calculateUrlSimilarity(url: string, productTitle: string): number {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();

    // Extract slug from URL (last path segment after /products/ or similar)
    const segments = path.split("/").filter((s) => s && !["products", "product", "p"].includes(s));
    const slug = segments[segments.length - 1] || "";

    console.log(`Similarity check: slug="${slug}" vs title="${productTitle}"`);

    // Split slug into words (by hyphens/underscores)
    const slugWords = slug.split(/[-_]/).filter((w) => w.length > 0);

    // Expand abbreviations in slug
    const expandedSlugWords: string[] = [];
    for (const word of slugWords) {
      expandedSlugWords.push(word);
      if (URL_ABBREVIATIONS[word]) {
        expandedSlugWords.push(...URL_ABBREVIATIONS[word]);
      }
    }

    // Normalize product title to meaningful words
    const stopWords = ["the", "and", "for", "3d", "printing", "filament", "with", "from", "series", "1kg", "500g"];
    const titleWords = productTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.includes(w));

    if (titleWords.length === 0) return 0;

    // Count matching words (with expanded abbreviations)
    let matches = 0;
    for (const titleWord of titleWords) {
      const matched = expandedSlugWords.some(
        (sw) =>
          sw === titleWord ||
          sw.includes(titleWord) ||
          titleWord.includes(sw) ||
          (sw.length >= 3 && titleWord.startsWith(sw)) ||
          (titleWord.length >= 3 && sw.startsWith(titleWord)),
      );
      if (matched) {
        matches++;
        console.log(`  Match: "${titleWord}" matched in slug`);
      }
    }

    const score = matches / titleWords.length;
    console.log(`  Score: ${matches}/${titleWords.length} = ${(score * 100).toFixed(0)}%`);

    return score;
  } catch {
    return 0;
  }
}

// Check if we can attempt auto-fix (rate limit: 1 attempt per URL per 24h)
async function canAttemptAutoFix(productUrl: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("url_auto_fixes")
    .select("id")
    .eq("original_url", productUrl)
    .gte("fixed_at", oneDayAgo)
    .limit(1);

  // Allow if no recent attempts
  return !data || data.length === 0;
}

interface SearchResolutionResult {
  success: boolean;
  newUrl: string | null;
  score: number;
  method: "search_resolution";
}

// Attempt to resolve 404 by searching the store for the product
async function attemptSearchResolution(productUrl: string, storeDomain: string): Promise<SearchResolutionResult> {
  console.log("=== SEARCH RESOLUTION ATTEMPT ===");
  console.log("Product URL:", productUrl);
  console.log("Store domain:", storeDomain);

  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlApiKey) {
    console.log("✗ No FIRECRAWL_API_KEY for search resolution");
    return { success: false, newUrl: null, score: 0, method: "search_resolution" };
  }

  // Rate limit check
  const canAttempt = await canAttemptAutoFix(productUrl);
  if (!canAttempt) {
    console.log("✗ Rate limited: already attempted auto-fix for this URL in last 24h");
    return { success: false, newUrl: null, score: 0, method: "search_resolution" };
  }
  console.log("✓ Rate limit check passed");

  // Step 1: Get product metadata
  console.log("Fetching product metadata from database...");
  const product = await getProductMetadataByUrl(productUrl);
  if (!product) {
    console.log("✗ No product metadata found - cannot resolve");
    return { success: false, newUrl: null, score: 0, method: "search_resolution" };
  }
  console.log("✓ Found product:", product.product_title);

  // Step 2: Build search query
  const searchQuery = buildSearchQuery(product);
  console.log(`Search query for "${product.product_title}": "${searchQuery}"`);

  // Step 3: Get store search URL
  const searchUrl = getStoreSearchUrl(storeDomain, searchQuery);
  console.log("Searching store:", searchUrl);

  // Step 4: Scrape search results with Firecrawl
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ["links"],
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      console.error("Firecrawl search failed:", response.status);
      return { success: false, newUrl: null, score: 0, method: "search_resolution" };
    }

    const data = await response.json();
    const links: string[] = data.data?.links || data.links || [];

    console.log(`Search returned ${links.length} total links`);

    // Step 5: Filter to product links only (excluding the original AND database URLs)
    const baseDomain = storeDomain.replace("www.", "");
    const originalUrlLower = productUrl.toLowerCase();
    // Also exclude the database URL (which may differ from frontend URL due to regional variations)
    const databaseUrlLower = product.product_url?.toLowerCase() || "";

    const productLinks = links.filter((link) => {
      try {
        const linkUrl = new URL(link);
        // Must be same domain
        if (!linkUrl.hostname.includes(baseDomain)) return false;

        const linkLower = link.toLowerCase();

        // CRITICAL: Exclude the original broken URL to prevent self-resolution loops
        if (linkLower === originalUrlLower) {
          console.log("Excluding original URL from candidates:", link);
          return false;
        }

        // Also exclude the database URL if different from the frontend URL
        if (databaseUrlLower && linkLower === databaseUrlLower) {
          console.log("Excluding database URL from candidates:", link);
          return false;
        }

        // Must contain product indicators
        const path = linkUrl.pathname.toLowerCase();
        return (
          path.includes("/products/") || path.includes("/product/") || path.includes("/p/") || path.includes("/shop/")
        );
      } catch {
        return false;
      }
    });

    console.log(`Found ${productLinks.length} product links on search page (excluding original)`);

    if (productLinks.length === 0) {
      console.log("✗ No alternative product URLs found - product may be discontinued");
      return { success: false, newUrl: null, score: 0, method: "search_resolution" };
    }

    // Step 6: Score each link
    const scoredLinks = productLinks.map((url) => ({
      url,
      score: calculateUrlSimilarity(url, product.product_title),
    }));

    // Log top candidates for debugging
    const topCandidates = scoredLinks.sort((a, b) => b.score - a.score).slice(0, 5);
    console.log(
      "Top URL candidates:",
      topCandidates.map((c) => `${c.url} (${(c.score * 100).toFixed(0)}%)`),
    );

    // Step 7: Get best match with score >= 0.5 (lowered threshold for better matching)
    const bestMatch = topCandidates.find((l) => l.score >= 0.5);

    if (bestMatch) {
      console.log(`✓ Best match found: ${bestMatch.url} (score: ${(bestMatch.score * 100).toFixed(0)}%)`);
      return {
        success: true,
        newUrl: bestMatch.url,
        score: bestMatch.score,
        method: "search_resolution",
      };
    }

    console.log("No matching product found with score >= 0.7");
    return { success: false, newUrl: null, score: 0, method: "search_resolution" };
  } catch (err) {
    console.error("Search resolution error:", err);
    return { success: false, newUrl: null, score: 0, method: "search_resolution" };
  }
}

// Handle 404 with auto-resolution attempt, then log and return 404 response
async function handle404WithResolution(
  productUrl: string,
  preferredCurrency: string,
  brandConfig: BrandConfig | null,
  source: "shopify" | "firecrawl",
  errorType: string,
): Promise<PriceResponse & { rawSample?: string }> {
  console.log("=== 404 RESOLUTION STARTED ===");
  console.log("Original URL:", productUrl);
  console.log("Brand config:", brandConfig?.brand_name || "none");

  const storeDomain = extractDomain(productUrl);
  console.log("Store domain:", storeDomain);

  const resolution = await attemptSearchResolution(productUrl, storeDomain);
  console.log("Resolution result:", JSON.stringify(resolution));

  if (resolution.success && resolution.newUrl) {
    const supabase = getSupabaseClient();

    // Get the filament ID before updating (for logging)
    const product = await getProductMetadataByUrl(productUrl);
    console.log("Product for URL update:", product?.id || "not found");

    // Update the filament record with new URL
    const { error: updateError } = await supabase
      .from("filaments")
      .update({
        product_url: resolution.newUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("product_url", productUrl);

    if (!updateError) {
      console.log(`✓ Auto-resolved URL: ${productUrl} -> ${resolution.newUrl}`);

      // Log the auto-fix to audit table
      await supabase.from("url_auto_fixes").insert({
        filament_id: product?.id || null,
        original_url: productUrl,
        new_url: resolution.newUrl,
        resolution_method: resolution.method,
        similarity_score: resolution.score,
      });

      // Mark broken URL as resolved if exists
      await supabase
        .from("broken_product_urls")
        .update({
          resolved_at: new Date().toISOString(),
          new_url: resolution.newUrl,
          notes: `Auto-resolved via ${resolution.method} (score: ${(resolution.score * 100).toFixed(0)}%)`,
        })
        .eq("product_url", productUrl);

      // Retry price fetch with the new URL (using Firecrawl to avoid recursive resolution)
      console.log(`Retrying price fetch with resolved URL: ${resolution.newUrl}`);
      return await fetchPriceWithFirecrawl(resolution.newUrl, preferredCurrency, brandConfig, true);
    } else {
      console.error("Failed to update filament URL:", updateError);
    }
  }

  // Resolution failed - log broken URL for manual review
  console.log("=== 404 RESOLUTION FAILED - logging for manual review ===");
  await logBrokenUrl(productUrl, errorType);

  return {
    success: false,
    price: null,
    compareAtPrice: null,
    weightGrams: null,
    diameterMm: null,
    variantTitle: null,
    currency: preferredCurrency,
    available: false,
    source,
    fetchedAt: new Date().toISOString(),
    error: "PRODUCT_PAGE_NOT_FOUND",
    is404: true,
  };
}

// ===== END AUTO-RESOLUTION SYSTEM =====

// Check if content indicates a 404/not found page
function is404Content(markdown: string): boolean {
  // Check first 3000 chars (lowercased) for 404 indicators - increased for Creality's verbose pages
  const checkContent = markdown.substring(0, 3000).toLowerCase();

  console.log("is404Content checking content sample:", checkContent.substring(0, 200));

  // FIRST: Check for common store-specific redirect patterns that indicate missing product
  // Creality redirects to shopping bag page when product doesn't exist
  const hasShoppingBag = checkContent.includes("shopping bag");
  const hasEmpty = checkContent.includes("empty");
  console.log(`Creality 404 check: shopping bag=${hasShoppingBag}, empty=${hasEmpty}`);

  if (hasShoppingBag && hasEmpty) {
    console.log("✓ Detected 404: Creality redirect to empty shopping bag page");
    return true;
  }

  // Check for "Oops! Page not found" with various punctuation
  if (/oops[!?.\s]*page\s*not\s*found/i.test(checkContent)) {
    console.log("✓ Detected 404: Oops page not found");
    return true;
  }

  const notFoundPatterns = [
    /page\s*(not\s*found|doesn'?t\s*exist)/i,
    /\b404\b/i, // Simplified: just look for "404" as a word
    /product\s*(not\s*found|has\s*been\s*(deleted|removed))/i,
    /this\s*page\s*(doesn'?t|does\s*not)\s*exist/i,
    /we\s*couldn'?t\s*find\s*(the|this)\s*page/i,
    /sorry[,!]?\s*(this|the)?\s*page\s*(is|was|has)/i,
    /item\s*(no\s*longer|not)\s*available/i,
    /product\s*(is\s*)?no\s*longer\s*available/i,
    /oops[!?.\s]*(page|something)/i,
    /your\s*shopping\s*bag\s*is\s*empty/i, // Alternative Creality pattern
    // NOTE: Prusa MK404 is handled separately (location gate, not a real 404)
  ];

  for (const pattern of notFoundPatterns) {
    if (pattern.test(checkContent)) {
      console.log(`✓ Detected 404: matched pattern ${pattern}`);
      return true;
    }
  }

  console.log("No 404 patterns detected");
  return false;
}

// Default patterns to exclude discount/savings amounts from price extraction
const DEFAULT_EXCLUDE_PATTERNS = [
  "save\\s+\\$", // "Save $7.26"
  "saving\\s+\\$", // "Saving $10"
  "discount\\s+\\$", // "Discount $5"
  "off\\s+\\$", // "off $20"
  "coupon\\s+.*\\$", // "$500 coupon"
  "\\$\\d+\\s*off", // "$5 off"
  "\\$\\d+\\s*coupon", // "$500 coupon"
  "student\\s*discount", // Student discount sections
];

// CRITICAL: Remove promotional patterns from text BEFORE extracting prices
// This prevents capturing savings amounts, coupon values, etc. as product prices
function removeSavingsAmounts(text: string): string {
  let cleaned = text;

  // CRITICAL: Remove entire promotional lines/sections FIRST (before any price extraction)
  // Remove lines containing "coupon pack" - e.g., "💵 $500 coupon pack for your order!"
  cleaned = cleaned.replace(/[^\n]*\$\d+[^\n]*coupon\s*pack[^\n]*/gi, " ");
  // Remove lines containing "obtain" + dollar amount (promotional signup)
  cleaned = cleaned.replace(/[^\n]*obtain[^\n]*\$\d+[^\n]*/gi, " ");
  // Remove lines with "Subscribe" and dollar amounts
  cleaned = cleaned.replace(/[^\n]*subscribe[^\n]*\$\d+[^\n]*/gi, " ");
  // Remove student discount promotional lines
  cleaned = cleaned.replace(/[^\n]*student\s*discount[^\n]*\$\d+[^\n]*/gi, " ");

  // CRITICAL FIX: Remove "Save $X.XX" patterns BEFORE extracting any prices
  // This ensures we don't pick up savings amounts like $15.26 as the product price
  // Must use [\d,.]+ to capture full decimal prices like $15.26
  cleaned = cleaned.replace(/Save\s+\$[\d,.]+/gi, " ");
  cleaned = cleaned.replace(/Saving\s+\$[\d,.]+/gi, " ");
  cleaned = cleaned.replace(/You\s+save\s+\$[\d,.]+/gi, " ");
  cleaned = cleaned.replace(/Savings:?\s*\$[\d,.]+/gi, " ");

  // Remove "$X off" patterns
  cleaned = cleaned.replace(/\$[\d,.]+\s+off\b/gi, " ");
  cleaned = cleaned.replace(/\$[\d,.]+\s+discount/gi, " ");
  cleaned = cleaned.replace(/\$[\d,.]+\s+coupon/gi, " ");
  cleaned = cleaned.replace(/💵?\s*\$[\d,.]+\s*coupon\s*pack/gi, " ");
  cleaned = cleaned.replace(/💵\s*\$[\d,.]+/gi, " "); // Remove emoji + price (like 💵 $500)

  return cleaned;
}

// Extract prices from text, ensuring we NEVER capture savings amounts
// Format: "$18.99 $34.25 Save $15.26" -> returns salePrice=18.99, compareAtPrice=34.25
function extractSalePriceBeforeSave(text: string): {
  salePrice: number | null;
  compareAtPrice: number | null;
} {
  console.log("extractSalePriceBeforeSave input sample:", text.substring(0, 300));

  // STEP 1: Clean the text by removing savings patterns FIRST
  const cleanedText = removeSavingsAmounts(text);
  console.log("After removing savings:", cleanedText.substring(0, 300));

  // STEP 2: Extract all dollar amounts from the CLEANED text
  // CRITICAL FIX: Use proper regex that captures full decimal prices
  // Pattern: $18.99 or $34.25 (dollar sign followed by digits, optional decimal with exactly 2 digits)
  const priceMatches = cleanedText.match(/\$(\d+(?:\.\d{2})?)/g);

  if (!priceMatches || priceMatches.length === 0) {
    console.log("No prices found in cleaned text");
    return { salePrice: null, compareAtPrice: null };
  }

  // Parse all found prices
  const prices = priceMatches.map((p) => parseFloat(p.replace("$", ""))).filter((p) => !isNaN(p) && p > 0);

  console.log("Extracted prices from cleaned text:", prices);

  if (prices.length === 0) {
    return { salePrice: null, compareAtPrice: null };
  }

  // STEP 3: The first price is typically the sale/current price
  // For format "$18.99 $34.25" - first is sale price, second is compare-at
  if (prices.length >= 2) {
    const [first, second] = prices;
    if (first < second) {
      // First is sale price, second is compare-at (original)
      console.log(`Identified: salePrice=$${first}, compareAtPrice=$${second}`);
      return { salePrice: first, compareAtPrice: second };
    } else if (second < first) {
      // Second is sale price, first is compare-at
      console.log(`Identified (reversed): salePrice=$${second}, compareAtPrice=$${first}`);
      return { salePrice: second, compareAtPrice: first };
    }
  }

  // Single price or equal prices - just return the first
  console.log(`Single/equal price: $${prices[0]}`);
  return { salePrice: prices[0], compareAtPrice: null };
}

// Apply configured price patterns to markdown content
function extractPriceWithConfig(
  markdown: string,
  config: BrandExtractionConfig,
  preferredCurrency: string,
  sourceUrl?: string,
): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
  matchedPattern: string | null;
} {
  // Use higher minimum for filament to avoid capturing weights/discounts
  const priceRangeMin = config.priceRangeMin ?? 10;
  const priceRangeMax = config.priceRangeMax ?? 150;

  const parseDomainPrice = (raw: string): number => {
    if (!raw) return NaN;
    return sourceUrl ? parsePriceForDomain(raw, sourceUrl) : parseEuropeanPrice(raw);
  };

  const isEuropeanDomain = sourceUrl ? isEuropeanDecimalBrand(sourceUrl) : false;
  const getInlinePriceRegex = (): RegExp =>
    isEuropeanDomain
      ? /(?:€|EUR)?\s*([\d]+(?:[.,]\d{2}))/gi
      : /\$(\d+(?:\.\d{2})?)/g;

  // First, try to extract using the Creality sale format pattern
  const saleResult = extractSalePriceBeforeSave(markdown);
  if (saleResult.salePrice && saleResult.salePrice >= priceRangeMin && saleResult.salePrice <= priceRangeMax) {
    // CRITICAL: Also validate compareAtPrice - it must be within reasonable range (not $500 coupon packs!)
    // Compare-at price should be reasonable (max 3x the sale price or within $200)
    const maxCompareAt = Math.min(200, saleResult.salePrice * 3);
    const validCompareAt =
      saleResult.compareAtPrice &&
      saleResult.compareAtPrice >= priceRangeMin &&
      saleResult.compareAtPrice <= maxCompareAt &&
      saleResult.compareAtPrice > saleResult.salePrice;

    console.log(
      `Sale format extraction: $${saleResult.salePrice}, compare: ${validCompareAt ? `$${saleResult.compareAtPrice}` : "invalid/filtered"}`,
    );
    return {
      price: saleResult.salePrice,
      compareAtPrice: validCompareAt ? saleResult.compareAtPrice : null,
      currency: preferredCurrency,
      available: true,
      matchedPattern: "sale-before-save",
    };
  }

  // Remove savings amounts from the text
  let cleanedMarkdown = removeSavingsAmounts(markdown);

  // Combine default excludes with configured excludes for additional cleaning
  const excludePatterns = [...DEFAULT_EXCLUDE_PATTERNS, ...(config.excludePatterns || [])];

  // Pre-filter: Remove lines containing discount patterns
  for (const pattern of excludePatterns) {
    try {
      const lineExcludeRegex = new RegExp(`^.*${pattern}.*$`, "gim");
      cleanedMarkdown = cleanedMarkdown.replace(lineExcludeRegex, "");
    } catch (_e) {
      // Ignore invalid patterns
    }
  }

  // Determine search section using anchor text
  let priceSection = cleanedMarkdown;
  if (config.priceSectionAnchor) {
    const anchorRegex = new RegExp(config.priceSectionAnchor, "i");
    const anchorIndex = cleanedMarkdown.search(anchorRegex);
    if (anchorIndex > -1) {
      priceSection = cleanedMarkdown.slice(Math.max(0, anchorIndex - 500), anchorIndex + 200);
    }
  }

  // Try configured price patterns first
  if (config.pricePatterns && config.pricePatterns.length > 0) {
    for (const pattern of config.pricePatterns) {
      try {
        const regex = new RegExp(pattern, "i");
        const match = priceSection.match(regex);
        if (match && match[1]) {
          const price = parseDomainPrice(match[1]);
          if (price >= priceRangeMin && price <= priceRangeMax) {
            console.log(`Pattern match: ${pattern} -> $${price}`);

            let compareAt: number | null = null;
            const allPrices = [...priceSection.matchAll(getInlinePriceRegex())]
              .map((m) => parseDomainPrice(m[1]))
              .filter((p) => p >= priceRangeMin && p <= priceRangeMax && p !== price);

            if (allPrices.length > 0) {
              const higherPrice = allPrices.find((p) => p > price);
              if (higherPrice) compareAt = higherPrice;
            }

            return {
              price,
              compareAtPrice: compareAt,
              currency: preferredCurrency,
              available: true,
              matchedPattern: pattern,
            };
          }
        }
      } catch (_e) {
        console.log(`Invalid price pattern: ${pattern}`);
      }
    }
  }

  // Fallback: find all prices in cleaned section, filter to valid range
  const allPrices = [...priceSection.matchAll(getInlinePriceRegex())]
    .map((m) => parseDomainPrice(m[1]))
    .filter((p) => p >= priceRangeMin && p <= priceRangeMax)
    .sort((a, b) => a - b);

  if (allPrices.length > 0) {
    const price = allPrices[0];
    const compareAt = allPrices.length > 1 && allPrices[1] > price * 1.1 ? allPrices[1] : null;
    return {
      price,
      compareAtPrice: compareAt,
      currency: preferredCurrency,
      available: true,
      matchedPattern: "fallback-generic",
    };
  }

  return {
    price: null,
    compareAtPrice: null,
    currency: preferredCurrency,
    available: false,
    matchedPattern: null,
  };
}

// Domains that use European comma-decimal pricing
const EUROPEAN_DECIMAL_BRANDS = [
  "azurefilm.com",
] as const;

// WooCommerce stores that should use direct HTML fetch + JSON-LD extraction
// These stores use European comma-decimal pricing and/or are behind Cloudflare
const WOOCOMMERCE_DIRECT_DOMAINS = [...EUROPEAN_DECIMAL_BRANDS];

// WooCommerce store default currencies
const WOOCOMMERCE_STORE_CURRENCIES: Record<string, string> = {
  "azurefilm.com": "EUR",
};

// Get default currency for a WooCommerce domain
function getWooCommerceCurrency(url: string): string {
  for (const [domain, currency] of Object.entries(WOOCOMMERCE_STORE_CURRENCIES)) {
    if (url.includes(domain)) return currency;
  }
  return "EUR";
}

// Detect custom storefronts that don't support Shopify JSON API
function detectCustomStorefront(url: string): "bambulab" | "prusa" | "opencart" | "creality" | "extrudr" | "treed" | "woocommerce" | null {
  if (url.includes("store.bambulab.com")) return "bambulab";
  if (url.includes("prusa3d.com")) return "prusa";
  if (url.includes("geeetech.com")) return "opencart";
  if (url.includes("extrudr.com")) return "extrudr";
  if (url.includes("treedfilaments.com")) return "treed";
  // WooCommerce stores with European decimal pricing
  if (WOOCOMMERCE_DIRECT_DOMAINS.some(d => url.includes(d))) return "woocommerce";
  // Creality: catch all domain/path variations
  if (
    url.includes("store.creality.com") ||
    url.includes("creality.shop") ||
    url.includes("creality.com/ca/") ||
    url.includes("creality.com/uk/") ||
    url.includes("creality.com/eu/") ||
    url.includes("creality.com/au/") ||
    url.includes("creality.com/jp/")
  ) return "creality";
  return null;
}

// ===== WOOCOMMERCE DIRECT PRICE FETCH =====
// For European WooCommerce stores (AzureFilm etc.) that use comma decimals
// and may be behind Cloudflare. Uses WC Store API v1 as primary method.

// Common headers for AzureFilm/WooCommerce requests
const WOOCOMMERCE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

// AzureFilm price validation range (EUR filaments)
const AZUREFILM_PRICE_RANGE = { min: 5, max: 200 };

// Check if a response is a Cloudflare block page
function isCloudflareBlock(text: string): boolean {
  return text.includes("cf-browser-verification") || text.includes("Just a moment") || text.includes("Checking your browser");
}

// Extract slug from an AzureFilm product URL
// e.g. https://azurefilm.com/product/abs-plus-filament-yellow/ → abs-plus-filament-yellow
function extractWooCommerceSlug(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    // Match /product/{slug}/ or /product/{slug}
    const match = path.match(/\/product\/([^/?#]+)/);
    if (match) return match[1].replace(/\/$/, "");
    // Fallback: last non-empty path segment
    const segments = path.split("/").filter(Boolean);
    return segments[segments.length - 1] || null;
  } catch {
    return null;
  }
}

// PRIMARY METHOD: WC Store API v1
async function fetchWcStoreApiPrice(
  productUrl: string,
  storeDomain: string,
): Promise<PriceResponse | null> {
  const slug = extractWooCommerceSlug(productUrl);
  if (!slug) {
    console.log("[WC STORE API] Could not extract slug from URL:", productUrl);
    return null;
  }

  const apiUrl = `https://${storeDomain}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}`;
  console.log(`[WC STORE API] Fetching: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      headers: WOOCOMMERCE_HEADERS,
      signal: AbortSignal.timeout(15000),
    });

    console.log(`[WC STORE API] HTTP ${response.status}`);

    // Handle rate limiting
    if (response.status === 429) {
      console.log("[WC STORE API] Rate limited, waiting 2s and retrying once...");
      await new Promise(r => setTimeout(r, 2000));
      const retryResp = await fetch(apiUrl, {
        headers: WOOCOMMERCE_HEADERS,
        signal: AbortSignal.timeout(15000),
      });
      if (!retryResp.ok) {
        console.log(`[WC STORE API] Retry failed: HTTP ${retryResp.status}`);
        return null;
      }
      const retryData = await retryResp.json();
      return parseWcStoreApiResponse(retryData, productUrl, storeDomain);
    }

    if (!response.ok) {
      // Check for Cloudflare block on non-JSON response
      if (response.status === 403) {
        const text = await response.text();
        if (isCloudflareBlock(text)) {
          console.log("[WC STORE API] Cloudflare block detected");
          return null; // Fall through to JSON-LD fallback
        }
      }
      console.log(`[WC STORE API] HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return parseWcStoreApiResponse(data, productUrl, storeDomain);
  } catch (error) {
    console.error("[WC STORE API] Fetch error:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Fetch variations for a WC Store API variable product and return cheapest in-stock variant price
async function fetchWcVariationPrice(
  productId: number,
  storeDomain: string,
  minorUnit: number,
): Promise<{ price: number; compareAtPrice: number | null; currency: string; available: boolean } | null> {
  const apiUrl = `https://${storeDomain}/wp-json/wc/store/v1/products/${productId}/variations`;
  console.log(`[WC STORE API] Fetching variations: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      headers: WOOCOMMERCE_HEADERS,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.log(`[WC STORE API] Variations fetch failed: HTTP ${response.status}`);
      return null;
    }

    const variations: any[] = await response.json();
    if (!Array.isArray(variations) || variations.length === 0) {
      console.log("[WC STORE API] No variations returned");
      return null;
    }

    const divisor = Math.pow(10, minorUnit);
    let bestPrice: number | null = null;
    let bestCompareAt: number | null = null;
    let bestCurrency = "EUR";
    let anyInStock = false;

    for (const v of variations) {
      const vPrices = v.prices;
      if (!vPrices?.price) continue;

      const vPrice = parseInt(vPrices.price, 10) / divisor;
      const vRegular = parseInt(vPrices.regular_price || vPrices.price, 10) / divisor;
      const vSale = vPrices.sale_price ? parseInt(vPrices.sale_price, 10) / divisor : null;
      const vCurrency = (vPrices.currency_code || "EUR").toUpperCase();
      const vInStock = v.is_in_stock === true;

      if (vInStock) anyInStock = true;

      // Use sale price if available, otherwise regular price
      const effectivePrice = (vSale && vSale > 0 && vSale < vRegular) ? vSale : vPrice;
      const effectiveCompareAt = (vSale && vSale > 0 && vSale < vRegular) ? vRegular : (vRegular > vPrice ? vRegular : null);

      if (effectivePrice <= 0) continue;

      // Prefer cheapest in-stock variant; if none in stock, cheapest overall
      if (bestPrice === null || (vInStock && effectivePrice < bestPrice) || (!anyInStock && effectivePrice < bestPrice)) {
        bestPrice = effectivePrice;
        bestCompareAt = effectiveCompareAt ?? null;
        bestCurrency = vCurrency;
      }
    }

    if (bestPrice === null) return null;

    console.log(`[WC STORE API] Best variation: price=${bestPrice} ${bestCurrency}, inStock=${anyInStock}, from ${variations.length} variations`);
    return { price: bestPrice, compareAtPrice: bestCompareAt, currency: bestCurrency, available: anyInStock };
  } catch (error) {
    console.error("[WC STORE API] Variations fetch error:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Parse WC Store API response into PriceResponse
async function parseWcStoreApiResponse(
  data: any[],
  productUrl: string,
  storeDomain: string,
): Promise<PriceResponse | null> {
  if (!Array.isArray(data) || data.length === 0) {
    console.log("[WC STORE API] Empty response or product not found");
    return null;
  }

  const product = data[0];
  const prices = product.prices;

  if (!prices || !prices.price) {
    console.log("[WC STORE API] No prices object in response");
    return null;
  }

  // CRITICAL: Store API returns prices as integers with implied decimal places
  // e.g. "2490" = €24.90, currency_minor_unit = 2
  const minorUnit = prices.currency_minor_unit ?? 2;
  const divisor = Math.pow(10, minorUnit);
  const currencyCode = (prices.currency_code || "EUR").toUpperCase();

  const rawPrice = parseInt(prices.price, 10);
  const rawRegularPrice = parseInt(prices.regular_price || prices.price, 10);
  const rawSalePrice = prices.sale_price ? parseInt(prices.sale_price, 10) : null;

  if (isNaN(rawPrice) || rawPrice <= 0) {
    console.log(`[WC STORE API] Invalid price value: ${prices.price}`);
    return null;
  }

  let price = rawPrice / divisor;
  let compareAtPrice: number | null = null;

  // If there's a sale, sale_price is the current and regular_price is the original
  if (rawSalePrice && rawSalePrice > 0 && rawSalePrice < rawRegularPrice) {
    price = rawSalePrice / divisor;
    compareAtPrice = rawRegularPrice / divisor;
  } else if (rawRegularPrice > rawPrice) {
    compareAtPrice = rawRegularPrice / divisor;
  }

  // Validate price range
  if (price < AZUREFILM_PRICE_RANGE.min || price > AZUREFILM_PRICE_RANGE.max) {
    console.log(`[WC STORE API] ⚠ Price ${price} ${currencyCode} outside expected range (${AZUREFILM_PRICE_RANGE.min}-${AZUREFILM_PRICE_RANGE.max}), flagging as anomalous`);
  }

  // Currency validation
  if (currencyCode !== "EUR" && storeDomain.includes("azurefilm.com")) {
    console.log(`[WC STORE API] ⚠ Unexpected currency ${currencyCode} from AzureFilm (expected EUR)`);
  }

  const available = product.is_in_stock === true;
  const stockStatus: StockStatus = available ? "in_stock" : "out_of_stock";

  console.log(`[WC STORE API] ✓ price=${price} ${currencyCode}, compareAt=${compareAtPrice}, inStock=${available}, type=${product.type}`);

  // For variable products, fetch variations to get cheapest in-stock variant price
  if (product.type === "variable" && product.id) {
    console.log(`[WC STORE API] Variable product detected (id=${product.id}), fetching variations...`);
    const variationResult = await fetchWcVariationPrice(product.id, storeDomain, minorUnit);
    if (variationResult && variationResult.price > 0) {
      console.log(`[WC STORE API] Using variation price: ${variationResult.price} ${variationResult.currency} (was parent: ${price} ${currencyCode})`);
      return {
        success: true,
        price: variationResult.price,
        compareAtPrice: variationResult.compareAtPrice && variationResult.compareAtPrice > variationResult.price * 1.05 ? variationResult.compareAtPrice : null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: variationResult.currency,
        available: variationResult.available,
        stockStatus: variationResult.available ? "in_stock" : "out_of_stock" as StockStatus,
        source: "html" as const,
        fetchedAt: new Date().toISOString(),
        sourceUrl: productUrl,
        detectedCurrency: variationResult.currency,
      };
    }
    console.log("[WC STORE API] Variation fetch returned no results, using parent price");
  }

  return {
    success: true,
    price,
    compareAtPrice: compareAtPrice && compareAtPrice > price * 1.05 ? compareAtPrice : null,
    weightGrams: null,
    diameterMm: null,
    variantTitle: null,
    currency: currencyCode,
    available,
    stockStatus,
    source: "html" as const,
    fetchedAt: new Date().toISOString(),
    sourceUrl: productUrl,
    detectedCurrency: currencyCode,
  };
}

async function fetchWooCommercePriceDirect(productUrl: string, preferredCurrency: string): Promise<PriceResponse> {
  const storeCurrency = getWooCommerceCurrency(productUrl);
  const storeDomain = extractDomain(productUrl);
  console.log(`[WOOCOMMERCE FETCH] URL: ${productUrl}, store currency: ${storeCurrency}, domain: ${storeDomain}`);

  // === PRIMARY METHOD: WC Store API v1 ===
  const storeApiResult = await fetchWcStoreApiPrice(productUrl, storeDomain);
  if (storeApiResult) {
    console.log(`[WOOCOMMERCE FETCH] ✓ WC Store API succeeded: ${storeApiResult.price} ${storeApiResult.currency}`);
    return storeApiResult;
  }
  console.log("[WOOCOMMERCE FETCH] WC Store API failed, falling back to JSON-LD HTML extraction");

  // === FALLBACK METHOD: Direct HTML fetch + JSON-LD ===
  try {
    const response = await fetch(productUrl, {
      headers: {
        ...WOOCOMMERCE_HEADERS,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    console.log(`[WOOCOMMERCE FETCH] HTML fallback HTTP ${response.status}`);

    if (!response.ok) {
      if (response.status === 403) {
        const text = await response.text();
        if (isCloudflareBlock(text)) {
          console.log(`[WOOCOMMERCE FETCH] Cloudflare block on HTML fallback`);
          return {
            success: false, price: null, compareAtPrice: null, weightGrams: null,
            diameterMm: null, variantTitle: null, currency: storeCurrency,
            available: false, source: "html", fetchedAt: new Date().toISOString(),
            error: "Cloudflare block - both Store API and HTML blocked",
          };
        }
      }
      return {
        success: false, price: null, compareAtPrice: null, weightGrams: null,
        diameterMm: null, variantTitle: null, currency: storeCurrency,
        available: false, source: "html", fetchedAt: new Date().toISOString(),
        error: `HTTP ${response.status}`,
        is404: response.status === 404,
      };
    }

    const html = await response.text();
    console.log(`[WOOCOMMERCE FETCH] HTML size: ${html.length} bytes`);

    // Check for Cloudflare block in HTML content
    if (isCloudflareBlock(html)) {
      console.log("[WOOCOMMERCE FETCH] Cloudflare block detected in HTML body");
      return {
        success: false, price: null, compareAtPrice: null, weightGrams: null,
        diameterMm: null, variantTitle: null, currency: storeCurrency,
        available: false, source: "html", fetchedAt: new Date().toISOString(),
        error: "Cloudflare block detected",
      };
    }
    // Extract JSON-LD Product data
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let scriptMatch;
    while ((scriptMatch = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(scriptMatch[1].trim());
        const items: any[] = Array.isArray(parsed) ? parsed : [parsed];
        const product = items.find((item: any) => item["@type"] === "Product");
        if (!product?.offers) continue;

        const offers: any[] = Array.isArray(product.offers) ? product.offers : [product.offers];
        // Also handle OfferList wrapper (common in WooCommerce)
        const flatOffers: any[] = [];
        for (const o of offers) {
          if (o?.["@type"] === "AggregateOffer" || o?.offers) {
            const inner = Array.isArray(o.offers) ? o.offers : [o.offers];
            flatOffers.push(...inner.filter(Boolean));
          } else {
            flatOffers.push(o);
          }
        }

        const directPriceOffers = flatOffers.filter((o: any) => o?.price != null);
        const directPrices = directPriceOffers
          .map((o: any) => parsePriceForDomain(String(o.price), productUrl))
          .filter((p: number) => !isNaN(p) && p > 0);

        // Handle AggregateOffer lowPrice/highPrice even when no direct offer.price exists
        let aggregateSalePrice: number | null = null;
        let aggregateCompareAt: number | null = null;
        for (const o of [...offers, ...flatOffers]) {
          if (o?.lowPrice != null && o?.highPrice != null) {
            const low = parsePriceForDomain(String(o.lowPrice), productUrl);
            const high = parsePriceForDomain(String(o.highPrice), productUrl);
            if (!isNaN(low) && !isNaN(high) && low > 0 && high > low) {
              aggregateSalePrice = low;
              aggregateCompareAt = high;
              console.log(`[WOOCOMMERCE FETCH] AggregateOffer sale: low=${low}, high=${high}`);
              break;
            }
          }
        }

        const candidatePrices = [...directPrices];
        if (aggregateSalePrice !== null) candidatePrices.push(aggregateSalePrice);
        if (aggregateCompareAt !== null) candidatePrices.push(aggregateCompareAt);

        if (candidatePrices.length === 0) continue;

        const lowestPrice = Math.min(...candidatePrices);
        const highestPrice = Math.max(...candidatePrices);
        const compareAt = highestPrice > lowestPrice * 1.05 ? highestPrice : null;

        const firstCurrencyOffer =
          directPriceOffers.find((o: any) => o?.priceCurrency) ||
          [...offers, ...flatOffers].find((o: any) => o?.priceCurrency);
        const detectedCurrency = (firstCurrencyOffer?.priceCurrency as string) || storeCurrency;

        // Check availability — but NEVER bail on out-of-stock
        const availabilityPool = [...directPriceOffers, ...offers, ...flatOffers].filter((o: any) => o?.availability != null);
        const inStockOffers = availabilityPool.filter((o: any) =>
          String(o.availability || "").toLowerCase().includes("instock")
        );
        const available = inStockOffers.length > 0;

        const salePrice = aggregateSalePrice ?? lowestPrice;
        const salePriceCompareAt =
          aggregateCompareAt ?? (compareAt && compareAt > salePrice * 1.05 ? compareAt : null);

        console.log(
          `[WOOCOMMERCE FETCH] ✓ JSON-LD: price=${salePrice} ${detectedCurrency}, compareAt=${salePriceCompareAt}, inStock=${available}`,
        );


        return {
          success: true,
          price: salePrice,
          compareAtPrice: salePriceCompareAt,
          weightGrams: null,
          diameterMm: null,
          variantTitle: null,
          currency: detectedCurrency,
          available, // false for OOS — but price is still extracted
          stockStatus: available ? "in_stock" : ("out_of_stock" as StockStatus),
          source: "html" as const,
          fetchedAt: new Date().toISOString(),
          detectedCurrency,
          sourceUrl: productUrl,
        };
      } catch (_e) {
        console.log("[WOOCOMMERCE FETCH] JSON-LD parse attempt failed, trying next");
      }
    }

    // JSON-LD failed — try HTML meta/microdata fallback for WooCommerce
    console.log("[WOOCOMMERCE FETCH] No JSON-LD Product found, trying HTML price extraction");

    // WooCommerce often has price in <meta> or class="woocommerce-Price-amount"
    // Pattern: <span class="woocommerce-Price-amount amount"><bdi>24,90&nbsp;<span class="woocommerce-Price-currencySymbol">€</span></bdi></span>
    const priceAmountRegex = /class="woocommerce-Price-amount[^"]*"[^>]*>(?:<[^>]+>)*([\d.,]+)\s*(?:&nbsp;)?(?:<[^>]+>)*[€£$]/gi;
    const htmlPrices: number[] = [];
    let htmlMatch;
    while ((htmlMatch = priceAmountRegex.exec(html)) !== null) {
      const p = parsePriceForDomain(htmlMatch[1], productUrl);
      if (!isNaN(p) && p > 0 && validateFilamentPrice(p, storeCurrency)) {
        htmlPrices.push(p);
      }
    }

    if (htmlPrices.length > 0) {
      // Prefer explicit WooCommerce struck-through original + active sale price when present
      const delInsSaleMatch = html.match(/<del[^>]*>[\s\S]*?([\d.,]+)[\s\S]*?<\/del>[\s\S]*?<ins[^>]*>[\s\S]*?([\d.,]+)[\s\S]*?<\/ins>/i);
      if (delInsSaleMatch?.[1] && delInsSaleMatch?.[2]) {
        const oldPrice = parsePriceForDomain(delInsSaleMatch[1], productUrl);
        const newPrice = parsePriceForDomain(delInsSaleMatch[2], productUrl);
        if (!isNaN(oldPrice) && !isNaN(newPrice) && oldPrice > 0 && newPrice > 0) {
          const salePrice = Math.min(oldPrice, newPrice);
          const compareAt = Math.max(oldPrice, newPrice);
          const isOOS = /class="out-of-stock"|out_of_stock|outofstock/i.test(html);

          console.log(`[WOOCOMMERCE FETCH] ✓ HTML del/ins sale: price=${salePrice} ${storeCurrency}, compareAt=${compareAt}, oos=${isOOS}`);

          return {
            success: true,
            price: salePrice,
            compareAtPrice: compareAt > salePrice * 1.05 ? compareAt : null,
            weightGrams: null,
            diameterMm: null,
            variantTitle: null,
            currency: storeCurrency,
            available: !isOOS,
            stockStatus: isOOS ? "out_of_stock" as StockStatus : "in_stock" as StockStatus,
            source: "html" as const,
            fetchedAt: new Date().toISOString(),
            sourceUrl: productUrl,
          };
        }
      }

      // WooCommerce sale format: first price is original (strikethrough), second is sale price
      // Or if only one price, it's the current price
      const hasSale = htmlPrices.length >= 2 && htmlPrices[0] > htmlPrices[1];
      const price = hasSale ? htmlPrices[1] : htmlPrices[0];
      const compareAtHtml = hasSale ? htmlPrices[0] : (htmlPrices.length >= 2 && htmlPrices[1] > price * 1.05 ? htmlPrices[1] : null);

      // Check stock status from HTML
      const isOOS = /class="out-of-stock"|out_of_stock|outofstock/i.test(html);

      console.log(`[WOOCOMMERCE FETCH] ✓ HTML fallback: price=${price} ${storeCurrency}, compareAt=${compareAtHtml}, oos=${isOOS}`);

      return {
        success: true,
        price,
        compareAtPrice: compareAtHtml,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: storeCurrency,
        available: !isOOS,
        stockStatus: isOOS ? "out_of_stock" as StockStatus : "in_stock" as StockStatus,
        source: "html" as const,
        fetchedAt: new Date().toISOString(),
        sourceUrl: productUrl,
      };
    }

    console.log("[WOOCOMMERCE FETCH] ❌ No price found via JSON-LD or HTML");

    // Last resort: try Firecrawl which may bypass Cloudflare
    console.log("[WOOCOMMERCE FETCH] Falling back to Firecrawl");
    return await fetchPriceWithFirecrawl(productUrl, preferredCurrency, null, false, "filament");

  } catch (error) {
    console.error("[WOOCOMMERCE FETCH] Error:", error);
    // On network error, try Firecrawl as fallback
    console.log("[WOOCOMMERCE FETCH] Direct fetch failed, trying Firecrawl fallback");
    return await fetchPriceWithFirecrawl(productUrl, preferredCurrency, null, false, "filament");
  }
}

// Product type for price validation (filament default, printer has higher range)
type ProductType = "filament" | "printer";

// Price range configurations per product type
const PRICE_RANGES: Record<ProductType, { min: number; max: number }> = {
  filament: { min: 10, max: 150 },
  printer: { min: 99, max: 10000 },
};

// Validate that a price is within reasonable range for the product type
// Minimum raised to $10 for filaments to avoid capturing weights, discount amounts, or shipping costs
// Printers use $99-$10000 range to avoid capturing accessory prices
function validateProductPrice(price: number, productType: ProductType = "filament"): boolean {
  const range = PRICE_RANGES[productType];
  return price >= range.min && price <= range.max;
}

// Currency-aware filament price validation
const CURRENCY_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  USD: { min: 3, max: 200 },
  CAD: { min: 3, max: 200 },
  AUD: { min: 3, max: 200 },
  GBP: { min: 3, max: 150 },
  EUR: { min: 3, max: 200 },
  JPY: { min: 100, max: 30000 },
  default: { min: 1, max: 50000 },
};

function validateFilamentPrice(price: number, currency: string = "USD"): boolean {
  const range = CURRENCY_PRICE_RANGES[currency] || CURRENCY_PRICE_RANGES.default;
  return price >= range.min && price <= range.max;
}

// Extract printer price from page content
// Uses higher price range ($99-$10000) appropriate for 3D printers
// NOTE: For printers, we use a different strategy than filaments:
// - Look for "From $XXX" patterns (Bambu Lab format)
// - Look for prices near the product title (first prominent price)
// - Avoid accessory/bundle prices that are usually lower
function extractPrinterPrice(
  markdown: string,
  preferredCurrency: string,
): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log(`Extracting PRINTER price from content, preferred currency: ${preferredCurrency}`);
  const range = PRICE_RANGES.printer;

  // Currency-specific patterns
  const currencySymbols: Record<string, { symbol: string; symbolEscaped: string }> = {
    USD: { symbol: "$", symbolEscaped: "\\$" },
    EUR: { symbol: "€", symbolEscaped: "€" },
    GBP: { symbol: "£", symbolEscaped: "£" },
    CAD: { symbol: "CA$", symbolEscaped: "(?:CA)?\\$" },
    AUD: { symbol: "A$", symbolEscaped: "(?:A)?\\$" },
    JPY: { symbol: "¥", symbolEscaped: "¥" },
  };

  const config = currencySymbols[preferredCurrency] || currencySymbols.USD;

  // STRATEGY 1: Look for "From $XXX" pattern (Bambu Lab, Prusa, etc.)
  // This is the main product starting price
  const fromPattern = new RegExp(`From\\s*${config.symbolEscaped}\\s*([\\d,]+(?:\\.\\d{2})?)`, "gi");
  const fromMatches = [...markdown.matchAll(fromPattern)];
  if (fromMatches.length > 0) {
    const fromPrices = fromMatches
      .map((m) => parseFloat(m[1].replace(",", "")))
      .filter((p) => !isNaN(p) && p >= range.min && p <= range.max);

    if (fromPrices.length > 0) {
      // Take the first "From $XXX" price found (usually the main product)
      const price = fromPrices[0];
      console.log(`Found printer "From" price: ${config.symbol}${price}`);
      return { price, compareAtPrice: null, currency: preferredCurrency, available: true };
    }
  }

  // STRATEGY 2: Look near "Add to Cart" button - the price just before it is usually the main price
  // Focus on a smaller window to avoid accessory prices
  const addToCartMatch = markdown.match(/Add\s*to\s*Cart/i);
  if (addToCartMatch && addToCartMatch.index) {
    // Look in the 500 chars before "Add to Cart" for prices
    const beforeCartStart = Math.max(0, addToCartMatch.index - 500);
    const beforeCart = markdown.slice(beforeCartStart, addToCartMatch.index);

    const pricePattern = new RegExp(`${config.symbolEscaped}\\s*([\\d,]+(?:\\.\\d{2})?)`, "g");
    const cartPrices = [...beforeCart.matchAll(pricePattern)]
      .map((m) => parseFloat(m[1].replace(",", "")))
      .filter((p) => !isNaN(p) && p >= range.min && p <= range.max);

    if (cartPrices.length > 0) {
      // Take the LAST price before Add to Cart (usually the current price)
      const price = cartPrices[cartPrices.length - 1];
      // Look for a compare-at price (strikethrough/original price is usually before the current)
      const compareAt =
        cartPrices.length > 1 && cartPrices[cartPrices.length - 2] > price * 1.05
          ? cartPrices[cartPrices.length - 2]
          : null;
      console.log(
        `Found printer price near Add to Cart: ${config.symbol}${price}${compareAt ? `, compare: ${config.symbol}${compareAt}` : ""}`,
      );
      return { price, compareAtPrice: compareAt, currency: preferredCurrency, available: true };
    }
  }

  // STRATEGY 3: Look for the first prominent price in the upper portion of the page
  // Split markdown into lines and look for prices in the first 30%
  const lines = markdown.split("\n");
  const upperContent = lines.slice(0, Math.floor(lines.length * 0.3)).join("\n");

  const pricePattern = new RegExp(`${config.symbolEscaped}\\s*([\\d,]+(?:\\.\\d{2})?)`, "g");
  const upperPrices = [...upperContent.matchAll(pricePattern)]
    .map((m) => parseFloat(m[1].replace(",", "")))
    .filter((p) => !isNaN(p) && p >= range.min && p <= range.max);

  console.log(`Found ${upperPrices.length} valid printer prices in upper content:`, upperPrices.slice(0, 5));

  if (upperPrices.length > 0) {
    // For printers, take the FIRST valid price (main product price appears first)
    const price = upperPrices[0];
    // Compare-at is usually the second price if it's higher
    const compareAt = upperPrices.length > 1 && upperPrices[1] > price * 1.05 ? upperPrices[1] : null;
    console.log(
      `Printer price (first in upper content): ${config.symbol}${price}${compareAt ? `, compare: ${config.symbol}${compareAt}` : ""}`,
    );
    return { price, compareAtPrice: compareAt, currency: preferredCurrency, available: true };
  }

  // STRATEGY 4: Full page fallback - take first valid price
  const allPrices = [...markdown.matchAll(pricePattern)]
    .map((m) => parseFloat(m[1].replace(",", "")))
    .filter((p) => !isNaN(p) && p >= range.min && p <= range.max);

  if (allPrices.length > 0) {
    const price = allPrices[0];
    const compareAt = allPrices.length > 1 && allPrices[1] > price * 1.05 ? allPrices[1] : null;
    console.log(
      `Printer price (full page first): ${config.symbol}${price}${compareAt ? `, compare: ${config.symbol}${compareAt}` : ""}`,
    );
    return { price, compareAtPrice: compareAt, currency: preferredCurrency, available: true };
  }

  console.log("No valid printer price found");
  return { price: null, compareAtPrice: null, currency: preferredCurrency, available: false };
}

// Detect granular stock status from page content
// Returns: 'preorder', 'low_stock', 'out_of_stock', or 'unknown'
function detectStockStatus(markdown: string): StockStatus {
  const content = markdown.toLowerCase();

  // Check for preorder patterns first (highest priority)
  const preorderPatterns = [
    /pre[- ]?order/i,
    /coming\s*soon/i,
    /available\s*for\s*pre[- ]?order/i,
    /reserve\s*now/i,
    /launching\s*soon/i,
  ];
  if (preorderPatterns.some((p) => p.test(content))) {
    console.log("📦 Detected preorder status");
    return "preorder";
  }

  // Check for low stock patterns
  const lowStockPatterns = [
    /only\s*\d+\s*left/i,
    /low\s*stock/i,
    /limited\s*(?:stock|quantity|availability)/i,
    /few\s*(?:remaining|left)/i,
    /hurry[,!]?\s*(?:only|just)/i,
    /almost\s*(?:gone|sold\s*out)/i,
  ];
  if (lowStockPatterns.some((p) => p.test(content))) {
    console.log("⚠️ Detected low stock status");
    return "low_stock";
  }

  // Check for sold out patterns
  const soldOutPatterns = [
    /sold\s*out/i,
    /out\s*of\s*stock/i,
    /currently\s*unavailable/i,
    /notify\s*(me\s*)?(when\s*)?(available|in\s*stock)/i,
    /back\s*in\s*stock\s*soon/i,
    /temporarily\s*out/i,
    /no\s*longer\s*available/i,
    /stock:\s*0/i,
    /availability:\s*(?:out\s*of\s*stock|unavailable)/i,
    /item\s*is\s*(?:currently\s*)?(?:unavailable|sold\s*out)/i,
  ];
  if (soldOutPatterns.some((p) => p.test(content))) {
    console.log("❌ Detected out of stock status");
    return "out_of_stock";
  }

  // No specific status detected
  return "unknown";
}

// Legacy wrapper for backward compatibility
function detectSoldOutStatus(markdown: string): boolean {
  const status = detectStockStatus(markdown);
  return status === "out_of_stock";
}

// Map currency to regional price column name
function getRegionalPriceColumn(currency: string): string {
  const map: Record<string, string> = {
    USD: "variant_price",
    CAD: "price_cad",
    EUR: "price_eur",
    GBP: "price_gbp",
    AUD: "price_aud",
    JPY: "price_jpy",
  };
  return map[currency] || "variant_price";
}

// Update filament stock status in database when live check detects changes
async function updateFilamentStockStatus(
  productUrl: string,
  available: boolean,
  stockStatus: StockStatus,
  price: number | null,
  currency: string = "USD",
): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    // Find the filament by URL — try product_url first, then regional URL columns
    const selectCols = "id, variant_available, variant_price, price_eur, price_cad, price_gbp, price_aud, price_jpy";
    let filament: { id: string; variant_available: boolean | null; variant_price: number | null; price_eur: number | null; price_cad: number | null; price_gbp: number | null; price_aud: number | null; price_jpy: number | null } | null = null;

    // Try exact match on product_url (US)
    const { data: exactMatch } = await supabase
      .from("filaments")
      .select(selectCols)
      .eq("product_url", productUrl)
      .maybeSingle();

    if (exactMatch) {
      filament = exactMatch;
    } else {
      // Try regional URL columns (EU, CA, UK, AU, JP)
      const regionalColumns = ["product_url_eu", "product_url_ca", "product_url_uk", "product_url_au", "product_url_jp"] as const;
      for (const col of regionalColumns) {
        const { data: regionalMatch } = await supabase
          .from("filaments")
          .select(selectCols)
          .eq(col, productUrl)
          .maybeSingle();
        if (regionalMatch) {
          filament = regionalMatch;
          console.log(`Found filament via ${col}: ${regionalMatch.id}`);
          break;
        }
      }
    }

    if (!filament) {
      console.log("No filament found for URL (checked all regional columns), skipping DB update:", productUrl);
      return;
    }

    // Get the current price from the correct column based on currency
    const priceColumn = getRegionalPriceColumn(currency);
    const currentPrice = (filament as Record<string, unknown>)[priceColumn] as number | null;

    // Determine if we need to update
    const stockChanged = filament.variant_available !== available;
    const priceDiffersSignificantly =
      price !== null && currentPrice !== null && Math.abs(price - currentPrice) > 0.5;

    if (!stockChanged && !priceDiffersSignificantly) {
      console.log("No significant changes detected, skipping DB update");
      return;
    }

    // === DISCREPANCY DETECTION ===
    const regionCode = CURRENCY_TO_REGION[currency] || "US";
    let shouldPersistPrice = priceDiffersSignificantly && price !== null;

    if (priceDiffersSignificantly && price !== null && currentPrice !== null) {
      const changePercent = ((price - currentPrice) / currentPrice) * 100;
      const absChangePercent = Math.abs(changePercent);

      if (absChangePercent < 5) {
        // Auto-approve: small change, update immediately
        console.log(`Price change ${changePercent.toFixed(1)}% < 5%, auto-approving`);
        await supabase.from("price_discrepancies").insert({
          filament_id: filament.id,
          old_price: currentPrice,
          new_price: price,
          price_change_percent: Math.round(changePercent * 100) / 100,
          currency,
          region: regionCode,
          status: "auto_approved",
          source_url: productUrl,
          reviewed_at: new Date().toISOString(),
          notes: "Auto-approved: change < 5%",
        });
      } else {
        // Manual review required: significant change
        const isUrgent = absChangePercent > 20;
        console.log(`Price change ${changePercent.toFixed(1)}% requires manual review${isUrgent ? " (URGENT)" : ""}`);
        await supabase.from("price_discrepancies").insert({
          filament_id: filament.id,
          old_price: currentPrice,
          new_price: price,
          price_change_percent: Math.round(changePercent * 100) / 100,
          currency,
          region: regionCode,
          status: "manual_review",
          source_url: productUrl,
          notes: isUrgent ? "URGENT: Price change > 20%" : "Price change 5-20%, needs review",
        });
        // Keep stock-state updates, but hold price write until reviewed
        shouldPersistPrice = false;
      }
    }

    // Build update object — always update stock status, even for out-of-stock items
    const nowIso = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      variant_available: available,
      sync_status: "active", // Price is still trackable even when out of stock
      last_scraped_at: nowIso,
    };

    // Only update price when allowed by discrepancy policy
    if (shouldPersistPrice && price !== null) {
      const priceColumn = getRegionalPriceColumn(currency);
      updateData[priceColumn] = price;
    }

    const { error } = await supabase.from("filaments").update(updateData).eq("id", filament.id);

    if (error) {
      console.error("Failed to update filament stock status:", error);
    } else {
      // Update pricing row stock flag (column is in_stock)
      const pricingUpdate: Record<string, unknown> = {
        in_stock: available,
        last_verified_at: nowIso,
      };

      if (shouldPersistPrice && price !== null) {
        pricingUpdate.price_cents = Math.round(price * 100);
      }

      const { error: pricingError } = await supabase
        .from("filament_prices")
        .update(pricingUpdate)
        .eq("filament_id", filament.id)
        .eq("currency_code", currency);

      if (pricingError) {
        console.error("Failed to update filament_prices stock flag:", pricingError);
      }

      console.log(
        `✓ Updated filament ${filament.id}: available=${available}, stockStatus=${stockStatus}${shouldPersistPrice && price !== null ? `, price=${price}` : ""}`,
      );
    }
  } catch (err) {
    console.error("Error updating filament stock status:", err);
  }
}

// Legacy: Extract price specifically from Creality store pages
function extractCrealityPrice(markdown: string, preferredCurrency: string = "USD"): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log("=== CREALITY EXTRACTION ===");
  console.log("Input markdown preview (first 500 chars):", markdown.substring(0, 500));
  console.log("Input markdown length:", markdown.length);

  // First, try the sale format pattern: "$18.99 $34.25 Save $15.26"
  const saleResult = extractSalePriceBeforeSave(markdown);
  console.log("Sale format extraction result:", JSON.stringify(saleResult));

  if (saleResult.salePrice && validateFilamentPrice(saleResult.salePrice, preferredCurrency)) {
    console.log(`✓ Creality sale format matched: $${saleResult.salePrice}, compare-at: $${saleResult.compareAtPrice}`);
    const result = {
      price: saleResult.salePrice,
      compareAtPrice: saleResult.compareAtPrice,
      currency: preferredCurrency,
      available: true,
    };
    console.log("Final Creality price returned:", JSON.stringify(result));
    return result;
  }
  console.log("Sale format not matched, trying fallback methods...");

  // Remove savings amounts from text
  let cleanedMarkdown = removeSavingsAmounts(markdown);

  // Find price section near Add to Cart/Buy Now buttons
  const addToCartIndex = cleanedMarkdown.search(/Add\s*to\s*Cart/i);
  const buyNowIndex = cleanedMarkdown.search(/Buy\s*Now/i);
  const priceIndex = Math.max(addToCartIndex, buyNowIndex);

  let priceSection = "";
  if (priceIndex > -1) {
    priceSection = cleanedMarkdown.slice(Math.max(0, priceIndex - 500), priceIndex + 100);
  }

  // Look for explicit sale price patterns
  const saleMatch = cleanedMarkdown.match(/(?:Sale\s*price|Now|Special)\s*[:.]?\s*\$(\d+(?:\.\d{2})?)/i);

  // Pattern: Two prices adjacent (sale and regular)
  const dualPriceMatch = priceSection.match(/\$(\d+(?:\.\d{2})?)\s*(?:[\s\n~-]*)\$(\d+(?:\.\d{2})?)/);
  console.log("Dual price match result:", dualPriceMatch ? dualPriceMatch[0] : "null");

  if (dualPriceMatch) {
    const price1 = parseFloat(dualPriceMatch[1]);
    const price2 = parseFloat(dualPriceMatch[2]);
    const salePrice = Math.min(price1, price2);
    const comparePrice = Math.max(price1, price2);
    console.log(
      `Dual price parsed: price1=$${price1}, price2=$${price2}, sale=$${salePrice}, compare=$${comparePrice}`,
    );

    if (validateFilamentPrice(salePrice, preferredCurrency) && validateFilamentPrice(comparePrice, preferredCurrency)) {
      console.log(`✓ Found Creality dual price: $${salePrice}, compare-at: $${comparePrice}`);
      const result = { price: salePrice, compareAtPrice: comparePrice, currency: preferredCurrency, available: true };
      console.log("Final Creality price returned:", JSON.stringify(result));
      return result;
    }
    console.log("Dual price validation failed");
  }

  // Extract all valid prices from the cleaned price section
  const allPricesInSection = priceSection.match(/\$(\d+(?:\.\d{2})?)/g);
  console.log("All prices in section (raw):", allPricesInSection);

  if (allPricesInSection) {
    const allParsed = allPricesInSection.map((p) => parseFloat(p.replace("$", "")));
    console.log("All prices parsed:", allParsed);

    const validPrices = allParsed.filter((p) => validateFilamentPrice(p, preferredCurrency)).sort((a, b) => a - b);
    console.log("Valid prices after filtering (min=$10, max=$150):", validPrices);

    if (validPrices.length > 0) {
      const price = validPrices[0];
      const compareAt = validPrices.length > 1 && validPrices[1] > price * 1.1 ? validPrices[1] : null;
      console.log(`✓ Found Creality price: $${price}${compareAt ? `, compare-at: $${compareAt}` : ""}`);
      const result = { price, compareAtPrice: compareAt, currency: preferredCurrency, available: true };
      console.log("Final Creality price returned:", JSON.stringify(result));
      return result;
    }
  }

  // Try explicit sale match
  if (saleMatch) {
    const price = parseFloat(saleMatch[1]);
    if (validateFilamentPrice(price, preferredCurrency)) {
      console.log(`Found Creality explicit sale price: $${price}`);
      return { price, compareAtPrice: null, currency: preferredCurrency, available: true };
    }
  }

  // Last resort: search full cleaned markdown
  console.log("=== CREALITY FALLBACK: Full markdown search ===");
  const allPricesRaw = [...cleanedMarkdown.matchAll(/\$(\d+(?:\.\d{2})?)/g)];
  console.log("All price matches in cleaned markdown:", allPricesRaw.length);
  console.log(
    "First 10 price matches:",
    allPricesRaw.slice(0, 10).map((m) => m[0]),
  );

  const allPrices = allPricesRaw
    .map((m) => parseFloat(m[1]))
    .filter((p) => validateFilamentPrice(p, preferredCurrency))
    .sort((a, b) => a - b);

  console.log("Valid prices after filtering:", allPrices);

  if (allPrices.length > 0) {
    console.log(`Creality fallback: found ${allPrices.length} valid prices, using lowest: $${allPrices[0]}`);
    const result = {
      price: allPrices[0],
      compareAtPrice: allPrices.length > 1 && allPrices[1] > allPrices[0] * 1.1 ? allPrices[1] : null,
      currency: preferredCurrency,
      available: true,
    };
    console.log("Final Creality price returned:", JSON.stringify(result));
    return result;
  }

  console.log("❌ No valid Creality price found");
  return { price: null, compareAtPrice: null, currency: preferredCurrency, available: false };
}

// Detect Shopify stores known to use multi-currency
function isMultiCurrencyShopifyStore(url: string): boolean {
  const multiCurrencyDomains = ["polymaker.com", "esun3d.com", "sunlu.com", "overture3d.com"];
  const urlLower = url.toLowerCase();
  return multiCurrencyDomains.some((domain) => urlLower.includes(domain));
}

// Detect stores where Shopify JSON API returns unreliable prices
function shouldAlwaysUseFirecrawl(url: string): boolean {
  const unreliableJsonStores = ["amolen.com", "store.bambulab.com"];
  const urlLower = url.toLowerCase();
  return unreliableJsonStores.some((domain) => urlLower.includes(domain));
}

// Map currency to Firecrawl location settings
function getFirecrawlLocation(currency: string): { country: string; languages: string[] } {
  switch (currency) {
    case "CAD":
      return { country: "CA", languages: ["en-CA", "en"] };
    case "GBP":
      return { country: "GB", languages: ["en-GB", "en"] };
    case "EUR":
      return { country: "DE", languages: ["de-DE", "en"] };
    case "AUD":
      return { country: "AU", languages: ["en-AU", "en"] };
    case "JPY":
      return { country: "JP", languages: ["ja-JP", "en"] };
    default:
      return { country: "US", languages: ["en-US", "en"] };
  }
}

// Legacy: Extract price from GEEETECH OpenCart pages
function extractOpenCartPrice(markdown: string): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log("Extracting OpenCart/GEEETECH price (legacy)...");

  const skuIndex = markdown.search(/SKU:\s*[\d\-]+/i);
  let priceSection = skuIndex > -1 ? markdown.slice(skuIndex, skuIndex + 500) : "";

  if (!priceSection) {
    const cartIndex = markdown.search(/Add\s*to\s*Cart/i);
    if (cartIndex > -1) {
      priceSection = markdown.slice(Math.max(0, cartIndex - 300), cartIndex);
    }
  }

  if (!priceSection) {
    const lines = markdown.split("\n");
    const startLine = Math.floor(lines.length * 0.15);
    const endLine = Math.floor(lines.length * 0.5);
    priceSection = lines.slice(startLine, endLine).join("\n");
  }

  const salePriceMatch = priceSection.match(/\$(\d+(?:\.\d{2})?)\s*(?:\n|\s)*\$(\d+(?:\.\d{2})?)/);
  if (salePriceMatch) {
    const price1 = parseFloat(salePriceMatch[1]);
    const price2 = parseFloat(salePriceMatch[2]);
    const salePrice = Math.min(price1, price2);
    const comparePrice = Math.max(price1, price2);

    if (salePrice >= 5 && salePrice <= 50 && comparePrice <= 60) {
      console.log(`Found OpenCart sale price: $${salePrice}, compare-at: $${comparePrice}`);
      return { price: salePrice, compareAtPrice: comparePrice, currency: "USD", available: true };
    }
  }

  const allPrices = priceSection.match(/\$(\d+(?:\.\d{2})?)/g);
  if (allPrices) {
    const validPrices = allPrices.map((p) => parseFloat(p.replace("$", ""))).filter((p) => p >= 5 && p <= 50);
    if (validPrices.length > 0) {
      console.log(`Found OpenCart single price: $${validPrices[0]}`);
      return { price: validPrices[0], compareAtPrice: null, currency: "USD", available: true };
    }
  }

  console.log("No valid OpenCart price found");
  return { price: null, compareAtPrice: null, currency: "USD", available: false };
}

// Get currency symbol for a given currency code
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    CAD: "CA$",
    GBP: "£",
    EUR: "€",
    AUD: "A$",
    JPY: "¥",
    CNY: "¥",
  };
  return symbols[currency] || "$";
}

// Build regex pattern for a specific currency
function buildCurrencyPricePattern(currency: string): RegExp {
  // Match: €22.99 EUR, $22.99 USD, From €22.99 EUR, etc.
  // Note: Bambu Lab EU format is "From €22.99 EUR" or "€22.99 EUR"
  const symbol = getCurrencySymbol(currency);
  const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Pattern: symbol + price + optional currency code
  // OR: "From" + symbol + price + optional currency code
  return new RegExp(`(?:From\\s*)?${escapedSymbol}\\s*([\\d,]+(?:\\.\\d{2})?)(?:\\s*${currency})?`, "gi");
}

// Split markdown into main product section (before cross-sell/accessory widgets)
function getMainProductSection(markdown: string): string {
  const cutoffPatterns = [
    /(?:frequently\s+bought\s+together|discover\s+more|you\s+may\s+also\s+like|related\s+products|customers\s+also\s+bought|recommended\s+for\s+you)/i,
    /support\s+for\s+\w+.*?\$/i,
    /add\s+to\s+cart/i,
    /カートに追加/i, // Japanese: "Add to Cart"
    /おすすめ商品/i, // Japanese: "Recommended products"
    /一緒に購入/i, // Japanese: "Bought together"
  ];

  let cutoff = markdown.length;
  for (const pattern of cutoffPatterns) {
    const match = markdown.search(pattern);
    if (match > 0 && match < cutoff) {
      cutoff = match;
    }
  }

  // Use at least the first 40% of the page if markers found too early
  const minLength = Math.floor(markdown.length * 0.4);
  if (cutoff < minLength) {
    cutoff = minLength;
  }

  return markdown.substring(0, cutoff);
}

// Parse AzureFilm/EU-style decimal prices (comma decimal separator)
function cleanEuropeanPrice(raw: string): number {
  // Remove currency symbols, whitespace, nbsp and letter currency codes
  let cleaned = raw.replace(/[€$£\s\u00a0]/g, "").replace(/[A-Za-z]/g, "");

  // Simple European decimal: 24,90 → 24.90
  if (/^\d+,\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(",", ".");
  } else if (/\d+\.\d{3},\d{2}/.test(cleaned)) {
    // Thousand + decimal: 1.234,90 → 1234.90
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // Already dot decimal or integer; drop commas as thousand separators
    cleaned = cleaned.replace(/,/g, "");
  }

  return parseFloat(cleaned);
}

// Parse a price string that may use European decimal format (comma as decimal separator)
// Examples: "15,99" → 15.99, "1.299,00" → 1299.00, "15.99" → 15.99, "1,299.00" → 1299.00
function parseEuropeanPrice(raw: string): number {
  if (!raw) return NaN;
  const trimmed = raw.trim();

  // Detect European format: if the last separator is a comma and has exactly 2 digits after it
  // e.g. "15,99" or "1.299,99"
  const europeanMatch = trimmed.match(/^([\d.]*?)(\d+),(\d{2})$/);
  if (europeanMatch) {
    // European format: dots are thousand separators, comma is decimal
    const intPart = (europeanMatch[1] + europeanMatch[2]).replace(/\./g, "");
    return parseFloat(`${intPart}.${europeanMatch[3]}`);
  }

  // Standard format: commas are thousand separators, dot is decimal
  return parseFloat(trimmed.replace(/,/g, ""));
}

function isEuropeanDecimalBrand(url: string): boolean {
  const normalized = url.toLowerCase();
  return EUROPEAN_DECIMAL_BRANDS.some((domain) => normalized.includes(domain));
}

function parsePriceForDomain(raw: string, sourceUrl: string): number {
  if (isEuropeanDecimalBrand(sourceUrl)) {
    return cleanEuropeanPrice(raw);
  }
  return parseEuropeanPrice(raw);
}

// Helper: extract first valid price from matches (by page position, not lowest)
function extractFirstValidPrice(
  matches: RegExpMatchArray[],
  currency: string,
  groupIndex: number = 1,
  altGroupIndex?: number,
): { price: number; compareAt: number | null } | null {
  const prices = matches
    .map((m) => {
      const raw = m[groupIndex] || (altGroupIndex !== undefined ? m[altGroupIndex] : undefined);
      if (!raw) return NaN;
      return parseEuropeanPrice(raw);
    })
    .filter((p) => !isNaN(p) && p > 0 && validateFilamentPrice(p, currency));

  if (prices.length === 0) return null;

  const price = prices[0]; // First by page position
  const compareAt = prices.length > 1 && prices[1] > price * 1.1 ? prices[1] : null;
  return { price, compareAt };
}

// Legacy: Extract price from Bambu Lab and generic stores
function extractBambuLabPrice(
  markdown: string,
  preferredCurrency: string,
): {
  price: number | null;
  compareAtPrice: number | null;
  currency: string;
  available: boolean;
} {
  console.log(`Extracting price from content, preferred currency: ${preferredCurrency}`);

  const upperMarkdown = getMainProductSection(markdown);
  console.log(
    `Main product section: ${upperMarkdown.length} of ${markdown.length} chars (${Math.round((upperMarkdown.length / markdown.length) * 100)}%)`,
  );

  const currencyPatterns = ["EUR", "GBP", "CAD", "USD", "AUD", "JPY"];

  // PRIORITY 1: Look for prices in the preferred currency FIRST
  const preferredSymbol = getCurrencySymbol(preferredCurrency);

  // EUR-specific patterns for Bambu Lab EU store, Extrudr, and WooCommerce (AzureFilm etc.)
  if (preferredCurrency === "EUR") {
    // PRIORITY 0: WooCommerce sale price pattern — strikethrough original + current price
    // Matches: ~~€35,87~~ €26,90  or  ~~€35.87~~ €26.90  or  ~~35,87 €~~ 26,90 €
    const wooSalePatterns = [
      // ~~€OLD~~ €NEW (symbol before price)
      /~~€\s*([\d.,]+)~~\s*€\s*([\d.,]+)/g,
      // ~~OLD €~~ NEW € (symbol after price)
      /~~([\d.,]+)\s*€~~\s*([\d.,]+)\s*€/g,
      // del/strike format from markdown: €OLD ... €NEW on same line
      /€([\d.,]+)\s+€([\d.,]+)/g,
    ];

    for (const pattern of wooSalePatterns) {
      const saleMatches = [...upperMarkdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      if (saleMatches.length > 0) {
        const oldPrice = parseEuropeanPrice(saleMatches[0][1]);
        const newPrice = parseEuropeanPrice(saleMatches[0][2]);
        if (!isNaN(oldPrice) && !isNaN(newPrice) && newPrice > 0 && validateFilamentPrice(newPrice, "EUR")) {
          // The lower price is the sale price, the higher is compare-at
          const salePrice = Math.min(oldPrice, newPrice);
          const compareAt = Math.max(oldPrice, newPrice);
          console.log(`Found EUR WooCommerce sale price: €${salePrice}, compare-at: €${compareAt}`);
          return { price: salePrice, compareAtPrice: compareAt > salePrice * 1.05 ? compareAt : null, currency: "EUR", available: true };
        }
      }
    }

    const eurPatterns = [
      /From\s*€\s*([\d.,]+(?:\.\d{2})?)\s*EUR/gi,
      /€\s*([\d.,]+(?:\.\d{2})?)\s*EUR/gi,
      /€\s*([\d.,]+)/g, // Matches €15,99 and €15.99 (European comma decimal)
      // Extrudr & European stores: number BEFORE € symbol — e.g. "25,76 €" or "25,76 EUR"
      /([\d]+[,.][\d]{2})\s*€/g,
      /([\d]+[,.][\d]{2})\s*EUR/gi,
    ];

    for (const pattern of eurPatterns) {
      // Try upper section first
      const upperMatches = [...upperMarkdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      const upperResult = extractFirstValidPrice(upperMatches, "EUR");
      if (upperResult) {
        console.log(
          `Found EUR price (upper section): €${upperResult.price}${upperResult.compareAt ? `, compare-at: €${upperResult.compareAt}` : ""}`,
        );
        return { price: upperResult.price, compareAtPrice: upperResult.compareAt, currency: "EUR", available: true };
      }

      // Fall back to full page
      const fullMatches = [...markdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      const fullResult = extractFirstValidPrice(fullMatches, "EUR");
      if (fullResult) {
        console.log(
          `Found EUR price (full page): €${fullResult.price}${fullResult.compareAt ? `, compare-at: €${fullResult.compareAt}` : ""}`,
        );
        return { price: fullResult.price, compareAtPrice: fullResult.compareAt, currency: "EUR", available: true };
      }
    }
  }

  // JPY-specific patterns for Bambu Lab JP store
  if (preferredCurrency === "JPY") {
    const jpyPatterns = [
      /[¥￥]\s*([\d,]+)\s*(?:円)?/g, // ¥3,400 円 or ¥3,400 or ￥3,400
      /([\d,]+)\s*円/g, // 3,400円 (number followed by 円)
      /(?:税込|価格|通常価格)[^\d]*?([\d,]+)/g, // 税込価格 3,400 (after price labels)
    ];

    for (const pattern of jpyPatterns) {
      // Try upper section first
      const upperMatches = [...upperMarkdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      const pricesByPosition = upperMatches
        .map((m) => ({
          price: parseFloat((m[1] || "").replace(/,/g, "")),
          index: m.index || 0,
        }))
        .filter((p) => !isNaN(p.price) && p.price > 0 && validateFilamentPrice(p.price, "JPY"))
        .sort((a, b) => a.index - b.index);

      if (pricesByPosition.length > 0) {
        const mainPrice = pricesByPosition[0].price;
        const compareAt =
          pricesByPosition.length > 1 && pricesByPosition[1].price > mainPrice * 1.1 ? pricesByPosition[1].price : null;
        console.log(
          `Found JPY price (upper section): ¥${mainPrice}${compareAt ? `, compare-at: ¥${compareAt}` : ""} (from ${pricesByPosition.length} matches)`,
        );
        return { price: mainPrice, compareAtPrice: compareAt, currency: "JPY", available: true };
      }

      // Fall back to full page
      const fullMatches = [...markdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      const fullByPosition = fullMatches
        .map((m) => ({
          price: parseFloat((m[1] || "").replace(/,/g, "")),
          index: m.index || 0,
        }))
        .filter((p) => !isNaN(p.price) && p.price > 0 && validateFilamentPrice(p.price, "JPY"))
        .sort((a, b) => a.index - b.index);

      if (fullByPosition.length > 0) {
        const mainPrice = fullByPosition[0].price;
        const compareAt =
          fullByPosition.length > 1 && fullByPosition[1].price > mainPrice * 1.1 ? fullByPosition[1].price : null;
        console.log(
          `Found JPY price (full page): ¥${mainPrice}${compareAt ? `, compare-at: ¥${compareAt}` : ""} (from ${fullByPosition.length} matches)`,
        );
        return { price: mainPrice, compareAtPrice: compareAt, currency: "JPY", available: true };
      }
    }

    console.log("No JPY price found with specific patterns, falling through to generic extraction...");
  }

  // GBP-specific patterns
  if (preferredCurrency === "GBP") {
    const gbpPatterns = [
      /From\s*£\s*([\d,]+(?:\.\d{2})?)\s*GBP/gi,
      /£\s*([\d,]+(?:\.\d{2})?)\s*GBP/gi,
      /£\s*([\d,]+(?:\.\d{2})?)/g,
    ];

    for (const pattern of gbpPatterns) {
      const upperMatches = [...upperMarkdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      const upperResult = extractFirstValidPrice(upperMatches, "GBP");
      if (upperResult) {
        console.log(
          `Found GBP price (upper section): £${upperResult.price}${upperResult.compareAt ? `, compare-at: £${upperResult.compareAt}` : ""}`,
        );
        return { price: upperResult.price, compareAtPrice: upperResult.compareAt, currency: "GBP", available: true };
      }

      const fullMatches = [...markdown.matchAll(new RegExp(pattern.source, pattern.flags))];
      const fullResult = extractFirstValidPrice(fullMatches, "GBP");
      if (fullResult) {
        console.log(
          `Found GBP price (full page): £${fullResult.price}${fullResult.compareAt ? `, compare-at: £${fullResult.compareAt}` : ""}`,
        );
        return { price: fullResult.price, compareAtPrice: fullResult.compareAt, currency: "GBP", available: true };
      }
    }
  }

  // Pattern for USD/CAD/AUD with $ symbol and currency code
  if (["USD", "CAD", "AUD"].includes(preferredCurrency)) {
    const dollarWithCodePattern = new RegExp(
      `From\\s*\\$\\s*([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}|\\$\\s*([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}`,
      "gi",
    );

    // Try upper section first
    const upperMatches = [
      ...upperMarkdown.matchAll(new RegExp(dollarWithCodePattern.source, dollarWithCodePattern.flags)),
    ];
    if (upperMatches.length > 0) {
      const prices = upperMatches
        .map((m) => parseFloat((m[1] || m[2]).replace(",", "")))
        .filter((p) => !isNaN(p) && p > 0 && validateFilamentPrice(p, preferredCurrency));
      if (prices.length > 0) {
        const price = prices[0];
        const compareAt = prices.length > 1 && prices[1] > price * 1.1 ? prices[1] : null;
        console.log(
          `Found ${preferredCurrency} price (upper section): $${price}${compareAt ? `, compare-at: $${compareAt}` : ""}`,
        );
        return { price, compareAtPrice: compareAt, currency: preferredCurrency, available: true };
      }
    }

    // Fall back to full page
    const fullMatches = [...markdown.matchAll(new RegExp(dollarWithCodePattern.source, dollarWithCodePattern.flags))];
    if (fullMatches.length > 0) {
      const prices = fullMatches
        .map((m) => parseFloat((m[1] || m[2]).replace(",", "")))
        .filter((p) => !isNaN(p) && p > 0 && validateFilamentPrice(p, preferredCurrency));
      if (prices.length > 0) {
        const price = prices[0];
        const compareAt = prices.length > 1 && prices[1] > price * 1.1 ? prices[1] : null;
        console.log(
          `Found ${preferredCurrency} price (full page): $${price}${compareAt ? `, compare-at: $${compareAt}` : ""}`,
        );
        return { price, compareAtPrice: compareAt, currency: preferredCurrency, available: true };
      }
    }
  }

  // PRIORITY 2: Shopify multi-currency format (legacy)
  const shopifySaleRegex = new RegExp(
    `Sale\\s*price\\s*\\$([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}[^\\d]*Regular\\s*price\\s*\\$([\\d,]+(?:\\.\\d{2})?)\\s*${preferredCurrency}`,
    "i",
  );
  const shopifySaleMatch = markdown.match(shopifySaleRegex);
  if (shopifySaleMatch) {
    const salePrice = parseFloat(shopifySaleMatch[1].replace(",", ""));
    const regularPrice = parseFloat(shopifySaleMatch[2].replace(",", ""));
    console.log(`Found Shopify sale format: $${salePrice} ${preferredCurrency}, regular: $${regularPrice}`);
    return { price: salePrice, compareAtPrice: regularPrice, currency: preferredCurrency, available: true };
  }

  // PRIORITY 3: Try other currencies as fallback
  for (const cur of currencyPatterns) {
    if (cur === preferredCurrency) continue;

    const symbol = getCurrencySymbol(cur);
    const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const fallbackPattern = new RegExp(`${escapedSymbol}\\s*([\\d,]+(?:\\.\\d{2})?)(?:\\s*${cur})?`, "g");

    // Try upper section first
    let upperMatches = [...upperMarkdown.matchAll(new RegExp(fallbackPattern.source, fallbackPattern.flags))];
    let upperResult = extractFirstValidPrice(upperMatches, cur);

    // EUR special: also try number-before-symbol format (e.g. Extrudr: "25,76 €" or "25,76 EUR")
    if (!upperResult && cur === "EUR") {
      const eurReversePatterns = [
        /([\d]+[,.][\d]{2})\s*€/g,
        /([\d]+[,.][\d]{2})\s*EUR/gi,
      ];
      for (const revPat of eurReversePatterns) {
        const revMatches = [...upperMarkdown.matchAll(revPat)];
        upperResult = extractFirstValidPrice(revMatches, "EUR");
        if (upperResult) break;
      }
    }

    if (upperResult) {
      console.log(
        `Found ${cur} price (upper section, fallback): ${symbol}${upperResult.price}${upperResult.compareAt ? `, compare-at: ${symbol}${upperResult.compareAt}` : ""}`,
      );
      return { price: upperResult.price, compareAtPrice: upperResult.compareAt, currency: cur, available: true };
    }

    // Fall back to full page
    let fullMatches = [...markdown.matchAll(new RegExp(fallbackPattern.source, fallbackPattern.flags))];
    let fullResult = extractFirstValidPrice(fullMatches, cur);

    // EUR special: also try number-before-symbol format on full page
    if (!fullResult && cur === "EUR") {
      const eurReversePatterns = [
        /([\d]+[,.][\d]{2})\s*€/g,
        /([\d]+[,.][\d]{2})\s*EUR/gi,
      ];
      for (const revPat of eurReversePatterns) {
        const revMatches = [...markdown.matchAll(revPat)];
        fullResult = extractFirstValidPrice(revMatches, "EUR");
        if (fullResult) break;
      }
    }

    if (fullResult) {
      console.log(
        `Found ${cur} price (full page, fallback): ${symbol}${fullResult.price}${fullResult.compareAt ? `, compare-at: ${symbol}${fullResult.compareAt}` : ""}`,
      );
      return { price: fullResult.price, compareAtPrice: fullResult.compareAt, currency: cur, available: true };
    }
  }

  // PRIORITY 4: Last resort - any price with $ symbol and validation
  // Try upper section first
  const upperDollarPrices = [...upperMarkdown.matchAll(/\$([0-9,]+(?:\.[0-9]{2})?)/g)]
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((p) => validateFilamentPrice(p, "USD"));

  if (upperDollarPrices.length > 0) {
    const price = upperDollarPrices[0];
    const compareAtPrice =
      upperDollarPrices.length > 1 && upperDollarPrices[1] > price * 1.1 ? upperDollarPrices[1] : null;
    console.log(
      `Found generic USD price (upper section): $${price}${compareAtPrice ? `, compare-at: $${compareAtPrice}` : ""}`,
    );
    return { price, compareAtPrice, currency: "USD", available: true };
  }

  // Fall back to full page
  const allDollarPrices = [...markdown.matchAll(/\$([0-9,]+(?:\.[0-9]{2})?)/g)]
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((p) => validateFilamentPrice(p, "USD"));

  if (allDollarPrices.length > 0) {
    const price = allDollarPrices[0];
    const compareAtPrice = allDollarPrices.length > 1 && allDollarPrices[1] > price * 1.1 ? allDollarPrices[1] : null;
    console.log(
      `Found generic USD price (full page): $${price}${compareAtPrice ? `, compare-at: $${compareAtPrice}` : ""}`,
    );
    return { price, compareAtPrice, currency: "USD", available: true };
  }

  console.log("No valid price found in content");
  return { price: null, compareAtPrice: null, currency: preferredCurrency, available: false };
}

// Extract weight from page content
function extractWeightFromContent(markdown: string): number | null {
  const kgMatch = markdown.match(/\b(\d+(?:\.\d+)?)\s*kg\b/i);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);

  const gMatch = markdown.match(/\b(\d{3,4})\s*g(?:ram)?s?\b/i);
  if (gMatch) return Math.round(parseFloat(gMatch[1]));

  return null;
}

// Extract diameter from page content
function extractDiameterFromContent(markdown: string, url: string): number | null {
  const urlMatch = url.match(/[_-](1[.-]75|2[.-]85)/i);
  if (urlMatch) return parseFloat(urlMatch[1].replace("-", "."));

  const contentMatch = markdown.match(/\b(1\.75|2\.85)\s*mm\b/i);
  if (contentMatch) return parseFloat(contentMatch[1]);

  return null;
}

// Fetch price using Firecrawl API
// skipResolution: set to true when called from resolution retry to prevent infinite loops
// productType: 'filament' (default) or 'printer' - affects price validation ranges
async function fetchPriceWithFirecrawl(
  productUrl: string,
  preferredCurrency: string,
  brandConfig?: BrandConfig | null,
  skipResolution = false,
  productType: ProductType = "filament",
): Promise<PriceResponse & { rawSample?: string }> {
  const startTime = Date.now();
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!firecrawlApiKey) {
    console.error("FIRECRAWL_API_KEY not configured");
    return {
      success: false,
      price: null,
      compareAtPrice: null,
      weightGrams: null,
      diameterMm: null,
      variantTitle: null,
      currency: preferredCurrency,
      available: false,
      source: "firecrawl",
      fetchedAt: new Date().toISOString(),
      error: "Firecrawl not configured",
    };
  }

  const location = getFirecrawlLocation(preferredCurrency);

  console.log("=== FIRECRAWL REQUEST ===");
  console.log("URL:", productUrl);
  console.log("Location:", location.country);
  console.log("Currency:", preferredCurrency);
  console.log("Reason:", isGeoRedirectDomain(productUrl) ? "geo-redirect-bypass" : "standard");

  // For Creality stores, disable onlyMainContent as their pricing section is often excluded
  const isCreality = productUrl.includes("store.creality.com");
  // For Prusa, request HTML too so we can extract JSON-LD price data
  // (Prusa hides prices behind a location/ZIP selector that Firecrawl can't interact with,
  //  but JSON-LD in the HTML contains the price for SEO purposes)
  const isPrusa = productUrl.includes("prusa3d.com");
  const useMainContentOnly = !isCreality;

  try {
    const MAX_FIRECRAWL_RETRIES = 2;
    let response: Response | null = null;
    let lastNetworkError: string | null = null;

    for (let attempt = 0; attempt <= MAX_FIRECRAWL_RETRIES; attempt++) {
      try {
        response = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
            body: JSON.stringify({
            url: productUrl,
            formats: (isCreality || isPrusa) ? ["markdown", "html"] : ["markdown"],
            onlyMainContent: useMainContentOnly,
            waitFor: isCreality ? 5000 : isPrusa ? 4000 : 3000,
            location: location,
          }),
        });
        lastNetworkError = null;
      } catch (networkErr) {
        // Network-level errors (TCP connection failures, DNS errors, timeouts)
        const errMsg = networkErr instanceof Error ? networkErr.message : String(networkErr);
        lastNetworkError = errMsg;
        console.error(`Firecrawl network error on attempt ${attempt + 1}/${MAX_FIRECRAWL_RETRIES + 1}: ${errMsg}`);

        if (attempt < MAX_FIRECRAWL_RETRIES) {
          const delayMs = 2000 * (attempt + 1);
          console.log(`Retrying after ${delayMs}ms...`);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        // Exhausted retries on network error
        return {
          success: false,
          price: null,
          compareAtPrice: null,
          weightGrams: null,
          diameterMm: null,
          variantTitle: null,
          currency: preferredCurrency,
          available: false,
          source: "firecrawl",
          fetchedAt: new Date().toISOString(),
          error: `Firecrawl network error: ${errMsg}`,
        };
      }

      if (response.ok) break;

      // Retry on 5xx errors and 408 timeout
      if (attempt < MAX_FIRECRAWL_RETRIES && [408, 500, 502, 503].includes(response.status)) {
        const delayMs = 2000 * (attempt + 1);
        console.log(
          `Firecrawl returned ${response.status}, retrying (${attempt + 1}/${MAX_FIRECRAWL_RETRIES}) after ${delayMs}ms...`,
        );
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      // Final failure or non-retryable error
      const errorText = await response.text();
      console.error(`Firecrawl API error: ${response.status} - ${errorText}`);
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: "firecrawl",
        fetchedAt: new Date().toISOString(),
        error: `Firecrawl error: ${response.status}`,
      };
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || "";
    const metadata = data.data?.metadata || data.metadata || {};
    const sourceURL = metadata.sourceURL || metadata.url || null;

    // Detect URL redirects - Firecrawl returns the final URL after any redirects
    if (sourceURL && sourceURL !== productUrl) {
      console.log(`URL redirect detected: ${productUrl} -> ${sourceURL}`);

      // Attempt to auto-update the product URL if it's a valid redirect
      const updated = await handleUrlRedirect(productUrl, sourceURL);
      if (updated) {
        console.log("Product URL auto-updated from redirect");
      }
    }

    if (!markdown) {
      // Check if the Firecrawl response contains error details (e.g., SSL errors)
      const firecrawlError = data.data?.error || data.error || data.code || "";
      const errorDetail = firecrawlError ? ` (${firecrawlError})` : "";
      console.error(`No markdown content returned from Firecrawl${errorDetail}`);
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: "firecrawl",
        fetchedAt: new Date().toISOString(),
        error: `No content returned${errorDetail}`,
      };
    }

    console.log("=== FIRECRAWL RESPONSE ===");
    console.log("Markdown length:", markdown?.length);
    console.log("First 2000 chars of markdown:", markdown?.substring(0, 2000));
    console.log("Contains $18.99:", markdown?.includes("$18.99"));
    console.log("Contains $24.99:", markdown?.includes("$24.99"));
    console.log("Contains $29.99:", markdown?.includes("$29.99"));
    console.log('Contains "Hyper ABS":', markdown?.includes("Hyper ABS"));
    console.log('Contains "Add to Cart":', markdown?.includes("Add to Cart"));

    // Prusa-specific: detect MK404 location-gate BEFORE generic 404 check.
    // Prusa's Next.js site requires a ZIP/session cookie to serve product pages.
    // Without it, Firecrawl always gets the "MK404" easter-egg page.
    // This is NOT a broken URL — the product exists, it just needs location auth.
    // Treat as notAvailableInRegion so it shows as gray N/A (not red Failed).
    if (isPrusa && (/mk404/i.test(markdown) || /top\s*secret\s*printer/i.test(markdown))) {
      console.log(`[Prusa] MK404 location-gate detected for ${productUrl} — requires ZIP/session cookie`);
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        currency: preferredCurrency,
        available: false,
        source: "firecrawl",
        fetchedAt: new Date().toISOString(),
        error: "LOCATION_GATE",
        notAvailableInRegion: true, // Show as N/A badge, not Failed
      };
    }

    // Check for 404/not found content BEFORE extracting prices
    if (is404Content(markdown)) {
      console.log(`Detected 404 content for: ${productUrl}`);

      // Attempt search resolution unless we're already in a resolution retry
      if (!skipResolution) {
        return await handle404WithResolution(
          productUrl,
          preferredCurrency,
          brandConfig || null,
          "firecrawl",
          "404_content",
        );
      }

      // We're in a resolution retry - just log and return 404
      await logBrokenUrl(productUrl, "404_content");
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: "firecrawl",
        fetchedAt: new Date().toISOString(),
        error: "PRODUCT_PAGE_NOT_FOUND",
        is404: true,
      };
    }

    let priceData: { price: number | null; compareAtPrice: number | null; currency: string; available: boolean };

    // For printers, use dedicated printer extraction with higher price range
    if (productType === "printer") {
      console.log("Using PRINTER extraction (price range $99-$10000)");
      priceData = extractPrinterPrice(markdown, preferredCurrency);
    }
    // Use configured extraction if available and working
    else if (brandConfig && brandConfig.extraction_working && brandConfig.extraction_method !== "auto") {
      console.log(`Using configured extraction for ${brandConfig.brand_name}`);
      const configResult = extractPriceWithConfig(
        markdown,
        brandConfig.price_extraction_config || {},
        brandConfig.default_currency || preferredCurrency,
        urlToFetch,
      );
      priceData = configResult;

      if (configResult.matchedPattern) {
        console.log(`Config extraction matched pattern: ${configResult.matchedPattern}`);
      }
    } else {
      // Legacy extraction logic for filaments
      const isOpenCart = productUrl.includes("geeetech.com");
      const isCreality = productUrl.includes("store.creality.com");

      if (isCreality) {
        // Try JSON-LD extraction first — most reliable for Creality
        const firecrawlHtml = data.data?.html || data.html || "";
        if (firecrawlHtml) {
          const jsonLdMatches = firecrawlHtml.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
          if (jsonLdMatches) {
            for (const scriptTag of jsonLdMatches) {
              try {
                const jsonContent = scriptTag.replace(/<script[^>]*>|<\/script>/gi, "").trim();
                const parsed = JSON.parse(jsonContent);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                const product = items.find((item: any) => item["@type"] === "Product");
                if (product?.offers) {
                  const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
                  const inStockOffers = offers.filter((o: any) => o.price && o.availability?.includes("InStock"));
                  const allOffers = inStockOffers.length > 0 ? inStockOffers : offers.filter((o: any) => o.price);
                  if (allOffers.length > 0) {
                    const prices = allOffers.map((o: any) => parseFloat(o.price)).filter((p: number) => !isNaN(p) && p > 0);
                    if (prices.length > 0) {
                      const lowestPrice = Math.min(...prices);
                      const detectedCurrency = allOffers[0].priceCurrency || preferredCurrency;
                      const highestPrice = Math.max(...prices);
                      const compareAt = highestPrice > lowestPrice * 1.1 ? highestPrice : null;
                      console.log(`✓ Creality JSON-LD extraction: price=${lowestPrice} ${detectedCurrency}, compareAt=${compareAt}, offers=${allOffers.length}`);
                      return {
                        success: true,
                        price: lowestPrice,
                        compareAtPrice: compareAt,
                        weightGrams: null,
                        diameterMm: null,
                        variantTitle: null,
                        currency: detectedCurrency,
                        available: inStockOffers.length > 0,
                        source: "firecrawl" as const,
                        fetchedAt: new Date().toISOString(),
                      };
                    }
                  }
                }
              } catch (e) {
                console.log("JSON-LD parse attempt failed, continuing to markdown extraction");
              }
            }
          }
        }
        // JSON-LD not found or failed — fall back to markdown extraction
        priceData = extractCrealityPrice(markdown, preferredCurrency);
      } else if (isPrusa) {
        // Prusa hides prices behind a location/ZIP selector. Try JSON-LD then __NEXT_DATA__ from HTML.
        let firecrawlHtml = data.data?.html || data.html || "";
        // Strip zero-width characters that can corrupt JSON parsing
        firecrawlHtml = firecrawlHtml.replace(/[\u200B-\u200D\u200C\uFEFF]/g, "");
        let prusaResolved = false;
        if (firecrawlHtml) {
          const jsonLdMatches = firecrawlHtml.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
          if (jsonLdMatches) {
            for (const scriptTag of jsonLdMatches) {
              try {
                const jsonContent = scriptTag.replace(/<script[^>]*>|<\/script>/gi, "").trim();
                const parsed = JSON.parse(jsonContent);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                const product = items.find((item: any) => item["@type"] === "Product");
                if (product?.offers) {
                  const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
                  const validOffers = offers.filter((o: any) => o.price && parseFloat(o.price) > 0);
                  if (validOffers.length > 0) {
                    const prices = validOffers.map((o: any) => parseFloat(o.price)).filter((p: number) => !isNaN(p) && validateFilamentPrice(p, preferredCurrency));
                    if (prices.length > 0) {
                      const lowestPrice = Math.min(...prices);
                      const detectedCurrency = validOffers[0].priceCurrency || preferredCurrency;
                      const inStockOffers = validOffers.filter((o: any) => o.availability?.includes("InStock"));
                      console.log(`✓ Prusa JSON-LD price: ${lowestPrice} ${detectedCurrency}, inStock=${inStockOffers.length > 0}`);
                      priceData = {
                        price: lowestPrice,
                        compareAtPrice: null,
                        currency: detectedCurrency,
                        available: inStockOffers.length > 0,
                      };
                      prusaResolved = true;
                      break;
                    }
                  }
                }
              } catch (_) { /* continue */ }
            }
          }
        }
        // __NEXT_DATA__ extraction: Prusa embeds pricing in a Next.js data script tag
        if (!prusaResolved && firecrawlHtml) {
          try {
            // Match the __NEXT_DATA__ script tag (handles both quoted and unquoted id attributes)
            const nextDataMatch = firecrawlHtml.match(/<script[^>]*id=["']?__NEXT_DATA__["']?[^>]*>([\s\S]*?)<\/script>/i);
            if (nextDataMatch?.[1]) {
              const nextData = JSON.parse(nextDataMatch[1].trim());
              const urqlState = nextData?.props?.pageProps?.urqlState;
              if (urqlState && typeof urqlState === "object") {
                for (const key of Object.keys(urqlState)) {
                  const entry = urqlState[key];
                  if (!entry?.data) continue;
                  try {
                    // The data field is a JSON string — parse it
                    const innerData = typeof entry.data === "string" ? JSON.parse(entry.data) : entry.data;
                    const product = innerData?.product;
                    if (product?.price?.priceWithVat !== undefined) {
                      const rawPrice = parseFloat(product.price.priceWithVat);
                      if (!isNaN(rawPrice) && rawPrice > 0) {
                        const availName: string = product?.availability?.name ?? "";
                        const available = /in\s*stock/i.test(availName);
                        // Prusa always prices in EUR regardless of region requested
                        priceData = {
                          price: rawPrice,
                          compareAtPrice: null,
                          currency: "EUR",
                          available,
                        };
                        prusaResolved = true;
                        console.log(`Prusa __NEXT_DATA__ extraction: price=${rawPrice} EUR, available=${available} (availName="${availName}")`);
                        break;
                      }
                    }
                  } catch (_) { /* skip unparseable entries */ }
                  if (prusaResolved) break;
                }
              }
            }
          } catch (e) {
            console.log("Prusa __NEXT_DATA__ parse failed:", e instanceof Error ? e.message : String(e));
          }
        }
        if (!prusaResolved) {
          console.log("Prusa JSON-LD extraction failed, falling back to markdown extraction (no JSON-LD or __NEXT_DATA__ found)");
          priceData = extractBambuLabPrice(markdown, preferredCurrency);
        }
      } else if (isOpenCart) {
        priceData = extractOpenCartPrice(markdown);
      } else {
        priceData = extractBambuLabPrice(markdown, preferredCurrency);
      }
    }

    const weightGrams = extractWeightFromContent(markdown);
    const diameterMm = extractDiameterFromContent(markdown, productUrl);
    const responseTimeMs = Date.now() - startTime;

    // Log extraction attempt
    await logExtractionAttempt(
      brandConfig?.id || null,
      brandConfig?.brand_slug || null,
      productUrl,
      brandConfig?.extraction_method || "legacy",
      priceData.price !== null,
      priceData.price,
      priceData.currency,
      priceData.price === null ? "Could not extract price" : null,
      markdown.substring(0, 500),
      responseTimeMs,
    );

    if (priceData.price === null) {
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams,
        diameterMm,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: "firecrawl",
        fetchedAt: new Date().toISOString(),
        error: "Could not extract price from page",
        rawSample: markdown.substring(0, 500),
      };
    }

    // Check stock availability from page content (in addition to price extraction)
    const stockStatus = detectStockStatus(markdown);
    const isSoldOut = stockStatus === "out_of_stock";
    const available = priceData.available && !isSoldOut;

    console.log(
      `Firecrawl price extracted: ${priceData.price} ${priceData.currency} (compare: ${priceData.compareAtPrice}, available: ${available}, stockStatus: ${stockStatus})`,
    );

    return {
      success: true,
      price: priceData.price,
      compareAtPrice: priceData.compareAtPrice,
      weightGrams,
      diameterMm,
      variantTitle: null,
      currency: priceData.currency,
      available: available,
      stockStatus: isSoldOut
        ? "out_of_stock"
        : stockStatus !== "unknown"
          ? stockStatus
          : available
            ? "in_stock"
            : "out_of_stock",
      source: "firecrawl",
      fetchedAt: new Date().toISOString(),
      rawSample: markdown.substring(0, 500),
    };
  } catch (error) {
    console.error("Firecrawl fetch error:", error);
    return {
      success: false,
      price: null,
      compareAtPrice: null,
      weightGrams: null,
      diameterMm: null,
      variantTitle: null,
      currency: preferredCurrency,
      available: false,
      source: "firecrawl",
      fetchedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Parse weight from variant title
function parseWeightFromTitle(title: string): number | null {
  if (!title) return null;

  const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);

  const gMatch = title.match(/(\d+(?:\.\d+)?)\s*g(?:ram)?s?(?!\w)/i);
  if (gMatch) return Math.round(parseFloat(gMatch[1]));

  const lbMatch = title.match(/(\d+(?:\.\d+)?)\s*lb/i);
  if (lbMatch) return Math.round(parseFloat(lbMatch[1]) * 453.592);

  return null;
}

// ===== SMART VARIANT SELECTION =====
// Prefer consumer-sized spools (750g-1500g) over bulk (10kg) or samples (100g)

/** Preferred weight range for consumer spools (in grams) */
const PREFERRED_MIN_WEIGHT = 750;
const PREFERRED_MAX_WEIGHT = 1500;
const ACCEPTABLE_MAX_WEIGHT = 5500; // Up to 5kg spools are acceptable

interface VariantWithWeight {
  variant: ShopifyVariant;
  weightGrams: number | null;
}

/**
 * Select the best variant based on weight preference.
 * Priority: 1) ~1kg variants (750g-1500g), 2) acceptable range (up to 5.5kg), 3) first available
 */
function selectBestVariantByWeight(
  variants: ShopifyVariant[],
  productTitle: string,
  targetWeightGrams: number | null = null,
): ShopifyVariant {
  // Parse weights for all available variants
  const variantsWithWeights: VariantWithWeight[] = variants
    .filter((v) => v.available !== false) // Include available or unknown availability
    .map((v) => ({
      variant: v,
      weightGrams: parseWeightFromTitle(v.title) || (v.grams && v.grams >= 250 && v.grams <= 15000 ? v.grams : null),
    }));

  console.log(
    "Variant weights:",
    variantsWithWeights.map((vw) => `"${vw.variant.title}" → ${vw.weightGrams}g, $${vw.variant.price}`).join(" | "),
  );

  // Priority 0: If target weight provided from database, find exact match first
  if (targetWeightGrams !== null && targetWeightGrams > 0) {
    const tolerance = targetWeightGrams * 0.1; // 10% tolerance
    const exactMatch = variantsWithWeights.find(
      (vw) => vw.weightGrams !== null && Math.abs(vw.weightGrams - targetWeightGrams) <= tolerance,
    );
    if (exactMatch) {
      console.log(
        `✓ Exact weight match: "${exactMatch.variant.title}" (${exactMatch.weightGrams}g ≈ ${targetWeightGrams}g target)`,
      );
      return exactMatch.variant;
    }
    console.log(`No exact match for ${targetWeightGrams}g target, falling back to priority system`);
  }

  // Priority 1: Find variants in preferred range (750g-1500g, typical 1kg spool)
  const preferredVariants = variantsWithWeights.filter(
    (vw) => vw.weightGrams !== null && vw.weightGrams >= PREFERRED_MIN_WEIGHT && vw.weightGrams <= PREFERRED_MAX_WEIGHT,
  );

  if (preferredVariants.length > 0) {
    // Pick the one closest to 1000g
    preferredVariants.sort((a, b) => Math.abs(a.weightGrams! - 1000) - Math.abs(b.weightGrams! - 1000));
    console.log(
      `✓ Selected preferred variant: "${preferredVariants[0].variant.title}" (${preferredVariants[0].weightGrams}g)`,
    );
    return preferredVariants[0].variant;
  }

  // Priority 2: Find variants in acceptable range (up to 5.5kg) but not bulk
  const acceptableVariants = variantsWithWeights.filter(
    (vw) => vw.weightGrams !== null && vw.weightGrams >= 250 && vw.weightGrams <= ACCEPTABLE_MAX_WEIGHT,
  );

  if (acceptableVariants.length > 0) {
    // Pick the smallest acceptable weight (prefer smaller over bulk)
    acceptableVariants.sort((a, b) => a.weightGrams! - b.weightGrams!);
    console.log(
      `✓ Selected acceptable variant: "${acceptableVariants[0].variant.title}" (${acceptableVariants[0].weightGrams}g)`,
    );
    return acceptableVariants[0].variant;
  }

  // Priority 3: Fallback to first available variant (original behavior)
  const availableVariant = variants.find((v) => v.available);
  const fallback = availableVariant || variants[0];
  console.log(`⚠ No weight-matched variant found, using fallback: "${fallback.title}"`);
  return fallback;
}

// Parse pack quantity from product content
function parsePackQuantity(title: string, content?: string): number {
  const textToSearch = `${title} ${content || ""}`;

  const packMatch = textToSearch.match(/(\d+)\s*(?:pcs?|pack|rolls?|spools?|pieces?|x\s*\d)/i);
  if (packMatch) {
    const qty = parseInt(packMatch[1]);
    if (qty > 1 && qty <= 100) return qty;
  }

  return 1;
}

// Parse diameter from URL or title
function parseDiameter(url: string, title: string): number | null {
  const urlDashMatch = url.match(/[_-](1[.-]75|2[.-]85|3[.-]00?)/i);
  if (urlDashMatch) {
    const normalized = urlDashMatch[1].replace("-", ".").replace(",", ".");
    return parseFloat(normalized);
  }

  const titleMmMatch = title?.match(/(1\.75|2\.85|3\.00?)\s*mm/i);
  if (titleMmMatch) return parseFloat(titleMmMatch[1]);

  const titleDiamMatch = title?.match(/\b(1\.75|2\.85|3\.00?)\b/);
  if (titleDiamMatch) return parseFloat(titleDiamMatch[1]);

  return null;
}

// Detect platform from URL
function detectPlatform(url: string): "shopify" | "unknown" {
  const shopifyIndicators = ["/products/", ".myshopify.com", "cdn.shopify.com"];

  for (const indicator of shopifyIndicators) {
    if (url.includes(indicator)) return "shopify";
  }

  return "unknown";
}

// Get Shopify JSON URL from product URL
function getShopifyJsonUrl(url: string): string {
  const cleanUrl = url.split("?")[0].split("#")[0];
  return cleanUrl.endsWith(".json") ? cleanUrl : `${cleanUrl}.json`;
}

// Extract variant ID from URL query parameter
function extractVariantIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("variant") || null;
  } catch {
    const match = url.match(/[?&]variant=(\d+)/);
    return match ? match[1] : null;
  }
}

// Detect currency from URL domain
function detectCurrencyFromUrl(url: string): string {
  const urlLower = url.toLowerCase();

  if (urlLower.includes(".ca") || urlLower.includes("ca.")) return "CAD";
  if (urlLower.includes(".co.uk") || urlLower.includes("uk.")) return "GBP";
  if (urlLower.includes(".eu") || urlLower.includes(".de") || urlLower.includes(".fr") || urlLower.includes(".it"))
    return "EUR";
  if (urlLower.includes(".au") || urlLower.includes("au.")) return "AUD";
  if (urlLower.includes(".jp") || urlLower.includes("jp.")) return "JPY";

  return "USD";
}

// Fetch price from Shopify JSON API
async function fetchShopifyPrice(
  productUrl: string,
  preferredCurrency: string,
  targetWeightGrams: number | null = null,
): Promise<PriceResponse & { fetchMethod?: FetchMethod }> {
  const jsonUrl = getShopifyJsonUrl(productUrl);
  console.log(`Fetching Shopify JSON from: ${jsonUrl}`);

  // Determine target region from currency for geo-bypass headers
  const regionFromCurrency: Record<string, string> = {
    CAD: "CA",
    GBP: "UK",
    EUR: "EU",
    AUD: "AU",
    JPY: "JP",
  };
  const targetRegion = regionFromCurrency[preferredCurrency] || "US";
  const isKnownGeoRedirector = isGeoRedirectDomain(productUrl);

  try {
    // Build region-aware headers for Shopify JSON API
    const regionHeaders = getRegionHeaders(targetRegion);
    const headers: Record<string, string> = {
      ...regionHeaders,
      Accept: "application/json", // Override to request JSON
    };

    let response: Response;
    let fetchMethod: FetchMethod = "direct";

    if (isKnownGeoRedirector) {
      // Method 1: Try with region headers, manual redirect handling
      console.log(`[GeoBypass] Shopify fetch using region headers for ${targetRegion}`);
      response = await fetch(jsonUrl, { headers, redirect: "manual" });

      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.get("location") || "";
        const fullRedirect = redirectUrl.startsWith("/") ? `${new URL(jsonUrl).origin}${redirectUrl}` : redirectUrl;

        if (isGeoRedirect(jsonUrl, fullRedirect)) {
          console.log(`[GeoBypass] Geo-redirect detected: ${jsonUrl} → ${fullRedirect}, trying spoofed headers`);
          await response.text().catch(() => {}); // consume body

          // Method 2: Spoofed headers
          const spoofedHeaders = { ...getSpoofedHeaders(targetRegion), Accept: "application/json" };
          response = await fetch(jsonUrl, { headers: spoofedHeaders, redirect: "manual" });
          fetchMethod = "spoofed";

          if (response.status >= 300 && response.status < 400) {
            console.log(`[GeoBypass] Spoofed headers still redirected, following redirect`);
            await response.text().catch(() => {});
            response = await fetch(jsonUrl, { headers, redirect: "follow" });
            fetchMethod = "redirected";
          }
        } else {
          // Legitimate redirect, follow it
          await response.text().catch(() => {});
          response = await fetch(fullRedirect, { headers });
        }
      }
    } else {
      response = await fetch(jsonUrl, { headers });
    }

    if (!response.ok) {
      console.error(`Shopify fetch failed: ${response.status} ${response.statusText}`);

      // Check for 404 specifically - attempt search resolution
      if (response.status === 404) {
        console.log(`Detected 404 for Shopify product: ${productUrl}`);
        return await handle404WithResolution(productUrl, preferredCurrency, null, "shopify", "404_http");
      }

      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: "shopify",
        fetchedAt: new Date().toISOString(),
        error: `HTTP ${response.status}`,
      };
    }

    const data: ShopifyProduct = await response.json();

    if (!data.product?.variants?.length) {
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: preferredCurrency,
        available: false,
        source: "shopify",
        fetchedAt: new Date().toISOString(),
        error: "No variants found",
      };
    }

    const requestedVariantId = extractVariantIdFromUrl(productUrl);
    let variant: ShopifyVariant;

    if (requestedVariantId) {
      const matchedVariant = data.product.variants.find((v) => String(v.id) === requestedVariantId);
      if (matchedVariant) {
        variant = matchedVariant;
        console.log(`Found requested variant ${requestedVariantId}: "${variant.title}"`);
      } else {
        console.log(`Requested variant ${requestedVariantId} not found, using smart weight selection`);
        variant = selectBestVariantByWeight(data.product.variants, data.product.title, targetWeightGrams);
      }
    } else {
      // No variant ID specified - use smart weight-based selection
      // This prevents picking bulk sizes (10kg @ $450) over consumer sizes (1kg @ $50)
      console.log(`No variant ID in URL, using smart weight selection for ${data.product.variants.length} variants`);
      variant = selectBestVariantByWeight(data.product.variants, data.product.title, targetWeightGrams);
    }

    const price = parseFloat(variant.price);
    const compareAtPrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;

    const weightFromVariantTitle = parseWeightFromTitle(variant.title);
    const weightFromProductTitle = parseWeightFromTitle(data.product.title);
    const isReasonableGrams = variant.grams && variant.grams >= 250 && variant.grams <= 3000;
    let singleSpoolWeight =
      weightFromVariantTitle || weightFromProductTitle || (isReasonableGrams ? variant.grams : null) || null;

    const packQuantity = parsePackQuantity(data.product.title, variant.title);
    const weightGrams = singleSpoolWeight !== null ? singleSpoolWeight * packQuantity : null;

    console.log(
      `Weight extraction: variant="${variant.title}", product="${data.product.title}", singleSpool=${singleSpoolWeight}g, packQty=${packQuantity}, total=${weightGrams}g`,
    );

    const diameterMm = parseDiameter(productUrl, variant.title) || parseDiameter(productUrl, data.product.title);
    const detectedCurrency = detectCurrencyFromUrl(productUrl);

    console.log(
      `Shopify price fetched: ${price} ${detectedCurrency} (weight: ${weightGrams}g, diameter: ${diameterMm}mm, available: ${variant.available})`,
    );

    return {
      success: true,
      price,
      compareAtPrice,
      weightGrams,
      diameterMm,
      variantTitle: variant.title,
      currency: detectedCurrency,
      available: variant.available,
      source: "shopify",
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Shopify fetch error:", error);
    return {
      success: false,
      price: null,
      compareAtPrice: null,
      weightGrams: null,
      diameterMm: null,
      variantTitle: null,
      currency: preferredCurrency,
      available: false,
      source: "shopify",
      fetchedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Browser-like headers for Creality fetches
const CREALITY_BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// Helper: try to extract a valid price from Creality HTML (JSON-LD only)
function extractCrealityPriceFromHtml(html: string, expectedCurrency: string, sourceUrl: string): PriceResponse | null {
  const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const product = items.find((item: any) => item["@type"] === "Product");
      if (product?.offers) {
        const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
        const inStockOffers = offers.filter((o: any) =>
          o.price != null && String(o.availability || "").includes("InStock")
        );
        const validOffers = inStockOffers.length > 0 ? inStockOffers : offers.filter((o: any) => o.price != null);
        if (validOffers.length > 0) {
          const prices = validOffers
            .map((o: any) => parseFloat(String(o.price)))
            .filter((p: number) => !isNaN(p) && p > 0);
          if (prices.length > 0) {
            const lowestPrice = Math.min(...prices);
            const highestPrice = Math.max(...prices);
            const compareAt = highestPrice > lowestPrice * 1.1 ? highestPrice : null;
            const detectedCurrency = validOffers[0].priceCurrency || expectedCurrency;
            return {
              success: true,
              price: lowestPrice,
              compareAtPrice: compareAt,
              weightGrams: null,
              diameterMm: null,
              variantTitle: null,
              currency: detectedCurrency,
              available: inStockOffers.length > 0,
              stockStatus: inStockOffers.length > 0 ? "in_stock" as StockStatus : "out_of_stock" as StockStatus,
              source: "html" as const,
              fetchedAt: new Date().toISOString(),
              detectedCurrency,
              sourceUrl,
            };
          }
        }
      }
    } catch (_e) {
      // ignore parse errors, try next script tag
    }
  }
  return null;
}

// Generate slug variants for Creality regional slug discovery
function generateCrealitySlugVariants(originalSlug: string): string[] {
  const variants = new Set<string>();
  // Always try original first (will be skipped since it already 404'd)
  variants.add(originalSlug);

  // Strip weight/diameter suffixes
  const weightStripped = originalSlug
    .replace(/-3kg\b/gi, "")
    .replace(/-1kg\b/gi, "")
    .replace(/-500g\b/gi, "")
    .replace(/-1-75mm\b/gi, "")
    .replace(/-175mm\b/gi, "")
    .replace(/-1\.75mm\b/gi, "")
    .replace(/-trailing-dashes?$/i, "")
    .replace(/-+$/, "");

  if (weightStripped !== originalSlug) variants.add(weightStripped);

  // Strip "-3d-printing-filament" and any weight suffix after it
  const filamentPhraseRegex = /-3d-printing-filament(?:-\w+)*/gi;
  const withoutFilamentPhrase = originalSlug.replace(filamentPhraseRegex, "").replace(/-+$/, "");
  if (withoutFilamentPhrase !== originalSlug) {
    variants.add(withoutFilamentPhrase);
    // Also try stripping weight from the filament-phrase-stripped version
    const withoutFilamentAndWeight = withoutFilamentPhrase
      .replace(/-3kg\b/gi, "")
      .replace(/-1kg\b/gi, "")
      .replace(/-500g\b/gi, "")
      .replace(/-1-75mm\b/gi, "")
      .replace(/-+$/, "");
    if (withoutFilamentAndWeight !== withoutFilamentPhrase) {
      variants.add(withoutFilamentAndWeight);
    }
  }

  // Weight-stripped then filament-phrase-stripped
  const weightThenPhrase = weightStripped.replace(filamentPhraseRegex, "").replace(/-+$/, "");
  if (weightThenPhrase !== weightStripped && weightThenPhrase !== withoutFilamentPhrase) {
    variants.add(weightThenPhrase);
  }

  // Toggle "creality-" prefix for each candidate
  const candidates = Array.from(variants);
  for (const slug of candidates) {
    if (slug.startsWith("creality-")) {
      variants.add(slug.slice("creality-".length));
    } else {
      variants.add(`creality-${slug}`);
    }
  }

  // Return all candidates except the original (it already failed)
  return Array.from(variants).filter(s => s !== originalSlug && s.length > 3);
}

// Attempt to discover a working Creality regional slug by trying variants
async function attemptCrealitySlugDiscovery(
  baseUrl: string,         // e.g. "https://store.creality.com/ca"
  originalSlug: string,    // e.g. "hyper-series-pla-3d-printing-filament-1kg"
  expectedCurrency: string,
  filamentId: string | null,
  regionCode: string,
): Promise<PriceResponse | null> {
  console.log(`[SLUG DISCOVERY] Starting for slug: ${originalSlug}, region: ${regionCode}`);

  // 1. Check slug cache in DB first (if we have a filamentId)
  if (filamentId) {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(supabaseUrl, serviceRoleKey);

      const { data: cached } = await adminClient
        .from("product_regional_slugs")
        .select("slug, verified, http_status")
        .eq("filament_id", filamentId)
        .eq("region_code", regionCode)
        .maybeSingle();

      if (cached?.verified && cached.slug && cached.slug !== originalSlug) {
        console.log(`[SLUG DISCOVERY] Found cached slug: ${cached.slug}, trying it first`);
        const testUrl = `${baseUrl}/products/${cached.slug}`;
        try {
          const resp = await fetch(testUrl, { headers: CREALITY_BROWSER_HEADERS, redirect: "follow", signal: AbortSignal.timeout(5000) });
          if (resp.ok) {
            const html = await resp.text();
            const isSoft404 = html.includes("Oops! Page not found") || html.includes("page you requested does not exist") || html.includes("Page Not Found") || html.includes("template-404");
            if (!isSoft404) {
              const priceResult = extractCrealityPriceFromHtml(html, expectedCurrency, testUrl);
              if (priceResult) {
                console.log(`[SLUG DISCOVERY] ✓ Cached slug worked: ${cached.slug} → ${priceResult.price} ${priceResult.currency}`);
                return priceResult;
              }
            }
          }
        } catch (_e) {
          console.log(`[SLUG DISCOVERY] Cached slug fetch failed, continuing with variants`);
        }
      }
    } catch (e) {
      console.log(`[SLUG DISCOVERY] Cache lookup failed (non-fatal): ${e}`);
    }
  }

  // 2. Try generated slug variants
  const variants = generateCrealitySlugVariants(originalSlug);
  console.log(`[SLUG DISCOVERY] Trying ${variants.length} slug variants: [${variants.slice(0, 5).join(", ")}${variants.length > 5 ? "..." : ""}]`);

  for (const candidateSlug of variants) {
    const testUrl = `${baseUrl}/products/${candidateSlug}`;
    console.log(`[SLUG DISCOVERY] Trying: ${testUrl}`);
    try {
      const resp = await fetch(testUrl, { headers: CREALITY_BROWSER_HEADERS, redirect: "follow", signal: AbortSignal.timeout(5000) });
      if (!resp.ok) {
        console.log(`[SLUG DISCOVERY] HTTP ${resp.status} for ${candidateSlug}, skipping`);
        continue;
      }
      const html = await resp.text();
      const isSoft404 = html.includes("Oops! Page not found") || html.includes("page you requested does not exist") || html.includes("Page Not Found") || html.includes("template-404");
      if (isSoft404) {
        console.log(`[SLUG DISCOVERY] Soft 404 for ${candidateSlug}, skipping`);
        continue;
      }
      const priceResult = extractCrealityPriceFromHtml(html, expectedCurrency, testUrl);
      if (priceResult) {
        console.log(`[SLUG DISCOVERY] ✓ Found working slug: ${candidateSlug} → ${priceResult.price} ${priceResult.currency}`);

        // 3. Cache the discovered slug
        if (filamentId) {
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const adminClient = createClient(supabaseUrl, serviceRoleKey);
            await adminClient.from("product_regional_slugs").upsert({
              filament_id: filamentId,
              region_code: regionCode,
              slug: candidateSlug,
              verified: true,
              http_status: 200,
              verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: "filament_id,region_code" });
            console.log(`[SLUG DISCOVERY] ✓ Cached slug ${candidateSlug} for filament ${filamentId} / region ${regionCode}`);
          } catch (e) {
            console.log(`[SLUG DISCOVERY] Cache write failed (non-fatal): ${e}`);
          }
        }

        return priceResult;
      }
      console.log(`[SLUG DISCOVERY] Page loaded but no valid JSON-LD for ${candidateSlug}`);
    } catch (_e) {
      console.log(`[SLUG DISCOVERY] Fetch error for ${candidateSlug}: ${_e}`);
    }
  }

  console.log(`[SLUG DISCOVERY] No working slug found for ${originalSlug} in ${regionCode}`);
  return null;
}

// ===== EXTRUDR DIRECT FETCH =====
// Extrudr pages carry rich JSON-LD (schema.org/Product) with exact EUR price.
// URL structure: /en/{region}/products/{slug}/
// If no region code is present we insert /de/ to get stable pricing (no geo-redirect).
const EXTRUDR_REGION_CODES = ["de", "at", "gb", "fr", "it", "es", "nl", "pl", "cz", "eu", "ch"];

function normalizeExtrudrUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname; // e.g. /en/products/biofusion/ or /en/de/products/biofusion/

    // Check if a region code is already present: /en/{region}/products/
    const alreadyRegional = EXTRUDR_REGION_CODES.some(
      (r) => path.includes(`/en/${r}/products/`),
    );
    if (alreadyRegional) return url;

    // Insert /de/ between /en/ and /products/
    const fixed = path.replace(/\/en\/products\//i, "/en/de/products/");
    if (fixed !== path) {
      urlObj.pathname = fixed;
      const normalized = urlObj.toString();
      console.log(`[EXTRUDR FETCH] URL normalized: ${url} -> ${normalized}`);
      return normalized;
    }
  } catch (_) { /* ignore */ }
  return url;
}

async function fetchExtrudrPriceDirect(
  productUrl: string,
  expectedCurrency: string,
): Promise<PriceResponse> {
  // Always use EUR for Extrudr (EUR-only brand)
  const resolvedCurrency = "EUR";
  const canonicalUrl = normalizeExtrudrUrl(productUrl);

  console.log(`[EXTRUDR FETCH] Fetching: ${canonicalUrl} (expected currency: ${resolvedCurrency})`);

  try {
    const response = await fetch(canonicalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    console.log(`[EXTRUDR FETCH] HTTP ${response.status}, final URL: ${response.url}`);

    if (!response.ok) {
      return {
        success: false, price: null, compareAtPrice: null, weightGrams: null,
        diameterMm: null, variantTitle: null, currency: resolvedCurrency,
        available: false, source: "html", fetchedAt: new Date().toISOString(),
        error: `HTTP ${response.status}`,
      };
    }

    const html = await response.text();
    console.log(`[EXTRUDR FETCH] HTML size: ${html.length} bytes, has JSON-LD: ${html.includes("application/ld+json")}`);

    // Parse all JSON-LD script tags
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let scriptMatch;
    while ((scriptMatch = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(scriptMatch[1].trim());
        const items: any[] = Array.isArray(parsed) ? parsed : [parsed];
        const product = items.find((item: any) => item["@type"] === "Product");
        if (!product?.offers) continue;

        const offers: any[] = Array.isArray(product.offers) ? product.offers : [product.offers];
        const inStockOffers = offers.filter(
          (o: any) => o.price != null && String(o.availability || "").toLowerCase().includes("instock"),
        );
        const validOffers = inStockOffers.length > 0 ? inStockOffers : offers.filter((o: any) => o.price != null);

        if (validOffers.length === 0) continue;

        const prices = validOffers
          .map((o: any) => parseFloat(String(o.price)))
          .filter((p: number) => !isNaN(p) && p > 0);

        if (prices.length === 0) continue;

        const lowestPrice = Math.min(...prices);
        const highestPrice = Math.max(...prices);
        const compareAt = highestPrice > lowestPrice * 1.1 ? highestPrice : null;
        const detectedCurrency = (validOffers[0].priceCurrency as string) || resolvedCurrency;
        const available = inStockOffers.length > 0;

        console.log(
          `[EXTRUDR FETCH] ✓ JSON-LD: price=${lowestPrice} ${detectedCurrency}, compareAt=${compareAt}, inStock=${available}`,
        );

        return {
          success: true,
          price: lowestPrice,
          compareAtPrice: compareAt,
          weightGrams: null,
          diameterMm: null,
          variantTitle: null,
          currency: detectedCurrency,
          available,
          stockStatus: available ? "in_stock" : ("out_of_stock" as StockStatus),
          source: "html" as const,
          fetchedAt: new Date().toISOString(),
          detectedCurrency,
          sourceUrl: canonicalUrl,
        };
      } catch (_e) {
        // ignore parse errors, try next script tag
      }
    }

    console.log("[EXTRUDR FETCH] ❌ No valid JSON-LD Product found on page");
    return {
      success: false, price: null, compareAtPrice: null, weightGrams: null,
      diameterMm: null, variantTitle: null, currency: resolvedCurrency,
      available: false, source: "html", fetchedAt: new Date().toISOString(),
      error: "Could not extract price from Extrudr page JSON-LD",
    };
  } catch (error) {
    console.error("[EXTRUDR FETCH] Error:", error);
    return {
      success: false, price: null, compareAtPrice: null, weightGrams: null,
      diameterMm: null, variantTitle: null, currency: resolvedCurrency,
      available: false, source: "html", fetchedAt: new Date().toISOString(),
      error: `Fetch error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ===== TREED FILAMENTS PRICE FETCH (TreeD Direct API) =====
// TreeD Filaments exposes a backend JSON API at web-gateway.treedfilaments.com.
// Prices are returned as EUR cents per kg; we calculate per-spool price using targetWeightGrams.

async function fetchTreeDPrice(productUrl: string, targetWeightGrams?: number | null): Promise<PriceResponse> {
  // Extract SKU from query parameter
  let sku: string | null = null;
  try {
    const u = new URL(productUrl);
    // Use raw search string to preserve literal '+' characters (URLSearchParams decodes '+' as space)
    const rawSku = u.search.match(/[?&]sku=([^&]+)/)?.[1];
    sku = rawSku ? decodeURIComponent(rawSku) : u.searchParams.get("sku");
    if (sku) sku = sku.trim();
  } catch {
    sku = null;
  }

  if (!sku) {
    console.log("[TREED] No SKU found in URL:", productUrl);
    return {
      success: false, price: null, compareAtPrice: null, weightGrams: null,
      diameterMm: null, variantTitle: null, currency: "EUR",
      available: false, source: "html" as const,
      fetchedAt: new Date().toISOString(),
      error: "No SKU parameter in TreeD URL",
      sourceUrl: productUrl, requestedCurrency: "EUR",
    };
  }

  console.log(`[TREED] Fetching SKU=${sku}, targetWeight=${targetWeightGrams}g`);

  try {
    const apiResp = await fetch("https://web-gateway.treedfilaments.com/v1/product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://treedfilaments.com",
        "Referer": "https://treedfilaments.com/shop/product/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({ sku, email: "", token: "" }),
      signal: AbortSignal.timeout(15000),
    });

    console.log(`[TREED] API HTTP ${apiResp.status}`);

    if (!apiResp.ok) {
      return {
        success: false, price: null, compareAtPrice: null, weightGrams: null,
        diameterMm: null, variantTitle: null, currency: "EUR",
        available: false, source: "html" as const,
        fetchedAt: new Date().toISOString(),
        error: `TreeD API returned HTTP ${apiResp.status}`,
        sourceUrl: productUrl, requestedCurrency: "EUR",
      };
    }

    const d = await apiResp.json() as {
      price?: number; discount?: number; name?: string;
      weights?: number[]; d175?: boolean; d285?: boolean;
    };

    // API price is EUR cents per kg
    const pricePerKgEur = (d.price ?? 0) / 100;
    const firstWeight = d.weights?.[0] ?? 1000;
    const weightG = (targetWeightGrams && targetWeightGrams > 0) ? targetWeightGrams : firstWeight;
    const spoolPrice = Math.round(pricePerKgEur * (weightG / 1000) * 100) / 100;
    const discount = d.discount ?? 0;
    const compareAt = discount > 0
      ? Math.round(((d.price! + discount) / 100) * (weightG / 1000) * 100) / 100
      : null;

    console.log(`[TREED] ${d.name} pricePerKg=€${pricePerKgEur} weight=${weightG}g spool=€${spoolPrice}`);

    return {
      success: true,
      price: spoolPrice,
      compareAtPrice: compareAt,
      weightGrams: weightG,
      diameterMm: d.d175 ? 1.75 : (d.d285 ? 2.85 : null),
      variantTitle: d.name || sku,
      currency: "EUR",
      available: true,
      stockStatus: "in_stock" as StockStatus,
      source: "html" as const,
      fetchedAt: new Date().toISOString(),
      detectedCurrency: "EUR",
      sourceUrl: productUrl,
      requestedCurrency: "EUR",
    };
  } catch (err) {
    console.error("[TREED] Error:", err);
    return {
      success: false, price: null, compareAtPrice: null, weightGrams: null,
      diameterMm: null, variantTitle: null, currency: "EUR",
      available: false, source: "html" as const,
      fetchedAt: new Date().toISOString(),
      error: `TreeD fetch error: ${err instanceof Error ? err.message : String(err)}`,
      sourceUrl: productUrl, requestedCurrency: "EUR",
    };
  }
}

// ===== END TREED FILAMENTS DIRECT API =====

// Direct fetch + JSON-LD extraction for Creality (Firecrawl returns empty for store.creality.com)

async function fetchCrealityPriceDirect(
  productUrl: string,
  expectedCurrency: string,
  filamentId?: string | null,
  regionCode?: string | null,
): Promise<PriceResponse> {
  console.log(`Fetching Creality price directly: ${productUrl} (expected currency: ${expectedCurrency})`);

  // Helper to attempt slug discovery when original URL fails
  const trySlugDiscovery = async (reason: string): Promise<PriceResponse> => {
    if (!regionCode) {
      // No region context — can't attempt discovery
      console.log(`[CREALITY FETCH] No regionCode — skipping slug discovery (reason: ${reason})`);
      return {
        success: false, price: null, compareAtPrice: null, weightGrams: null,
        diameterMm: null, variantTitle: null, currency: expectedCurrency,
        available: false, source: "html", fetchedAt: new Date().toISOString(),
        error: "Product not available in this region (HTTP 404)",
        notAvailableInRegion: true,
      };
    }

    console.log(`[CREALITY FETCH] Product not found at regional URL (${reason}), attempting slug discovery`);

    // Extract base URL (e.g. "https://store.creality.com/ca") and slug from productUrl
    const urlObj = new URL(productUrl);
    const pathParts = urlObj.pathname.split("/products/");
    const baseUrl = urlObj.origin + (pathParts[0] || "");
    const originalSlug = pathParts[1]?.split("?")[0] || "";

    if (!originalSlug) {
      console.log(`[CREALITY FETCH] Could not extract slug from URL: ${productUrl}`);
      return {
        success: false, price: null, compareAtPrice: null, weightGrams: null,
        diameterMm: null, variantTitle: null, currency: expectedCurrency,
        available: false, source: "html", fetchedAt: new Date().toISOString(),
        error: "Product not available in this region",
        notAvailableInRegion: true,
      };
    }

    const discovered = await attemptCrealitySlugDiscovery(baseUrl, originalSlug, expectedCurrency, filamentId ?? null, regionCode);
    if (discovered) return discovered;

    return {
      success: false, price: null, compareAtPrice: null, weightGrams: null,
      diameterMm: null, variantTitle: null, currency: expectedCurrency,
      available: false, source: "html", fetchedAt: new Date().toISOString(),
      error: "Product not available in this region (HTTP 404)",
      notAvailableInRegion: true,
    };
  };

  try {
    const response = await fetch(productUrl, {
      headers: CREALITY_BROWSER_HEADERS,
      redirect: "follow",
    });

    console.log(`[CREALITY FETCH] Response: HTTP ${response.status}, redirected: ${response.redirected}, final URL: ${response.url}`);

    if (!response.ok) {
      console.error(`[CREALITY FETCH] Direct fetch failed: HTTP ${response.status}`);
      if (response.status === 404) {
        return await trySlugDiscovery("HTTP 404");
      }
      return {
        success: false, price: null, compareAtPrice: null, weightGrams: null,
        diameterMm: null, variantTitle: null, currency: expectedCurrency,
        available: false, source: "html", fetchedAt: new Date().toISOString(),
        error: `HTTP ${response.status}`, is404: false,
      };
    }

    const html = await response.text();
    console.log(`[CREALITY FETCH] HTML size: ${html.length} bytes, has JSON-LD: ${html.includes("application/ld+json")}`);

    // Detect soft 404 (Creality returns HTTP 200 for missing pages)
    if (
      html.includes("Oops! Page not found") ||
      html.includes("page you requested does not exist") ||
      html.includes("Page Not Found") ||
      html.includes("template-404")
    ) {
      console.log(`[CREALITY FETCH] ⚠️ Soft 404 detected for: ${productUrl}`);
      return await trySlugDiscovery("soft 404");
    }

    // Extract JSON-LD using shared helper
    const priceResult = extractCrealityPriceFromHtml(html, expectedCurrency, productUrl);
    if (priceResult) {
      console.log(`✓ Creality JSON-LD: $${priceResult.price} ${priceResult.currency}`);
      return priceResult;
    }

    // Fallback: try to extract price from HTML text if JSON-LD failed
    console.log("No JSON-LD product data found, attempting HTML price extraction");
    const priceMatch = html.match(/"price"\s*:\s*(\d+\.?\d*)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      if (price > 0 && price < 500) {
        console.log(`Creality HTML regex fallback: ${price}`);
        return {
          success: true, price, compareAtPrice: null, weightGrams: null,
          diameterMm: null, variantTitle: null, currency: expectedCurrency,
          available: true, source: "html" as const, fetchedAt: new Date().toISOString(),
        };
      }
    }

    return {
      success: false, price: null, compareAtPrice: null, weightGrams: null,
      diameterMm: null, variantTitle: null, currency: expectedCurrency,
      available: false, source: "html", fetchedAt: new Date().toISOString(),
      error: "No price found in Creality page JSON-LD or HTML",
    };
  } catch (error) {
    console.error("Creality direct fetch error:", error);
    return {
      success: false, price: null, compareAtPrice: null, weightGrams: null,
      diameterMm: null, variantTitle: null, currency: expectedCurrency,
      available: false, source: "html", fetchedAt: new Date().toISOString(),
      error: `Fetch error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      productUrl,
      currency = "USD",
      forceRefresh = false,
      targetWeightGrams = null,
      productType = "filament",
      filamentId = null,
    } = await req.json();

    // Derive region code from currency for slug discovery
    const regionCode: string = ({
      USD: "US", CAD: "CA", GBP: "UK", EUR: "EU", AUD: "AU", JPY: "JP",
    } as Record<string, string>)[currency] ?? "US";

    if (!productUrl) {
      return new Response(JSON.stringify({ error: "productUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(
      `Getting current price for: ${productUrl} (preferred currency: ${currency}${forceRefresh ? ", FORCE REFRESH" : ""})`,
    );

    // Transform URL to regional store if applicable
    const { url: regionalUrl, expectedCurrency, transformed } = transformToRegionalUrl(productUrl, currency);
    const urlToFetch = regionalUrl;

    if (transformed) {
      console.log(`Transformed to regional URL: ${urlToFetch} (expected currency: ${expectedCurrency})`);
    }

    // Rate limit check for manual refresh
    if (forceRefresh) {
      const canRefresh = await canForceRefresh(productUrl);
      if (!canRefresh) {
        console.log("Rate limited: manual refresh already performed for this URL in last minute");
        return new Response(
          JSON.stringify({
            success: false,
            error: "Rate limited: Please wait at least 1 minute between manual refreshes for this product",
            price: null,
            compareAtPrice: null,
            weightGrams: null,
            diameterMm: null,
            variantTitle: null,
            currency,
            available: false,
            source: "firecrawl",
            fetchedAt: new Date().toISOString(),
            requestedCurrency: currency,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.log("Manual refresh rate limit check passed");
    }

    // Look up brand config from database
    const brandConfig = await findBrandConfigByUrl(urlToFetch);
    if (brandConfig) {
      console.log(
        `Found brand config: ${brandConfig.brand_name} (method: ${brandConfig.extraction_method}, working: ${brandConfig.extraction_working})`,
      );

      // If brand extraction is marked as not working, log and continue with fallback
      if (!brandConfig.extraction_working) {
        console.log(`Brand ${brandConfig.brand_name} extraction marked as not working, using fallback`);
      }
    }

    const startTime = Date.now();

    // Check for custom storefronts first (they don't support Shopify JSON)
    // Check both the transformed URL and the original productUrl in case transformation obscured the domain
    const customStorefront = detectCustomStorefront(urlToFetch) || detectCustomStorefront(productUrl);
    let result: PriceResponse;

    if (customStorefront === "extrudr") {
      console.log(`[EXTRUDR ROUTING] ✓ Direct JSON-LD fetch path selected`);
      result = await fetchExtrudrPriceDirect(urlToFetch, expectedCurrency);
      // Extrudr is EUR-only — normalise the currency response so the caller
      // receives EUR even when it requested USD (currencyMismatch handled below)
    } else if (customStorefront === "woocommerce") {
      console.log(`[WOOCOMMERCE ROUTING] ✓ Direct WooCommerce JSON-LD fetch path selected`);
      result = await fetchWooCommercePriceDirect(urlToFetch, expectedCurrency);
    } else if (customStorefront === "treed") {
      // TreeD Filaments — uses direct backend API (web-gateway.treedfilaments.com)
      console.log(`[TREED ROUTING] ✓ TreeD Direct API path selected`);
      result = await fetchTreeDPrice(urlToFetch, targetWeightGrams);
      // TreeD is EUR-only — always return EUR regardless of requested currency
    } else if (customStorefront === "creality") {
      console.log(`[CREALITY ROUTING] ✓ Direct fetch path selected`);
      console.log(`[CREALITY ROUTING] Original URL: ${productUrl}`);
      console.log(`[CREALITY ROUTING] Transformed URL: ${urlToFetch}`);
      console.log(`[CREALITY ROUTING] Expected currency: ${expectedCurrency}`);
      console.log(`[CREALITY ROUTING] Was transformed: ${transformed}`);
      result = await fetchCrealityPriceDirect(urlToFetch, expectedCurrency, filamentId, regionCode);
    } else if (customStorefront) {
      console.log(`[ROUTING] Custom storefront: ${customStorefront}, using Firecrawl`);
      console.log(`[ROUTING] URL: ${urlToFetch}, currency: ${expectedCurrency}`);
      result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
    } else if (urlToFetch.toLowerCase().includes("creality") || productUrl.toLowerCase().includes("creality")) {
      console.log(`[CREALITY ROUTING] ⚠️ Creality URL detected but not caught by detectCustomStorefront!`);
      console.log(`[CREALITY ROUTING] urlToFetch: ${urlToFetch}`);
      console.log(`[CREALITY ROUTING] productUrl: ${productUrl}`);
      console.log(`[CREALITY ROUTING] Forcing direct fetch path`);
      result = await fetchCrealityPriceDirect(urlToFetch, expectedCurrency, filamentId, regionCode);
    } else if (shouldAlwaysUseFirecrawl(urlToFetch)) {
      console.log(`Store has unreliable JSON API, using Firecrawl for accurate pricing (productType: ${productType})`);
      result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
    } else if (isGeoRedirectDomain(urlToFetch) && expectedCurrency !== "USD") {
      console.log(
        `Geo-redirect domain with ${expectedCurrency}, using Firecrawl directly (productType: ${productType})`,
      );
      result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
    } else if (brandConfig && brandConfig.extraction_method === "firecrawl") {
      // Brand config explicitly requests Firecrawl
      console.log(`Brand config requests Firecrawl extraction (productType: ${productType})`);
      result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
    } else {
      // Try Shopify JSON API for standard stores
      const platform = detectPlatform(urlToFetch);

      if (platform === "shopify") {
        const isMultiCurrency = isMultiCurrencyShopifyStore(urlToFetch);

        if (isMultiCurrency && currency !== "USD") {
          console.log(
            `Multi-currency Shopify store detected (${currency} requested), using Firecrawl (productType: ${productType})`,
          );
          result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
        } else {
          result = await fetchShopifyPrice(urlToFetch, expectedCurrency, targetWeightGrams);

          if (!result.success) {
            console.log(`Shopify failed, trying Firecrawl as fallback... (productType: ${productType})`);
            result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
          }
        }
      } else {
        console.log(`Unknown platform, trying Firecrawl... (productType: ${productType})`);
        result = await fetchPriceWithFirecrawl(urlToFetch, expectedCurrency, brandConfig, false, productType);
      }
    }

    // Add currency validation metadata to response
    result.sourceUrl = urlToFetch;
    result.requestedCurrency = currency;

    // Check for currency mismatch
    if (result.success && result.currency !== expectedCurrency) {
      result.currencyMismatch = true;
      result.detectedCurrency = result.currency;
      console.log(`⚠️ Currency mismatch: expected ${expectedCurrency} but got ${result.currency}`);
    } else if (result.success) {
      result.currencyMismatch = false;
      result.detectedCurrency = result.currency;
    }

    // Update database with fresh stock status if successful (async, non-blocking)
    if (result.success) {
      // Fire and forget - don't block the response
      updateFilamentStockStatus(
        productUrl, // Use original URL for DB lookup
        result.available,
        result.stockStatus || (result.available ? "in_stock" : "out_of_stock"),
        result.price,
        result.currency, // Pass currency so correct regional price column is updated
      ).catch((err) => console.error("Background stock update failed:", err));
    }

    // Log manual refresh and add refreshedAt to response
    if (forceRefresh) {
      const responseTimeMs = Date.now() - startTime;
      await logExtractionAttempt(
        brandConfig?.id || null,
        brandConfig?.brand_slug || null,
        urlToFetch,
        "manual_refresh",
        result.success,
        result.price,
        result.currency,
        result.error || null,
        null,
        responseTimeMs,
      );

      // Add refreshedAt to response
      if (result.success) {
        result.refreshedAt = new Date().toISOString();
      }
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in get-current-price:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: "USD",
        available: false,
        source: "firecrawl",
        fetchedAt: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
