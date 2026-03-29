import { useJsonLdMultiple, JsonLdMultiple } from './useJsonLd';

const BASE_URL = 'https://filascope.com';

const NAV_ITEMS = [
  { name: 'Filaments', url: `${BASE_URL}/filaments` },
  { name: 'Printers',  url: `${BASE_URL}/printers` },
  { name: 'Brands',    url: `${BASE_URL}/brands` },
  { name: 'Deals',     url: `${BASE_URL}/deals` },
  { name: 'Guides',    url: `${BASE_URL}/guides` },
  { name: 'HueForge TD Database', url: `${BASE_URL}/hueforge-td-database` },
] as const;

interface WebSiteSchemaProps {
  name?: string;
  url?: string;
  description?: string;
  searchTargetUrl?: string;
}

export function WebSiteSchema({
  name = 'FilaScope',
  url = BASE_URL,
  description = 'Compare 3D printer filaments by material, price, and specifications. Find the perfect filament for your printer with real-time pricing and HueForge TD values.',
  searchTargetUrl = `${BASE_URL}/filaments?search={search_term_string}`,
}: WebSiteSchemaProps) {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: searchTargetUrl },
      'query-input': 'required name=search_term_string',
    },
  };

  const siteNavSchema = {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    name: NAV_ITEMS.map((n) => n.name),
    url: NAV_ITEMS.map((n) => n.url),
  };

  useJsonLdMultiple([websiteSchema, siteNavSchema]);

  return <JsonLdMultiple schemas={[websiteSchema, siteNavSchema]} />;
}
