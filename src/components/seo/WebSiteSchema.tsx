import { Helmet } from 'react-helmet-async';

interface WebSiteSchemaProps {
  name?: string;
  url?: string;
  description?: string;
  searchTargetUrl?: string;
}

/**
 * WebSite Schema.org structured data component
 * Enables sitelinks search box in Google search results
 */
export function WebSiteSchema({
  name = 'FilaScope',
  url = 'https://filascope.com',
  description = 'Compare 3D printer filaments by material, price, and specifications. Find the perfect filament for your printer with real-time pricing and HueForge TD values.',
  searchTargetUrl = 'https://filascope.com/?searchTerm={search_term_string}',
}: WebSiteSchemaProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchTargetUrl,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
