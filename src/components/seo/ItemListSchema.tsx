import { useJsonLd, JsonLd } from './useJsonLd';
import { buildOfferBlock } from './schemaHelpers';

interface ItemListItem {
  name: string;
  url: string;
  image?: string;
  description?: string;
  position?: number;
  brand?: string;
  material?: string;
  price?: number;
  priceCurrency?: string;
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
  const jsonLd = items && items.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name,
        ...(description && { description }),
        itemListOrder: `https://schema.org/ItemListOrder${itemListOrder}`,
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => {
          const offerBlock = buildOfferBlock(item.price, item.priceCurrency || 'USD', true);
          return {
            '@type': 'ListItem',
            position: item.position || index + 1,
            name: item.name,
            url: item.url,
            item: {
              '@type': offerBlock ? 'Product' : 'Thing',
              name: item.name,
              url: item.url,
              ...(item.image && { image: item.image }),
              ...(item.description && { description: item.description }),
              ...(item.brand && { brand: { '@type': 'Brand', name: item.brand } }),
              ...(item.material && { material: item.material }),
              ...(offerBlock && { offers: offerBlock }),
            },
          };
        }),
      }
    : null;

  useJsonLd(jsonLd);

  return <JsonLd jsonLd={jsonLd} />;
}
