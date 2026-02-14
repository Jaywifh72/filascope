import { useJsonLd } from './useJsonLd';

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

export function ItemListSchema({
  name,
  description,
  items,
  itemListOrder = 'Ascending',
}: ItemListSchemaProps) {
  useJsonLd(
    items && items.length > 0
      ? {
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
        }
      : null,
  );

  return null;
}
