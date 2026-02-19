import { useJsonLdMultiple } from './useJsonLd';

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
  topProducts?: Array<{ name: string; slug: string }>;
}

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
  const brandPageUrl = `${BASE_URL}/brands/${slug}`;

  const orgJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    brand: { '@type': 'Brand', name },
  };

  if (url) orgJsonLd.url = url;
  if (logo) orgJsonLd.logo = { '@type': 'ImageObject', url: logo };
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
    const offer: Record<string, unknown> = { '@type': 'AggregateOffer', offerCount: productCount };
    if (priceRange) {
      offer.lowPrice = priceRange.low.toFixed(2);
      offer.highPrice = priceRange.high.toFixed(2);
      offer.priceCurrency = 'USD';
    }
    orgJsonLd.makesOffer = offer;
  }

  // CollectionPage for the brand's product listing on FilaScope
  const collectionPageJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${name} 3D Printer Filaments`,
    description: description || `Browse all ${name} filaments — prices, specs, and availability on FilaScope.`,
    url: brandPageUrl,
    ...(logo && { image: logo }),
    ...(productCount && productCount > 0 && {
      numberOfItems: productCount,
    }),
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Brands', item: `${BASE_URL}/brands` },
        { '@type': 'ListItem', position: 3, name, item: brandPageUrl },
      ],
    },
  };

  // ItemList of top products if available
  const itemListJsonLd =
    topProducts && topProducts.length > 0
      ? {
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
        }
      : null;

  useJsonLdMultiple([orgJsonLd, collectionPageJsonLd, itemListJsonLd]);

  return null;
}
