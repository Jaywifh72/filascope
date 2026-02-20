import { useJsonLd } from './useJsonLd';

interface CollectionPageSchemaProps {
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
  image?: string;
}

export function CollectionPageSchema({
  name,
  description,
  url,
  numberOfItems,
  image,
}: CollectionPageSchemaProps) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    ...(numberOfItems !== undefined && { numberOfItems }),
    ...(image && { image }),
  };

  useJsonLd(jsonLd);
  return null;
}
