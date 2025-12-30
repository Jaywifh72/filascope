import { Helmet } from 'react-helmet-async';

interface ItemListItem {
  name: string;
  url: string;
  image?: string;
  description?: string;
  position?: number;
}

interface ItemListSchemaProps {
  name: string;
  description?: string;
  items: ItemListItem[];
  itemListOrder?: 'Ascending' | 'Descending' | 'Unordered';
}

/**
 * ItemList Schema.org structured data component
 * Helps list pages appear in Google's rich results with carousel/list format
 */
export function ItemListSchema({
  name,
  description,
  items,
  itemListOrder = 'Ascending',
}: ItemListSchemaProps) {
  if (!items || items.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    ...(description && { description }),
    itemListOrder: `https://schema.org/ItemListOrder${itemListOrder}`,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position || index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        url: item.url,
        ...(item.image && { image: item.image }),
        ...(item.description && { description: item.description }),
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
