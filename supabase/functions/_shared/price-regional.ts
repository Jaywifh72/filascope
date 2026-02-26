/**
 * SHARED PRICE REGIONAL MODULE
 * Regional URL transformation logic and store configs.
 */

import type { RegionalStoreConfig } from "./price-types.ts";

// ============================================================
// Regional Store Configs
// ============================================================

export const REGIONAL_STORE_CONFIGS: Record<string, RegionalStoreConfig> = {
  bambulab: {
    pattern: "subdomain", baseDomain: "store.bambulab.com", fallbackRegion: "US",
    regions: {
      US: { subdomain: "us", currency: "USD" }, CA: { subdomain: "ca", currency: "CAD" },
      UK: { subdomain: "uk", currency: "GBP" }, EU: { subdomain: "eu", currency: "EUR" },
      AU: { subdomain: "au", currency: "AUD" }, JP: { subdomain: "jp", currency: "JPY" },
    },
  },
  polymaker: {
    pattern: "subdomain", baseDomain: "polymaker.com", fallbackRegion: "US",
    regions: { US: { subdomain: "us", currency: "USD" }, CA: { subdomain: "ca", currency: "CAD" } },
  },
  elegoo: {
    pattern: "subdomain", baseDomain: "elegoo.com", fallbackRegion: "US",
    regions: {
      US: { subdomain: "us", currency: "USD" }, CA: { subdomain: "ca", currency: "CAD" },
      UK: { subdomain: "uk", currency: "GBP" }, EU: { subdomain: "eu", currency: "EUR" },
      AU: { subdomain: "au", currency: "AUD" },
    },
  },
  anycubic: {
    pattern: "subdomain", baseDomain: "anycubic.com", fallbackRegion: "US",
    regions: {
      US: { subdomain: "store", currency: "USD" }, CA: { subdomain: "ca", currency: "CAD" },
      UK: { subdomain: "uk", currency: "GBP" }, EU: { subdomain: "eu", currency: "EUR" },
      AU: { domain: "www.anycubic.au", currency: "AUD" },
    },
  },
  creality: {
    pattern: "path", baseDomain: "store.creality.com", fallbackRegion: "US",
    regions: {
      US: { pathPrefix: "", currency: "USD" }, CA: { pathPrefix: "/ca", currency: "CAD" },
      UK: { pathPrefix: "/uk", currency: "GBP" }, EU: { pathPrefix: "/eu", currency: "EUR" },
      AU: { pathPrefix: "/au", currency: "AUD" }, JP: { pathPrefix: "/jp", currency: "JPY" },
    },
  },
  extrudr: {
    pattern: "path", baseDomain: "www.extrudr.com", fallbackRegion: "EU",
    regions: {
      EU: { pathPrefix: "", currency: "EUR" }, US: { pathPrefix: "", currency: "EUR" },
      CA: { pathPrefix: "", currency: "EUR" }, UK: { pathPrefix: "", currency: "EUR" },
      AU: { pathPrefix: "", currency: "EUR" },
    },
  },
  prusa: {
    pattern: "path", baseDomain: "www.prusa3d.com", fallbackRegion: "EU",
    regions: {
      EU: { pathPrefix: "", currency: "EUR" }, US: { pathPrefix: "", currency: "EUR" },
      CA: { pathPrefix: "", currency: "EUR" }, UK: { pathPrefix: "", currency: "EUR" },
      AU: { pathPrefix: "", currency: "EUR" },
    },
  },
};

export const CURRENCY_TO_REGION: Record<string, string> = {
  USD: "US", CAD: "CA", GBP: "UK", EUR: "EU", AUD: "AU", JPY: "JP", CNY: "CN",
};

// ============================================================
// Creality URL Normalization
// ============================================================

export function normalizeCrealityUrl(url: string): string {
  const CREALITY_REGION_SUBDOMAINS = ["ca", "uk", "eu", "au", "jp"];
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    for (const region of CREALITY_REGION_SUBDOMAINS) {
      if (hostname === `${region}.creality.com`) {
        return `https://store.creality.com/${region}${urlObj.pathname}${urlObj.search}`;
      }
    }
  } catch (_) { /* ignore */ }
  return url;
}

// ============================================================
// Regional URL Transformation
// ============================================================

export function transformToRegionalUrl(
  url: string, requestedCurrency: string,
): { url: string; expectedCurrency: string; transformed: boolean } {
  url = normalizeCrealityUrl(url);
  const urlLower = url.toLowerCase();
  const regionCode = CURRENCY_TO_REGION[requestedCurrency] || "US";

  for (const [_brandKey, config] of Object.entries(REGIONAL_STORE_CONFIGS)) {
    if (!urlLower.includes(config.baseDomain.toLowerCase())) continue;

    // Check if URL already matches a regional store
    try {
      const urlObj = new URL(url);
      const currentHost = urlObj.hostname.toLowerCase();
      for (const [regionKey, regionCfg] of Object.entries(config.regions)) {
        const rc = regionCfg as { subdomain?: string; domain?: string; currency: string };
        if (rc.domain && currentHost === rc.domain.toLowerCase()) {
          return { url, expectedCurrency: rc.currency, transformed: false };
        }
        if (rc.subdomain) {
          const expectedHost = `${rc.subdomain}.${config.baseDomain}`.toLowerCase();
          if (currentHost === expectedHost && regionKey !== regionCode) {
            return { url, expectedCurrency: rc.currency, transformed: false };
          }
        }
      }
    } catch (_) { /* ignore */ }

    const regionConfig = config.regions[regionCode];
    if (!regionConfig) {
      const fallbackConfig = config.regions[config.fallbackRegion || "US"];
      return { url, expectedCurrency: fallbackConfig?.currency || "USD", transformed: false };
    }

    try {
      const urlObj = new URL(url);
      if (config.pattern === "subdomain") {
        if (regionConfig.domain) {
          urlObj.hostname = regionConfig.domain;
        } else if (regionConfig.subdomain) {
          const hostParts = urlObj.hostname.split(".");
          if (hostParts.length >= 3) hostParts[0] = regionConfig.subdomain;
          else hostParts.unshift(regionConfig.subdomain);
          urlObj.hostname = hostParts.join(".");
        }
        const newUrl = urlObj.toString();
        if (newUrl !== url) return { url: newUrl, expectedCurrency: regionConfig.currency, transformed: true };
      } else if (config.pattern === "path") {
        const pathPrefix = regionConfig.pathPrefix || "";
        if (pathPrefix) {
          const knownPrefixes = Object.values(config.regions)
            .map(r => r.pathPrefix).filter((p): p is string => !!p && p.length > 0);
          let cleanPath = urlObj.pathname;
          for (const prefix of knownPrefixes) {
            if (cleanPath.startsWith(prefix + "/")) { cleanPath = cleanPath.substring(prefix.length); break; }
          }
          urlObj.pathname = pathPrefix + cleanPath;
          const newUrl = urlObj.toString();
          if (newUrl !== url) return { url: newUrl, expectedCurrency: regionConfig.currency, transformed: true };
        }
      }
    } catch (e) { console.error("URL transformation error:", e); }

    return { url, expectedCurrency: regionConfig.currency, transformed: false };
  }

  return { url, expectedCurrency: requestedCurrency, transformed: false };
}
