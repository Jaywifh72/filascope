import { useJsonLd, JsonLd } from './useJsonLd';

interface SoftwareApplicationOffer {
  price: string;
  priceCurrency?: string;
}

interface SoftwareApplicationRating {
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
}

interface SoftwareApplicationSchemaProps {
  name: string;
  description: string;
  operatingSystem: string;
  applicationCategory?: string;
  offers?: SoftwareApplicationOffer;
  aggregateRating?: SoftwareApplicationRating;
  url?: string;
  creator?: { name: string; url?: string };
}

export function SoftwareApplicationSchema({
  name,
  description,
  operatingSystem,
  applicationCategory = 'DesignApplication',
  offers,
  aggregateRating,
  url,
  creator,
}: SoftwareApplicationSchemaProps) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    operatingSystem,
    applicationCategory,
  };

  if (url) jsonLd.url = url;
  if (offers) {
    jsonLd.offers = { '@type': 'Offer', price: offers.price, priceCurrency: offers.priceCurrency || 'USD' };
  }
  if (aggregateRating) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      bestRating: aggregateRating.bestRating || 10,
      worstRating: aggregateRating.worstRating || 0,
      ratingCount: 1,
    };
  }
  if (creator) {
    jsonLd.creator = { '@type': 'Organization', name: creator.name, ...(creator.url && { url: creator.url }) };
  }

  useJsonLd(jsonLd);
  return <JsonLd jsonLd={jsonLd} />;
}
