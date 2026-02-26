/**
 * SHARED PLATFORM DETECTION
 * Detects store platform from URL and extracts product identifiers.
 */

export type Platform =
  | "shopify" | "woocommerce"
  | "creality" | "extrudr" | "treed" | "prusa" | "geeetech"
  | "bambulab"
  | "unknown";

export function detectPlatform(url: string): Platform {
  const l = url.toLowerCase();
  if (l.includes("azurefilm.com")) return "woocommerce";
  if (l.includes("store.creality.com") || l.includes("creality.com/ca/") ||
      l.includes("creality.com/uk/") || l.includes("creality.com/eu/") ||
      l.includes("creality.com/au/") || l.includes("creality.com/jp/")) return "creality";
  if (l.includes("extrudr.com")) return "extrudr";
  if (l.includes("treedfilaments.com")) return "treed";
  if (l.includes("prusa3d.com")) return "prusa";
  if (l.includes("geeetech.com")) return "geeetech";
  // Bambu Lab: custom Next.js store (migrated from Shopify in 2025)
  // JP is still on Shopify, so exclude it
  if (l.includes("store.bambulab.com") || l.includes("bambulab.com/products")) {
    if (l.includes("jp.store.bambulab.com")) return "shopify";
    return "bambulab";
  }
  return "shopify";
}

export function isShopify(url: string): boolean {
  return detectPlatform(url) === "shopify";
}

export function isWooCommerce(url: string): boolean {
  return detectPlatform(url) === "woocommerce";
}

/** Extract WooCommerce product slug from /product/slug URL */
export function extractSlug(url: string): string | null {
  try {
    const parts = new URL(url).pathname.split("/product/");
    if (parts.length < 2) return null;
    return parts[1].replace(/\//g, "").trim() || null;
  } catch { return null; }
}

/** Extract Shopify product handle from /products/handle URL */
export function extractHandle(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(/\/products\/([^/?#]+)/);
    return match ? match[1] : null;
  } catch { return null; }
}
