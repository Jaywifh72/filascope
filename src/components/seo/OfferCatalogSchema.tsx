import { useJsonLd } from './useJsonLd';

interface DealItem {
  name: string;
  url: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  priceValidUntil?: string;
  seller?: string;
  availability?: boolean;
}

interface OfferCatalogSchemaProps {
  name: string;
  description: string;
  numberOfItems: number;
  url: string;
  /** Individual deal items to include as itemOffered offers */
  deals?: DealItem[];
}

export function OfferCatalogSchema({
  name,
  description,
  numberOfItems,
  url,
  deals,
}: OfferCatalogSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name,
    description,
    numberOfItems,
    url,
  };

  if (deals && deals.length > 0) {
    schema.itemListElement = deals.map((deal) => {
      const offer: Record<string, unknown> = {
        '@type': 'Offer',
        name: deal.name,
        url: deal.url,
        price: deal.price.toFixed(2),
        priceCurrency: deal.currency || 'USD',
        availability: deal.availability !== false
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      };

      if (deal.priceValidUntil) {
        offer.priceValidUntil = deal.priceValidUntil;
      }

      if (deal.originalPrice && deal.originalPrice > deal.price) {
        const discountPct = Math.round(
          ((deal.originalPrice - deal.price) / deal.originalPrice) * 100
        );
        offer.description = `${discountPct}% off — was ${deal.currency || 'USD'} ${deal.originalPrice.toFixed(2)}`;
      }

      if (deal.seller) {
        offer.seller = { '@type': 'Organization', name: deal.seller };
      }

      return offer;
    });
  }

  useJsonLd(schema);

  return null;
}
