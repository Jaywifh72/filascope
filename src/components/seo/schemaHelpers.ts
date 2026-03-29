/**
 * Shared schema.org helper utilities for JSON-LD construction.
 *
 * Keeping offer-building logic in one place means every schema
 * component applies the same null/zero price guard automatically.
 */

/**
 * Builds a minimal schema.org Offer object.
 *
 * Returns `undefined` when `price` is falsy (null, undefined, or 0) so
 * callers can omit the `offers` key entirely rather than emitting an Offer
 * with a missing or zero price — which triggers Google Search Console warnings.
 *
 * Extra fields (url, priceValidUntil, shippingDetails, seller, …) can be
 * merged in by the caller via object spread:
 *
 * ```ts
 * const base = buildOfferBlock(price, 'USD', true);
 * const offers = base ? { ...base, url, priceValidUntil } : undefined;
 * ```
 *
 * @param price     Numeric price. Falsy values (null | undefined | 0) → returns undefined.
 * @param currency  ISO 4217 currency code, e.g. "USD".
 * @param available Whether the item is currently in stock.
 */
export function buildOfferBlock(
  price: number | null | undefined,
  currency: string,
  available: boolean,
):
  | { '@type': 'Offer'; price: string; priceCurrency: string; availability: string }
  | undefined {
  if (!price) return undefined;
  return {
    '@type': 'Offer',
    price: price.toFixed(2),
    priceCurrency: currency,
    availability: available
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
  };
}
