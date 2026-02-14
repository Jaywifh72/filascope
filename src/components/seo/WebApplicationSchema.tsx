import { useJsonLd } from './useJsonLd';

interface WebApplicationOffer {
  price: string;
  priceCurrency?: string;
}

interface WebApplicationSchemaProps {
  name: string;
  url: string;
  applicationCategory?: string;
  description: string;
  offers?: WebApplicationOffer;
}

export function WebApplicationSchema({
  name,
  url,
  applicationCategory = 'Utility',
  description,
  offers,
}: WebApplicationSchemaProps) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url,
    applicationCategory,
    description,
  };

  if (offers) {
    jsonLd.offers = { '@type': 'Offer', price: offers.price, priceCurrency: offers.priceCurrency || 'USD' };
  }

  useJsonLd(jsonLd);
  return null;
}
