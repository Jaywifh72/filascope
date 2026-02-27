/**
 * SHARED FIRECRAWL PRICE EXTRACTOR
 * Generic markdown scraping with sale price extraction and currency fallback.
 */

import type { PriceResponse, ProductType } from "./price-types.ts";
import {
  is404Content, detectStockStatus, extractWeightFromContent,
  extractDiameterFromContent, getCurrencySymbol, removeSavingsAmounts,
  extractSalePriceBeforeSave, getFirecrawlLocation, detectCurrencyFromContent,
} from "./price-utils.ts";
import { logBrokenUrl } from "./price-db.ts";

export async function extractFirecrawlPrice(
  productUrl: string, preferredCurrency: string, productType: ProductType = "filament",
  waitForMs: number = 3000,
): Promise<PriceResponse> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: "Firecrawl not configured" };
  }

  const location = getFirecrawlLocation(preferredCurrency);

  try {
    let response: Response | null = null;
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        response = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: productUrl, formats: ["markdown"], onlyMainContent: true, waitFor: waitForMs, location }),
        });
        if (response.ok) break;
        if (attempt < 2 && [408, 500, 502, 503].includes(response.status)) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: `Firecrawl HTTP ${response.status}` };
      } catch (networkErr) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue; }
        return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: `Network error: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}` };
      }
    }
    if (!response) return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: "No response" };

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || "";
    if (!markdown) return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: "No content" };

    if (is404Content(markdown)) {
      await logBrokenUrl(productUrl, "404_content");
      return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: "PRODUCT_PAGE_NOT_FOUND", is404: true };
    }

    const isColorFabb = /colorfabb\.(us|com)/i.test(productUrl);
    const isEuropeanStore = /formfutura\.com/i.test(productUrl);
    let stockStatus = detectStockStatus(markdown);
    const priceRange = productType === "printer"
      ? { min: 99, max: 10000 }
      : { min: 10, max: (isColorFabb || isEuropeanStore) ? 350 : 150 };

    // Helper to parse a price string, handling European decimal format (e.g. "16,52" → 16.52)
    function parseExtractedPrice(raw: string, currency: string): number {
      // European format: "16,52" or "1.234,56" (dot = thousands, comma = decimal)
      if ((currency === "EUR" || isEuropeanStore) && raw.includes(",")) {
        // "1.234,56" → remove dots, replace comma with period
        if (raw.includes(".") && raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
          return parseFloat(raw.replace(/\./g, "").replace(",", "."));
        }
        // "16,52" → comma is decimal
        if (/,\d{2}$/.test(raw)) {
          return parseFloat(raw.replace(",", "."));
        }
      }
      return parseFloat(raw.replace(",", ""));
    }

    // Sale format
    const addToCartIdx = markdown.search(/Add\s*to\s*Cart/i);
    const section = addToCartIdx > -1
      ? markdown.slice(0, addToCartIdx + 200)
      : markdown.slice(0, Math.floor(markdown.length * (stockStatus === "out_of_stock" ? 0.9 : 0.4)));
    const sale = extractSalePriceBeforeSave(section);
    if (sale.salePrice && sale.salePrice >= priceRange.min && sale.salePrice <= priceRange.max) {
      return {
        success: true, price: sale.salePrice,
        compareAtPrice: sale.compareAtPrice && sale.compareAtPrice > sale.salePrice * 1.05 ? sale.compareAtPrice : null,
        currency: preferredCurrency,
        available: stockStatus !== "out_of_stock",
        stockStatus: stockStatus === "unknown" ? "in_stock" : stockStatus,
        source: "firecrawl", fetchedAt: new Date().toISOString(),
        weightGrams: extractWeightFromContent(markdown),
        diameterMm: extractDiameterFromContent(markdown, productUrl),
      };
    }

    // Generic extraction
    let cleaned = removeSavingsAmounts(section);
    const symbol = getCurrencySymbol(preferredCurrency);
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Updated pattern: capture digits with commas and optional dot-decimals OR comma-decimals (European)
    const pattern = new RegExp(`${escaped}\\s*([\\d]+(?:[.,]\\d{2,3})?)`, "g");
    let prices = [...cleaned.matchAll(pattern)]
      .map(m => parseExtractedPrice(m[1], preferredCurrency))
      .filter(p => !isNaN(p) && p >= priceRange.min && p <= priceRange.max)
      .sort((a, b) => a - b);

    // Fallback to full markdown when short section misses the price (common on Magento/out-of-stock templates)
    if (prices.length === 0 && section !== markdown) {
      cleaned = removeSavingsAmounts(markdown);
      prices = [...cleaned.matchAll(pattern)]
        .map(m => parseExtractedPrice(m[1], preferredCurrency))
        .filter(p => !isNaN(p) && p >= priceRange.min && p <= priceRange.max)
        .sort((a, b) => a - b);
    }

    if (prices.length > 0) {
      return {
        success: true, price: prices[0],
        compareAtPrice: prices.length > 1 && prices[1] > prices[0] * 1.1 ? prices[1] : null,
        currency: preferredCurrency,
        available: stockStatus !== "out_of_stock",
        stockStatus: stockStatus === "unknown" ? "in_stock" : stockStatus,
        source: "firecrawl", fetchedAt: new Date().toISOString(),
        weightGrams: extractWeightFromContent(markdown),
        diameterMm: extractDiameterFromContent(markdown, productUrl),
      };
    }

    // Currency fallback
    const detected = detectCurrencyFromContent(markdown);
    if (detected && detected !== preferredCurrency) {
      const altSymbol = getCurrencySymbol(detected);
      const altEsc = altSymbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const altPattern = new RegExp(`${altEsc}\\s*([\\d]+(?:[.,]\\d{2,3})?)`, "g");
      const altPrices = [...cleaned.matchAll(altPattern)]
        .map(m => parseExtractedPrice(m[1], detected))
        .filter(p => !isNaN(p) && p > 5 && p < 200)
        .sort((a, b) => a - b);
      if (altPrices.length > 0) {
        return {
          success: true, price: altPrices[0],
          compareAtPrice: altPrices.length > 1 && altPrices[1] > altPrices[0] * 1.1 ? altPrices[1] : null,
          currency: detected,
          available: stockStatus !== "out_of_stock",
          stockStatus: stockStatus === "unknown" ? "in_stock" : stockStatus,
          source: "firecrawl", fetchedAt: new Date().toISOString(),
          currencyMismatch: true, detectedCurrency: detected, requestedCurrency: preferredCurrency,
        };
      }
    }

    // Secondary pass for ColorFabb: some templates hide stock markers outside main content.
    if (prices.length === 0 && stockStatus === "unknown" && isColorFabb) {
      try {
        const fallbackResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: productUrl, formats: ["markdown"], onlyMainContent: false, waitFor: waitForMs, location }),
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackMarkdown = fallbackData.data?.markdown || fallbackData.markdown || "";

          if (fallbackMarkdown) {
            if (is404Content(fallbackMarkdown)) {
              await logBrokenUrl(productUrl, "404_content");
              return {
                success: false,
                price: null,
                compareAtPrice: null,
                currency: preferredCurrency,
                available: false,
                source: "firecrawl",
                fetchedAt: new Date().toISOString(),
                error: "PRODUCT_PAGE_NOT_FOUND",
                is404: true,
              };
            }

            stockStatus = detectStockStatus(fallbackMarkdown);
          }
        }
      } catch (fallbackErr) {
        console.warn("[FIRECRAWL] ColorFabb fallback check failed:", fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr));
      }
    }

    if (stockStatus === "out_of_stock") {
      return {
        success: false,
        price: null,
        compareAtPrice: null,
        currency: preferredCurrency,
        available: false,
        stockStatus: "out_of_stock",
        source: "firecrawl",
        fetchedAt: new Date().toISOString(),
        error: "OUT_OF_STOCK_NO_PRICE",
      };
    }

    return {
      success: false,
      price: null,
      compareAtPrice: null,
      currency: preferredCurrency,
      available: false,
      stockStatus,
      source: "firecrawl",
      fetchedAt: new Date().toISOString(),
      error: "No valid price found",
    };
  } catch (error) {
    return { success: false, price: null, compareAtPrice: null, currency: preferredCurrency, available: false, source: "firecrawl", fetchedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "Unknown error" };
  }
}
