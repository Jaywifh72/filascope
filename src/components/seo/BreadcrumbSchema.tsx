import { useJsonLd, JsonLd } from './useJsonLd';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

/**
 * Generates BreadcrumbList JSON-LD schema.
 * Per Google guidelines, the last item (current page) should NOT have an "item" URL.
 * All other items must have full absolute URLs.
 */
export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const jsonLd = items && items.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => {
          const isLast = index === items.length - 1;
          // Ensure URL is absolute
          const absoluteUrl = item.url.startsWith('http')
            ? item.url
            : `https://filascope.com${item.url.startsWith('/') ? '' : '/'}${item.url}`;

          return {
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            // Omit "item" for the last breadcrumb (current page)
            ...(isLast ? {} : { item: absoluteUrl }),
          };
        }),
      }
    : null;

  useJsonLd(jsonLd);

  return <JsonLd jsonLd={jsonLd} />;
}
