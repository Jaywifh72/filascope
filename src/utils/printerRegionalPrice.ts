import type { CurrencyCode } from '@/types/regional';

/**
 * Resolves the best available price for a printer based on the user's region.
 * Prioritizes actual regional store prices over USD fallback.
 */
export interface RegionalPrinterPrice {
  /** The price to display */
  price: number | null;
  /** The currency of the price */
  currency: CurrencyCode;
  /** MSRP in the same currency (for discount calculation) */
  msrp: number | null;
  /** Whether this is a real regional price or a USD fallback */
  isRegional: boolean;
  /** The product URL for the user's region */
  storeUrl: string | null;
}

/**
 * Get the regional price for a printer based on the user's selected region.
 * Falls back to USD if no regional price is available.
 */
export function getPrinterRegionalPrice(
  printer: Record<string, any>,
  region: string
): RegionalPrinterPrice {
  const regionMap: Record<string, {
    salePriceKey: string;
    msrpKey: string;
    currency: CurrencyCode;
    urlKey: string;
  }> = {
    CA: { salePriceKey: 'current_price_cad_store', msrpKey: 'msrp_cad', currency: 'CAD', urlKey: 'product_url_ca' },
    EU: { salePriceKey: 'current_price_eur_store', msrpKey: 'msrp_eur', currency: 'EUR', urlKey: 'product_url_eu' },
    UK: { salePriceKey: 'current_price_gbp_store', msrpKey: 'msrp_gbp', currency: 'GBP', urlKey: 'product_url_uk' },
    AU: { salePriceKey: 'current_price_aud_store', msrpKey: 'msrp_aud', currency: 'AUD', urlKey: 'product_url_au' },
    JP: { salePriceKey: 'current_price_jpy_store', msrpKey: 'msrp_jpy', currency: 'JPY', urlKey: 'product_url_jp' },
  };

  const mapping = regionMap[region];
  
  if (mapping) {
    const salePrice = printer[mapping.salePriceKey];
    const msrp = printer[mapping.msrpKey];
    const url = printer[mapping.urlKey];
    
    if (salePrice != null || msrp != null) {
      return {
        price: salePrice ?? msrp,
        currency: mapping.currency,
        msrp: msrp,
        isRegional: true,
        storeUrl: url || printer.product_url || printer.official_store_url,
      };
    }
  }

  // Fallback to USD
  const usdPrice = printer.current_price_usd_store ?? printer.current_price_usd_amazon ?? printer.msrp_usd;
  return {
    price: usdPrice ?? null,
    currency: 'USD',
    msrp: printer.msrp_usd ?? null,
    isRegional: region === 'US',
    storeUrl: printer.product_url || printer.official_store_url,
  };
}

/**
 * Get a numeric price for sorting purposes.
 * Returns the regional price if available, otherwise USD, otherwise Infinity.
 */
export function getPrinterSortPrice(printer: Record<string, any>, region: string): number {
  const { price } = getPrinterRegionalPrice(printer, region);
  return price ?? Infinity;
}
