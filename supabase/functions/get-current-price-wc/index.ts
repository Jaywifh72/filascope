// Lightweight WooCommerce price extraction for AzureFilm and similar EU stores
// Bypasses Cloudflare via WC Store API v1
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WC_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

const PRICE_RANGE = { min: 5, max: 200 };
const PER_PRODUCT_TIMEOUT = 8000;

// Known WooCommerce store currencies
const WC_STORE_CURRENCIES: Record<string, string> = {
  "azurefilm.com": "EUR",
};

function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function extractSlug(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/product/");
    if (parts.length < 2) return null;
    return parts[1].replace(/\//g, "").trim() || null;
  } catch { return null; }
}

function isCloudflareBlock(html: string): boolean {
  return html.includes("cf-browser-verification") || html.includes("Just a moment");
}

async function fetchWithTimeout(url: string, opts: RequestInit = {}): Promise<Response> {
  return await Promise.race([
    fetch(url, opts),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("TIMEOUT")), PER_PRODUCT_TIMEOUT)),
  ]) as Response;
}

// PRIMARY: WC Store API v1
async function wcStoreApi(productUrl: string, domain: string) {
  const slug = extractSlug(productUrl);
  if (!slug) return null;

  const apiUrl = `https://${domain}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}`;
  console.log(`[WC] GET ${apiUrl}`);

  try {
    let res = await fetchWithTimeout(apiUrl, { headers: WC_HEADERS });

    // 429 retry once
    if (res.status === 429) {
      console.log("[WC] 429 rate limited, retrying in 2s...");
      await new Promise(r => setTimeout(r, 2000));
      res = await fetchWithTimeout(apiUrl, { headers: WC_HEADERS });
      if (res.status === 429) return { error: "rate_limited", status: "rate_limited" };
    }

    if (res.status === 404) return null; // fall through to JSON-LD

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (isCloudflareBlock(body)) return { error: "cloudflare_blocked", status: "blocked" };
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // WC Store API may return both variations and parent products for the same slug.
    // Prefer the parent "variable" product (type=variable, parent=0) to get min price range,
    // then fetch its variations for cheapest in-stock variant.
    // If no parent found, fall back to first item.
    const parentProduct = data.find((p: any) => p.type === "variable" && p.parent === 0);
    const product = parentProduct || data.find((p: any) => p.type === "simple") || data[0];
    console.log(`[WC] Selected product type=${product.type}, id=${product.id}, parent=${product.parent}, name=${product.name}`);

    return await parseProduct(product, productUrl, domain);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "TIMEOUT") {
      console.log(`[WC] Timeout for slug: ${slug}`);
      return { error: "timeout", status: "timeout" };
    }
    console.error("[WC] Error:", msg);
    return null;
  }
}

async function parseProduct(product: any, productUrl: string, domain: string) {
  const prices = product?.prices;
  if (!prices?.price) return null;

  const minorUnit = Number.isFinite(Number(prices.currency_minor_unit)) ? Number(prices.currency_minor_unit) : 2;
  const divisor = Math.pow(10, minorUnit);
  const rawPrice = parseInt(prices.price, 10);
  const rawRegular = parseInt(prices.regular_price || prices.price, 10);
  const rawSale = prices.sale_price ? parseInt(prices.sale_price, 10) : null;

  if (isNaN(rawPrice) || rawPrice <= 0) return null;

  const currency = String(prices.currency_code || "EUR").toUpperCase();
  let price = rawPrice / divisor;
  let compareAt: number | null = null;

  if (rawSale !== null && !isNaN(rawSale) && rawSale > 0 && rawSale < rawRegular) {
    price = rawSale / divisor;
    compareAt = rawRegular / divisor;
  } else if (!isNaN(rawRegular) && rawRegular > rawPrice) {
    compareAt = rawRegular / divisor;
  }

  if (!Number.isFinite(price) || price <= 0) return null;

  let available = product.is_in_stock === true;
  let method = "wc_store_api";

  // Variable products: fetch variations for cheapest in-stock
  if (product.type === "variable" && product.id) {
    const variation = await fetchVariations(Number(product.id), domain, minorUnit);
    if (variation && variation.price > 0) {
      price = variation.price;
      compareAt = variation.compareAt;
      available = variation.available;
      method = "wc_store_api_variations";
    }
  }

  const priceAlert = price < PRICE_RANGE.min || price > PRICE_RANGE.max;
  const currencyAlert = domain.includes("azurefilm.com") && currency !== "EUR";

  return {
    success: true,
    price,
    compareAtPrice: compareAt && compareAt > price * 1.05 ? compareAt : null,
    currency,
    available,
    stockStatus: available ? "in_stock" : "out_of_stock",
    source: "woocommerce",
    method,
    status: priceAlert || currencyAlert ? "anomalous" : "ok",
    price_alert: priceAlert,
    sourceUrl: productUrl,
  };
}

async function fetchVariations(productId: number, domain: string, minorUnit: number) {
  const url = `https://${domain}/wp-json/wc/store/v1/products/${productId}/variations`;
  try {
    const res = await fetchWithTimeout(url, { headers: WC_HEADERS });
    if (!res.ok) return null;
    const variations: any[] = await res.json();
    if (!Array.isArray(variations) || variations.length === 0) return null;

    const divisor = Math.pow(10, minorUnit);
    let cheapest: { price: number; compareAt: number | null; available: boolean } | null = null;

    for (const v of variations) {
      const p = v?.prices;
      if (!p?.price) continue;
      const raw = parseInt(p.price, 10);
      if (isNaN(raw) || raw <= 0) continue;
      const vPrice = raw / divisor;
      const inStock = v.is_in_stock !== false;
      const rawReg = parseInt(p.regular_price || p.price, 10);
      const cmp = !isNaN(rawReg) && rawReg > raw ? rawReg / divisor : null;

      if (inStock && (!cheapest || vPrice < cheapest.price)) {
        cheapest = { price: vPrice, compareAt: cmp, available: true };
      } else if (!cheapest && !inStock) {
        cheapest = { price: vPrice, compareAt: cmp, available: false };
      }
    }
    return cheapest;
  } catch { return null; }
}

// FALLBACK: JSON-LD from product page HTML
async function jsonLdFallback(productUrl: string, domain: string) {
  try {
    let res = await fetchWithTimeout(productUrl, {
      headers: { "User-Agent": WC_HEADERS["User-Agent"], "Accept-Language": WC_HEADERS["Accept-Language"] },
      redirect: "follow",
    });

    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 2000));
      res = await fetchWithTimeout(productUrl, {
        headers: { "User-Agent": WC_HEADERS["User-Agent"], "Accept-Language": WC_HEADERS["Accept-Language"] },
        redirect: "follow",
      });
      if (res.status === 429) return { error: "rate_limited", status: "rate_limited" };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (isCloudflareBlock(body)) return { error: "cloudflare_blocked", status: "blocked" };
      if (res.status === 404) return { error: "not_found", status: "not_found", is404: true };
      return null;
    }

    const html = await res.text();
    if (isCloudflareBlock(html)) return { error: "cloudflare_blocked", status: "blocked" };

    // Extract JSON-LD
    const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (!ldMatch) return null;

    const ld = JSON.parse(ldMatch[1]);
    const graph = ld["@graph"] || [ld];
    const product = graph.find((n: any) => n["@type"] === "Product" || n["@type"] === "ProductGroup");
    if (!product) return null;

    // Try hasVariant[0].offers first, then offers directly
    let offers = product.hasVariant?.[0]?.offers || product.offers;
    if (Array.isArray(offers)) offers = offers[0];
    if (!offers?.price) return null;

    const price = parseFloat(String(offers.price).replace(",", "."));
    if (isNaN(price) || price <= 0) return null;

    const currency = String(offers.priceCurrency || WC_STORE_CURRENCIES[domain] || "EUR").toUpperCase();
    const available = offers.availability ? String(offers.availability).includes("InStock") : true;
    const priceAlert = price < PRICE_RANGE.min || price > PRICE_RANGE.max;

    return {
      success: true,
      price,
      compareAtPrice: null,
      currency,
      available,
      stockStatus: available ? "in_stock" : "out_of_stock",
      source: "woocommerce",
      method: "json_ld",
      status: priceAlert ? "anomalous" : "ok",
      price_alert: priceAlert,
      sourceUrl: productUrl,
    };
  } catch (e) {
    console.error("[JSON-LD] Error:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { productUrl, forceRefresh, filamentId, targetWeightGrams, currency } = body;

    if (!productUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing productUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const domain = extractDomain(productUrl);
    const startTime = Date.now();
    console.log(`[WC PRICE] Processing: ${productUrl} (domain: ${domain})`);

    // Try WC Store API first
    let result = await wcStoreApi(productUrl, domain);

    // If Store API returned an error status (not null), return it
    if (result && !result.success && (result.status === "blocked" || result.status === "rate_limited" || result.status === "timeout")) {
      return new Response(
        JSON.stringify({
          success: false,
          price: null,
          compareAtPrice: null,
          weightGrams: null,
          diameterMm: null,
          variantTitle: null,
          currency: WC_STORE_CURRENCIES[domain] || "EUR",
          available: false,
          source: "woocommerce",
          fetchedAt: new Date().toISOString(),
          ...result,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // If Store API returned null, try JSON-LD fallback
    if (!result) {
      console.log("[WC PRICE] Store API returned null, trying JSON-LD fallback...");
      result = await jsonLdFallback(productUrl, domain);
    }

    // Build final response
    if (result && result.success) {
      const response = {
        success: true,
        price: result.price,
        compareAtPrice: result.compareAtPrice || null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: result.currency,
        available: result.available,
        stockStatus: result.stockStatus,
        source: result.source,
        fetchedAt: new Date().toISOString(),
        sourceUrl: result.sourceUrl,
        detectedCurrency: result.currency,
        currencyMismatch: false,
        status: result.status,
        method: result.method,
        price_alert: result.price_alert,
        ...(forceRefresh ? { refreshedAt: new Date().toISOString() } : {}),
      };

      // Log extraction if forceRefresh
      if (forceRefresh) {
        try {
          const supabase = getSupabaseClient();
          await supabase.from("price_extraction_logs").insert({
            product_url: productUrl,
            extraction_method: "wc_manual_refresh",
            success: true,
            extracted_price: result.price,
            currency: result.currency,
            response_time_ms: Date.now() - startTime,
          });
        } catch (logErr) {
          console.error("Log error:", logErr);
        }
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Complete failure
    return new Response(
      JSON.stringify({
        success: false,
        price: null,
        compareAtPrice: null,
        weightGrams: null,
        diameterMm: null,
        variantTitle: null,
        currency: WC_STORE_CURRENCIES[domain] || "EUR",
        available: false,
        source: "woocommerce",
        fetchedAt: new Date().toISOString(),
        error: result?.error || "No price extracted",
        is404: result?.is404 || false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[WC PRICE] Handler error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        price: null,
        currency: "EUR",
        available: false,
        source: "woocommerce",
        fetchedAt: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
