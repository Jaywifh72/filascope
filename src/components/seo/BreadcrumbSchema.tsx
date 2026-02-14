import { useJsonLd } from './useJsonLd';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  useJsonLd(
    items && items.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        }
      : null,
  );

  return null;
}
