import { useJsonLd, JsonLd } from './useJsonLd';
import { buildOfferBlock } from './schemaHelpers';

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
    const offerItems = deals
      .map((deal) => {
        const baseOffer = buildOfferBlock(
          deal.price,
          deal.currency || 'USD',
          deal.availability !== false,
        );
        // Skip deals with a falsy price (null, undefined, or 0)
        if (!baseOffer) return null;

        const offer: Record<string, unknown> = {
          ...baseOffer,
          name: deal.name,
          url: deal.url,
        };

        if (deal.priceValidUntil) {
          offer.priceValidUntil = deal.priceValidUntil;
        }

        if (deal.originalPrice && deal.originalPrice > deal.price) {
          const discountPct = Math.round(
            ((deal.originalPrice - deal.price) / deal.originalPrice) * 100,
          );
          offer.description = `${discountPct}% off — was ${deal.currency || 'USD'} ${deal.originalPrice.toFixed(2)}`;
        }

        if (deal.seller) {
          offer.seller = { '@type': 'Organization', name: deal.seller };
        }

        return offer;
      })
      .filter((o): o is Record<string, unknown> => o !== null);

    if (offerItems.length > 0) schema.itemListElement = offerItems;
  }

  useJsonLd(schema);

  return <JsonLd jsonLd={schema} />;
}
