/**
 * SHARED PRICE UTILITIES
 * Pure functions for price parsing, validation, and content analysis.
 * No external dependencies (no Supabase, no Firecrawl).
 */

// ============================================================
// European Price Parsing
// ============================================================

const EUROPEAN_DECIMAL_BRANDS = ["azurefilm.com"] as const;

export function isEuropeanDecimalBrand(url: string): boolean {
  return EUROPEAN_DECIMAL_BRANDS.some(d => url.includes(d));
}

export function parseEuropeanPrice(raw: string): number {
  if (!raw) return NaN;
  const cleaned = raw.replace(/[^\d,.\s]/g, "").trim();
  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
    }
    return parseFloat(cleaned.replace(/,/g, ""));
  }
  if (cleaned.includes(",") && /,\d{2}$/.test(cleaned)) {
    return parseFloat(cleaned.replace(",", "."));
  }
  return parseFloat(cleaned.replace(/,/g, ""));
}

export function cleanEuropeanPrice(raw: string): string {
  return raw.replace(/[^\d,.\s]/g, "").trim();
}

export function parsePriceForDomain(raw: string, url: string): number {
  return isEuropeanDecimalBrand(url) ? parseEuropeanPrice(raw) : parseFloat(raw.replace(/[^0-9.]/g, ""));
}

// ============================================================
// Price Validation
// ============================================================

export const CURRENCY_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  USD: { min: 10, max: 150 },
  CAD: { min: 12, max: 200 },
  EUR: { min: 8, max: 120 },
  GBP: { min: 8, max: 120 },
  AUD: { min: 15, max: 250 },
  JPY: { min: 800, max: 15000 },
};

export function validateFilamentPrice(price: number, currency: string): boolean {
  const range = CURRENCY_PRICE_RANGES[currency] || CURRENCY_PRICE_RANGES.USD;
  return price >= range.min && price <= range.max;
}

export function validateProductPrice(price: number, currency: string, productType: "filament" | "printer"): boolean {
  if (productType === "printer") {
    const ranges: Record<string, { min: number; max: number }> = {
      USD: { min: 99, max: 10000 }, CAD: { min: 120, max: 13000 },
      EUR: { min: 90, max: 10000 }, GBP: { min: 80, max: 8500 },
      AUD: { min: 150, max: 15000 }, JPY: { min: 10000, max: 1500000 },
    };
    const r = ranges[currency] || ranges.USD;
    return price >= r.min && price <= r.max;
  }
  return validateFilamentPrice(price, currency);
}

// ============================================================
// Sale Price Extraction
// ============================================================

const DEFAULT_EXCLUDE_PATTERNS = [
  "coupon", "code", "promo", "newsletter", "sign up", "subscribe",
  "reward", "loyalty", "cashback", "gift card", "buy.*get", "bundle deal",
];

export function removeSavingsAmounts(text: string): string {
  return text
    .replace(/Save\s+\$[\d,.]+/gi, "")
    .replace(/You\s+save\s+\$[\d,.]+/gi, "")
    .replace(/Discount:?\s+\$[\d,.]+/gi, "")
    .replace(/\$[\d,.]+\s+off/gi, "");
}

export function extractSalePriceBeforeSave(markdown: string): {
  salePrice: number | null;
  compareAtPrice: number | null;
} {
  const saveSectionRegex = /\$(\d+(?:\.\d{2})?)\s+\$(\d+(?:\.\d{2})?)\s+Save\s+\$[\d,.]+/gi;
  const match = saveSectionRegex.exec(markdown);
  if (match) {
    const price1 = parseFloat(match[1]);
    const price2 = parseFloat(match[2]);
    if (!isNaN(price1) && !isNaN(price2) && price1 !== price2) {
      return {
        salePrice: Math.min(price1, price2),
        compareAtPrice: Math.max(price1, price2),
      };
    }
  }

  // Try multi-line: price line, then price line, then "Save $X"
  const lines = markdown.split("\n");
  const prices: number[] = [];
  let foundSave = false;
  for (let i = 0; i < lines.length && i < 100; i++) {
    const line = lines[i].trim();
    if (/^Save\s+\$/i.test(line)) { foundSave = true; break; }
    const priceMatch = line.match(/^\$(\d+(?:\.\d{2})?)$/);
    if (priceMatch) prices.push(parseFloat(priceMatch[1]));
  }
  if (foundSave && prices.length >= 2) {
    prices.sort((a, b) => a - b);
    return { salePrice: prices[0], compareAtPrice: prices[prices.length - 1] };
  }
  return { salePrice: null, compareAtPrice: null };
}

// ============================================================
// Currency Detection
// ============================================================

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$", CAD: "C$", EUR: "€", GBP: "£", AUD: "A$", JPY: "¥",
  };
  return symbols[currency] || "$";
}

export function buildCurrencyPricePattern(currency: string): RegExp {
  const symbol = getCurrencySymbol(currency).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${symbol}\\s*([\\d,]+(?:\\.\\d{2})?)`, "g");
}

export function detectCurrencyFromContent(markdown: string): string | null {
  const currencyPatterns: [RegExp, string][] = [
    [/€[\d,]+(?:\.\d{2})?/g, "EUR"],
    [/£[\d,]+(?:\.\d{2})?/g, "GBP"],
    [/CA\$[\d,]+(?:\.\d{2})?/g, "CAD"],
    [/AU\$[\d,]+(?:\.\d{2})?/g, "AUD"],
    [/¥[\d,]+/g, "JPY"],
    [/US\$[\d,]+(?:\.\d{2})?/g, "USD"],
  ];
  const counts: Record<string, number> = {};
  for (const [pattern, currency] of currencyPatterns) {
    const matches = markdown.match(pattern);
    if (matches) counts[currency] = (counts[currency] || 0) + matches.length;
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][1] >= 2 ? entries[0][0] : null;
}

// ============================================================
// Weight / Diameter Parsing
// ============================================================

export function extractWeightFromContent(markdown: string): number | null {
  const kgMatch = markdown.match(/\b(\d+(?:\.\d+)?)\s*kg\b/i);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);
  const gMatch = markdown.match(/\b(\d{3,4})\s*g(?:ram)?s?\b/i);
  if (gMatch) return Math.round(parseFloat(gMatch[1]));
  return null;
}

export function extractDiameterFromContent(markdown: string, url: string): number | null {
  const urlMatch = url.match(/[_-](1[.-]75|2[.-]85)/i);
  if (urlMatch) return parseFloat(urlMatch[1].replace("-", "."));
  const contentMatch = markdown.match(/\b(1\.75|2\.85)\s*mm\b/i);
  if (contentMatch) return parseFloat(contentMatch[1]);
  return null;
}

export function parseWeightFromTitle(title: string): number | null {
  const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);
  const gMatch = title.match(/(\d{3,4})\s*g(?:ram)?/i);
  if (gMatch) return parseInt(gMatch[1]);
  return null;
}

export function parseDiameter(url: string, title: string): number | null {
  const urlMatch = url.match(/[_-](1[.-]75|2[.-]85)/i);
  if (urlMatch) return parseFloat(urlMatch[1].replace("-", "."));
  const titleMatch = title.match(/\b(1\.75|2\.85)\s*mm\b/i);
  if (titleMatch) return parseFloat(titleMatch[1]);
  return null;
}

export function parsePackQuantity(productTitle: string, variantTitle: string): number {
  const combined = `${productTitle} ${variantTitle}`;
  const packMatch = combined.match(/(\d+)\s*(?:pack|bundle|set|pcs)/i);
  if (packMatch) return parseInt(packMatch[1]);
  return 1;
}

// ============================================================
// Content Analysis
// ============================================================

export function is404Content(markdown: string): boolean {
  const lower = markdown.toLowerCase();
  const patterns = [
    "page not found", "404", "no longer available", "product not found",
    "this page doesn't exist", "oops!", "page you requested does not exist",
    "page could not be found", "page you are looking for",
  ];
  const matchCount = patterns.filter(p => lower.includes(p)).length;
  return matchCount >= 2 || (matchCount >= 1 && markdown.length < 500);
}

export function isCloudflareBlock(text: string): boolean {
  return text.includes("cf-browser-verification") || text.includes("Just a moment") || text.includes("Checking your browser");
}

export function detectStockStatus(markdown: string): "preorder" | "low_stock" | "out_of_stock" | "unknown" {
  const content = markdown.toLowerCase();
  if (/pre[- ]?order|coming\s*soon|reserve\s*now/i.test(content)) return "preorder";
  if (/only\s*\d+\s*left|low\s*stock|limited\s*(?:stock|quantity)/i.test(content)) return "low_stock";
  if (/sold\s*out|out\s*of\s*stock|currently\s*unavailable|notify\s*(me\s*)?(when\s*)?(available|in\s*stock)/i.test(content)) return "out_of_stock";
  return "unknown";
}

// ============================================================
// Firecrawl Location Helper
// ============================================================

export function getFirecrawlLocation(currency: string): { country: string; languages: string[] } {
  const map: Record<string, { country: string; languages: string[] }> = {
    USD: { country: "US", languages: ["en"] },
    CAD: { country: "CA", languages: ["en"] },
    GBP: { country: "GB", languages: ["en"] },
    EUR: { country: "DE", languages: ["de", "en"] },
    AUD: { country: "AU", languages: ["en"] },
    JPY: { country: "JP", languages: ["ja", "en"] },
  };
  return map[currency] || map.USD;
}

// ============================================================
// URL Helpers
// ============================================================

export function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

export function extractVariantIdFromUrl(url: string): string | null {
  const match = url.match(/[?&]variant=(\d+)/);
  return match ? match[1] : null;
}

export function getShopifyJsonUrl(productUrl: string): string {
  const cleanUrl = productUrl.replace(/[?#].*$/, "").replace(/\/$/, "");
  return `${cleanUrl}.json`;
}
