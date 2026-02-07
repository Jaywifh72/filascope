import { Helmet } from 'react-helmet-async';

interface BrandOrganizationSchemaProps {
  name: string;
  url?: string | null;
  logo?: string | null;
  description?: string | null;
  productCount?: number;
}

/**
 * Organization Schema.org structured data for individual brand pages
 * Provides brand identity information for search engines
 */
export function BrandOrganizationSchema({
  name,
  url,
  logo,
  description,
  productCount,
}: BrandOrganizationSchemaProps) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
  };

  if (url) {
    jsonLd.url = url;
  }

  if (logo) {
    jsonLd.logo = {
      '@type': 'ImageObject',
      url: logo,
    };
  }

  if (description) {
    jsonLd.description = description;
  }

  if (productCount && productCount > 0) {
    jsonLd.numberOfEmployees = undefined; // Don't set this
    // Use makesOffer to indicate product count
    jsonLd.makesOffer = {
      '@type': 'AggregateOffer',
      offerCount: productCount,
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
