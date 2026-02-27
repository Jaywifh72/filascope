/**
 * SHARED DIRECT STOREFRONT EXTRACTORS
 * Creality, Extrudr, TreeD, Prusa, Geeetech — direct HTML fetch + JSON-LD.
 */

import type { PriceResponse } from "./price-types.ts";
import { withTimeout } from "./price-timeout.ts";
import { is404Content } from "./price-utils.ts";
import { extractJsonLdPrice } from "./price-extract-jsonld.ts";
import { getSupabaseClient } from "./price-db.ts";
import { normalizeCrealityUrl, CURRENCY_TO_REGION } from "./price-regional.ts";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const TIMEOUT_MS = 8000;
const fail = (currency: string, error: string, extra?: Partial<PriceResponse>): PriceResponse => ({
  success: false, price: null, compareAtPrice: null, currency, available: false,
  source: "html", fetchedAt: new Date().toISOString(), error, ...extra,
});

// ============================================================
// CREALITY
// ============================================================

function generateSlugVariants(slug: string): string[] {
  const v = new Set<string>();
  v.add(slug);
  const stripped = slug.replace(/-3kg\b/gi, "").replace(/-1kg\b/gi, "").replace(/-500g\b/gi, "")
    .replace(/-1-75mm\b/gi, "").replace(/-175mm\b/gi, "").replace(/-+$/, "");
  if (stripped !== slug) v.add(stripped);
  const noFilament = slug.replace(/-3d-printing-filament(?:-\w+)*/gi, "").replace(/-+$/, "");
  if (noFilament !== slug) v.add(noFilament);
  const arr = Array.from(v);
  for (const s of arr) {
    if (s.startsWith("creality-")) v.add(s.slice(9));
    else v.add(`creality-${s}`);
  }
  return Array.from(v).filter(s => s !== slug && s.length > 3);
}

async function crealitySlugDiscovery(
  baseUrl: string, originalSlug: string, expectedCurrency: string,
  filamentId: string | null, regionCode: string,
): Promise<PriceResponse | null> {
  if (filamentId) {
    try {
      const sb = getSupabaseClient();
      const { data: cached } = await sb.from("product_regional_slugs").select("slug, verified")
        .eq("filament_id", filamentId).eq("region_code", regionCode).maybeSingle();
      if (cached?.verified && cached.slug && cached.slug !== originalSlug) {
        const testUrl = `${baseUrl}/products/${cached.slug}`;
        try {
          const resp = await withTimeout(fetch(testUrl, { headers: BROWSER_HEADERS, redirect: "follow" }), TIMEOUT_MS);
          if (resp.ok) {
            const html = await resp.text();
            if (!html.includes("Page not found") && !html.includes("template-404")) {
              const r = extractJsonLdPrice(html, expectedCurrency, testUrl);
              if (r) return { success: true, ...r, source: "html", fetchedAt: new Date().toISOString(), sourceUrl: testUrl };
            }
          }
        } catch (_) { /* continue */ }
      }
    } catch (_) { /* non-fatal */ }
  }

  for (const slug of generateSlugVariants(originalSlug)) {
    const testUrl = `${baseUrl}/products/${slug}`;
    try {
      const resp = await withTimeout(fetch(testUrl, { headers: BROWSER_HEADERS, redirect: "follow" }), TIMEOUT_MS);
      if (!resp.ok) continue;
      const html = await resp.text();
      if (html.includes("Page not found") || html.includes("template-404")) continue;
      const r = extractJsonLdPrice(html, expectedCurrency, testUrl);
      if (r) {
        if (filamentId) {
          try {
            const sb = getSupabaseClient();
            await sb.from("product_regional_slugs").upsert({
              filament_id: filamentId, region_code: regionCode, slug,
              verified: true, http_status: 200,
              verified_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            }, { onConflict: "filament_id,region_code" });
          } catch (_) { /* non-fatal */ }
        }
        return { success: true, ...r, source: "html", fetchedAt: new Date().toISOString(), sourceUrl: testUrl };
      }
    } catch (_) { /* continue */ }
  }
  return null;
}

export async function fetchCrealityPrice(
  productUrl: string, expectedCurrency: string, filamentId?: string | null,
): Promise<PriceResponse> {
  const url = normalizeCrealityUrl(productUrl);
  try {
    const resp = await withTimeout(fetch(url, { headers: BROWSER_HEADERS, redirect: "follow" }), TIMEOUT_MS);
    if (resp.status === 404 || !resp.ok) {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/products/");
      if (pathParts.length >= 2) {
        const slug = pathParts[1].replace(/\//g, "");
        const basePath = urlObj.pathname.replace(/\/products\/.*$/, "");
        const baseUrl = `${urlObj.origin}${basePath}`;
        const rc = CURRENCY_TO_REGION[expectedCurrency] || "US";
        const discovered = await crealitySlugDiscovery(baseUrl, slug, expectedCurrency, filamentId || null, rc);
        if (discovered) return discovered;
      }
      return fail(expectedCurrency, `HTTP ${resp.status}`, { is404: resp.status === 404 });
    }
    const html = await resp.text();
    if (is404Content(html)) return fail(expectedCurrency, "soft_404", { is404: true });
    const r = extractJsonLdPrice(html, expectedCurrency, url);
    if (r) return { success: true, ...r, source: "html", fetchedAt: new Date().toISOString(), sourceUrl: url };
    return fail(expectedCurrency, "No JSON-LD price found");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(expectedCurrency, msg === "TIMEOUT" ? "timeout" : msg);
  }
}

// ============================================================
// EXTRUDR
// ============================================================

const EXTRUDR_REGIONS = ["de", "at", "gb", "fr", "it", "es", "nl", "pl", "cz", "eu", "ch", "inlt"];

function normalizeExtrudrUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname;
    const hasRegion = EXTRUDR_REGIONS.some(r => path.match(new RegExp(`/en/${r}/`, "i")));
    if (!hasRegion && path.startsWith("/en/")) { u.pathname = path.replace(/^\/en\//, "/en/de/"); return u.toString(); }
    if (!path.startsWith("/en/")) { u.pathname = "/en/de" + path; return u.toString(); }
  } catch (_) { /* ignore */ }
  return url;
}

export async function fetchExtrudrPrice(productUrl: string, expectedCurrency?: string): Promise<PriceResponse> {
  const currency = expectedCurrency || "EUR";
  const url = normalizeExtrudrUrl(productUrl);
  try {
    const resp = await withTimeout(fetch(url, { headers: BROWSER_HEADERS, redirect: "follow" }), TIMEOUT_MS);
    if (!resp.ok) return fail(currency, `HTTP ${resp.status}`, { is404: resp.status === 404 });

    const html = await resp.text();
    if (is404Content(html)) return fail(currency, "soft_404", { is404: true });

    const r = extractJsonLdPrice(html, currency, url);
    if (r) return { success: true, ...r, source: "html", fetchedAt: new Date().toISOString(), sourceUrl: url };

    return fail(currency, "No JSON-LD price");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(currency, msg === "TIMEOUT" ? "timeout" : msg);
  }
}

// ============================================================
// TREED
// ============================================================

export async function fetchTreeDPrice(productUrl: string): Promise<PriceResponse> {
  try {
    const urlObj = new URL(productUrl);
    let searchTerm = urlObj.pathname.split("/").pop() || "";
    searchTerm = searchTerm.replace(/-/g, " ");
    const apiUrl = `https://web-gateway.treedfilaments.com/s/search?q=${encodeURIComponent(searchTerm)}`;
    const resp = await withTimeout(fetch(apiUrl, {
      headers: { "User-Agent": BROWSER_HEADERS["User-Agent"], Accept: "application/json", Origin: "https://treedfilaments.com", Referer: "https://treedfilaments.com/" },
    }), TIMEOUT_MS);
    if (!resp.ok) return fail("EUR", `API ${resp.status}`);
    const data = await resp.json();
    const products = data?.hits || data?.products || [];
    if (products.length === 0) return fail("EUR", "No products found");
    const product = products[0];
    const priceCents = product.price || product.salePrice;
    if (!priceCents) return fail("EUR", "No price in API");
    const price = priceCents / 100;
    const compareAt = product.listPrice ? product.listPrice / 100 : null;
    return {
      success: true, price,
      compareAtPrice: compareAt && compareAt > price * 1.05 ? compareAt : null,
      currency: "EUR", available: product.inStock !== false,
      stockStatus: product.inStock !== false ? "in_stock" : "out_of_stock",
      source: "html", fetchedAt: new Date().toISOString(), sourceUrl: productUrl,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail("EUR", msg === "TIMEOUT" ? "timeout" : msg);
  }
}

// ============================================================
// PRUSA
// ============================================================

export async function fetchPrusaPrice(productUrl: string): Promise<PriceResponse> {
  try {
    const resp = await withTimeout(fetch(productUrl, { headers: BROWSER_HEADERS, redirect: "follow" }), TIMEOUT_MS);
    if (!resp.ok) return fail("EUR", `HTTP ${resp.status}`);
    const html = await resp.text();
    if (/mk404/i.test(html) || /top\s*secret\s*printer/i.test(html)) {
      return fail("EUR", "LOCATION_GATE", { notAvailableInRegion: true });
    }
    const r = extractJsonLdPrice(html, "EUR", productUrl);
    if (r) return { success: true, ...r, source: "html", fetchedAt: new Date().toISOString(), sourceUrl: productUrl };
    // __NEXT_DATA__ fallback
    const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextMatch) {
      try {
        const nd = JSON.parse(nextMatch[1]);
        const price = nd?.props?.pageProps?.product?.price || nd?.props?.pageProps?.price;
        if (price && typeof price === "number" && price > 0) {
          return { success: true, price, compareAtPrice: null, currency: "EUR", available: true, source: "html", fetchedAt: new Date().toISOString(), sourceUrl: productUrl };
        }
      } catch (_) { /* ignore */ }
    }
    return fail("EUR", "No price found");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail("EUR", msg === "TIMEOUT" ? "timeout" : msg);
  }
}

// ============================================================
// GEEETECH
// ============================================================

export async function fetchGeeetechPrice(productUrl: string): Promise<PriceResponse> {
  try {
    const resp = await withTimeout(fetch(productUrl, { headers: BROWSER_HEADERS, redirect: "follow" }), TIMEOUT_MS);
    if (!resp.ok) return fail("USD", `HTTP ${resp.status}`, { is404: resp.status === 404 });
    const html = await resp.text();
    if (is404Content(html)) return fail("USD", "soft_404", { is404: true });

    // 1. Try JSON-LD first
    const r = extractJsonLdPrice(html, "USD", productUrl);
    if (r) return { success: true, ...r, source: "html", fetchedAt: new Date().toISOString(), sourceUrl: productUrl };

    // 2. HTML extraction for Zen Cart: sale price in .products-info-price-special, MSRP in .products-info-price-normal
    const saleMatch = html.match(/products-info-price-special[^>]*>\s*\$\s*([\d]+(?:[.,]\d+)?)/);
    const msrpMatch = html.match(/products-info-price-normal[^>]*>\s*\$\s*([\d]+(?:[.,]\d+)?)/);

    const salePrice = saleMatch ? parseFloat(saleMatch[1].replace(",", "")) : null;
    const msrpPrice = msrpMatch ? parseFloat(msrpMatch[1].replace(",", "")) : null;

    // Use sale price if available, otherwise fall back to MSRP
    const price = salePrice ?? msrpPrice;
    if (price && price > 0 && price < 500) {
      const compareAtPrice = salePrice && msrpPrice && msrpPrice > salePrice * 1.05 ? msrpPrice : null;
      return {
        success: true, price, compareAtPrice, currency: "USD", available: true,
        stockStatus: "in_stock", source: "html", fetchedAt: new Date().toISOString(), sourceUrl: productUrl,
      };
    }

    return fail("USD", "No price found in JSON-LD or HTML");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail("USD", msg === "TIMEOUT" ? "timeout" : msg);
  }
}

// ============================================================
// BIGCOMMERCE (Gizmo Dorks etc.)
// ============================================================

export async function fetchBigCommercePrice(productUrl: string, expectedCurrency: string = "USD"): Promise<PriceResponse> {
  try {
    const resp = await withTimeout(fetch(productUrl, { headers: BROWSER_HEADERS, redirect: "follow" }), TIMEOUT_MS);
    if (!resp.ok) return fail(expectedCurrency, `HTTP ${resp.status}`, { is404: resp.status === 404 });
    const html = await resp.text();
    if (is404Content(html)) return fail(expectedCurrency, "soft_404", { is404: true });

    // 1. Try JSON-LD (BigCommerce embeds Product structured data)
    const r = extractJsonLdPrice(html, expectedCurrency, productUrl);
    if (r) return { success: true, ...r, source: "html", fetchedAt: new Date().toISOString(), sourceUrl: productUrl };

    // 2. HTML regex fallback — look for price in common BigCommerce selectors
    const priceMatch = html.match(/class="price\s+price--withoutTax[^"]*"[^>]*>\s*\$\s*([\d]+(?:[.,]\d+)?)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(",", ""));
      if (price > 0 && price < 500) {
        return {
          success: true, price, compareAtPrice: null, currency: expectedCurrency, available: true,
          stockStatus: "in_stock", source: "html", fetchedAt: new Date().toISOString(), sourceUrl: productUrl,
        };
      }
    }

    return fail(expectedCurrency, "No price found in JSON-LD or HTML");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(expectedCurrency, msg === "TIMEOUT" ? "timeout" : msg);
  }
}
