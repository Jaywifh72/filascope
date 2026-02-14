import { useJsonLd } from './useJsonLd';

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

export function OrganizationSchema({
  name = 'FilaScope',
  url = 'https://filascope.com',
  logo = 'https://filascope.com/og-image.png',
  description = 'The most comprehensive 3D printer filament database. Compare prices, materials, specifications, and HueForge TD values across 1,000+ filaments from 48+ brands.',
  sameAs = [],
}: OrganizationSchemaProps) {
  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo: { '@type': 'ImageObject', url: logo },
    description,
    ...(sameAs.length > 0 && { sameAs }),
  });

  return null;
}
