import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://filascope.com';

interface BrandOrganizationSchemaProps {
  name: string;
  slug: string;
  url?: string | null;
  logo?: string | null;
  description?: string | null;
  productCount?: number;
  priceRange?: { low: number; high: number } | null;
  location?: { city?: string; state?: string; country?: string } | null;
  founded?: string | null;
  /** First 10 products for ItemList schema */
  topProducts?: Array<{ name: string; slug: string }>;
}

/**
 * Organization + BreadcrumbList + ItemList Schema.org structured data for brand pages.
 */
export function BrandOrganizationSchema({
  name,
  slug,
  url,
  logo,
  description,
  productCount,
  priceRange,
  location,
  founded,
  topProducts,
}: BrandOrganizationSchemaProps) {
  // Organization schema
  const orgJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    brand: {
      '@type': 'Brand',
      name,
    },
  };

  if (url) orgJsonLd.url = url;

  if (logo) {
    orgJsonLd.logo = {
      '@type': 'ImageObject',
      url: logo,
    };
  }

  if (description) orgJsonLd.description = description;

  if (founded) orgJsonLd.foundingDate = founded;

  if (location && (location.city || location.country)) {
    const address: Record<string, string> = { '@type': 'PostalAddress' };
    if (location.city) address.addressLocality = location.city;
    if (location.state) address.addressRegion = location.state;
    if (location.country) address.addressCountry = location.country;
    orgJsonLd.address = address;
  }

  if (productCount && productCount > 0) {
    const offer: Record<string, unknown> = {
      '@type': 'AggregateOffer',
      offerCount: productCount,
    };
    if (priceRange) {
      offer.lowPrice = priceRange.low.toFixed(2);
      offer.highPrice = priceRange.high.toFixed(2);
      offer.priceCurrency = 'USD';
    }
    orgJsonLd.makesOffer = offer;
  }

  // BreadcrumbList schema
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Brands', item: `${BASE_URL}/brands` },
      { '@type': 'ListItem', position: 3, name, item: `${BASE_URL}/brands/${slug}` },
    ],
  };

  // ItemList schema for products
  const itemListJsonLd = topProducts && topProducts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${name} Filaments`,
    numberOfItems: productCount || topProducts.length,
    itemListElement: topProducts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${BASE_URL}/filament/${p.slug}`,
      name: p.name,
    })),
  } : null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(orgJsonLd)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbJsonLd)}
      </script>
      {itemListJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(itemListJsonLd)}
        </script>
      )}
    </Helmet>
  );
}
