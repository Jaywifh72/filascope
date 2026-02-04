import { RegionCode } from "@/types/regional";

export interface DealStoreInfo {
  storeName: string;
  storeRegion: RegionCode;
  regionFlag: string;
  isLocal: boolean;
  isAmazon: boolean;
}

// Region flags lookup
const REGION_FLAGS: Record<RegionCode, string> = {
  US: "🇺🇸",
  CA: "🇨🇦",
  UK: "🇬🇧",
  EU: "🇪🇺",
  AU: "🇦🇺",
  JP: "🇯🇵",
  CN: "🇨🇳",
};

// Amazon domain to region mapping
const AMAZON_DOMAIN_TO_REGION: Record<string, RegionCode> = {
  "amazon.com": "US",
  "amazon.co.uk": "UK",
  "amazon.de": "EU",
  "amazon.fr": "EU",
  "amazon.it": "EU",
  "amazon.es": "EU",
  "amazon.nl": "EU",
  "amazon.ca": "CA",
  "amazon.com.au": "AU",
  "amazon.co.jp": "JP",
  "amazon.cn": "CN",
};

// Amazon region display names
const AMAZON_REGION_NAMES: Record<RegionCode, string> = {
  US: "Amazon US",
  CA: "Amazon CA",
  UK: "Amazon UK",
  EU: "Amazon EU",
  AU: "Amazon AU",
  JP: "Amazon JP",
  CN: "Amazon CN",
};

/**
 * Detects store region from a product URL
 */
function detectRegionFromUrl(url: string): RegionCode {
  const lowerUrl = url.toLowerCase();
  
  // Check for Amazon domains first
  for (const [domain, region] of Object.entries(AMAZON_DOMAIN_TO_REGION)) {
    if (lowerUrl.includes(domain)) {
      return region;
    }
  }
  
  // Check for UK patterns
  if (
    lowerUrl.includes(".co.uk") ||
    lowerUrl.includes("-uk.") ||
    lowerUrl.includes("/uk/") ||
    lowerUrl.includes(".uk/")
  ) {
    return "UK";
  }
  
  // Check for EU patterns
  if (
    lowerUrl.includes(".eu") ||
    lowerUrl.includes("-eu.") ||
    lowerUrl.includes("/eu/") ||
    lowerUrl.includes(".de/") ||
    lowerUrl.includes(".fr/") ||
    lowerUrl.includes(".it/") ||
    lowerUrl.includes(".es/") ||
    lowerUrl.includes(".nl/")
  ) {
    return "EU";
  }
  
  // Check for CA patterns
  if (
    lowerUrl.includes(".ca/") ||
    lowerUrl.includes("-ca.") ||
    lowerUrl.includes("/ca/")
  ) {
    return "CA";
  }
  
  // Check for AU patterns
  if (
    lowerUrl.includes(".com.au") ||
    lowerUrl.includes("-au.") ||
    lowerUrl.includes("/au/")
  ) {
    return "AU";
  }
  
  // Check for JP patterns
  if (
    lowerUrl.includes(".co.jp") ||
    lowerUrl.includes("-jp.") ||
    lowerUrl.includes("/jp/")
  ) {
    return "JP";
  }
  
  // Default to US for standard .com stores
  return "US";
}

/**
 * Checks if a URL is an Amazon link
 */
function isAmazonUrl(url: string): boolean {
  return url.toLowerCase().includes("amazon.");
}

/**
 * Gets the store name from vendor and URL
 */
function getStoreName(vendor: string | null, url: string | null, storeRegion: RegionCode): string {
  if (url && isAmazonUrl(url)) {
    return AMAZON_REGION_NAMES[storeRegion] || "Amazon";
  }
  
  if (vendor) {
    // Clean up vendor name if needed
    const cleanVendor = vendor.trim();
    return cleanVendor.endsWith(" Store") ? cleanVendor : `${cleanVendor}`;
  }
  
  return "Store";
}

/**
 * Get store region info for a deal
 */
export function getDealStoreInfo(
  productUrl: string | null,
  vendor: string | null,
  userRegion: RegionCode
): DealStoreInfo {
  // Default values
  const defaultInfo: DealStoreInfo = {
    storeName: vendor || "Store",
    storeRegion: "US",
    regionFlag: REGION_FLAGS.US,
    isLocal: userRegion === "US",
    isAmazon: false,
  };
  
  if (!productUrl) {
    return defaultInfo;
  }
  
  const isAmazon = isAmazonUrl(productUrl);
  const storeRegion = detectRegionFromUrl(productUrl);
  const regionFlag = REGION_FLAGS[storeRegion] || "🌐";
  const storeName = getStoreName(vendor, productUrl, storeRegion);
  const isLocal = storeRegion === userRegion;
  
  return {
    storeName,
    storeRegion,
    regionFlag,
    isLocal,
    isAmazon,
  };
}

/**
 * Get the region flag for a region code
 */
export function getRegionFlag(regionCode: RegionCode): string {
  return REGION_FLAGS[regionCode] || "🌐";
}
