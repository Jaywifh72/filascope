import { Helmet } from 'react-helmet-async';

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
}

/**
 * SoftwareApplication Schema.org structured data component
 * Used for slicer software listings to enable rich results in Google
 */
export function SoftwareApplicationSchema({
  name,
  description,
  operatingSystem,
  applicationCategory = 'DesignApplication',
  offers,
  aggregateRating,
  url,
}: SoftwareApplicationSchemaProps) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    operatingSystem,
    applicationCategory,
  };

  if (url) {
    jsonLd.url = url;
  }

  if (offers) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: offers.price,
      priceCurrency: offers.priceCurrency || 'USD',
    };
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

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
