import { useJsonLd } from './useJsonLd';

interface OfferCatalogSchemaProps {
  name: string;
  description: string;
  numberOfItems: number;
  url: string;
}

export function OfferCatalogSchema({ name, description, numberOfItems, url }: OfferCatalogSchemaProps) {
  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name,
    description,
    numberOfItems,
    url,
  });

  return null;
}
