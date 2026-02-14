import { Helmet } from 'react-helmet-async';

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

/**
 * Organization Schema.org structured data component
 * Provides business identity information for search engines
 */
export function OrganizationSchema({
  name = 'FilaScope',
  url = 'https://filascope.com',
  logo = 'https://filascope.com/og-image.png',
  description = 'The most comprehensive 3D printer filament database. Compare prices, materials, specifications, and HueForge TD values across 1,000+ filaments from 48+ brands.',
  sameAs = [],
}: OrganizationSchemaProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logo,
    },
    description,
    ...(sameAs.length > 0 && { sameAs }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
