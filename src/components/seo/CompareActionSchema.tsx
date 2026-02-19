import { useJsonLd } from './useJsonLd';

const BASE_URL = 'https://filascope.com';

interface CompareProduct {
  id: string;
  name: string;
  slug?: string | null;
  brand?: string | null;
  material?: string | null;
  price?: number | null;
  currency?: string;
}

interface CompareActionSchemaProps {
  products: CompareProduct[];
}

/**
 * Emits a CompareAction schema when 2+ products are being compared.
 * Also emits an ItemList of the compared products to aid entity recognition.
 */
export function CompareActionSchema({ products }: CompareActionSchemaProps) {
  const validProducts = products.filter((p) => p.name);

  const compareUrl = `${BASE_URL}/compare?ids=${validProducts.map((p) => p.id).join(',')}`;

  const schema =
    validProducts.length >= 2
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Compare: ${validProducts.map((p) => p.name).join(' vs ')}`,
          description: `Side-by-side comparison of ${validProducts.length} 3D printer filaments on FilaScope`,
          url: compareUrl,
          numberOfItems: validProducts.length,
          itemListElement: validProducts.map((p, i) => {
            const productUrl = p.slug
              ? `${BASE_URL}/filament/${p.slug}`
              : `${BASE_URL}/filament/${p.id}`;

            const item: Record<string, unknown> = {
              '@type': 'ListItem',
              position: i + 1,
              name: p.name,
              url: productUrl,
              item: {
                '@type': 'Product',
                name: p.name,
                url: productUrl,
                ...(p.brand && {
                  brand: { '@type': 'Brand', name: p.brand },
                }),
                ...(p.material && { material: p.material }),
                ...(p.price != null && {
                  offers: {
                    '@type': 'Offer',
                    price: p.price.toFixed(2),
                    priceCurrency: p.currency || 'USD',
                    availability: 'https://schema.org/InStock',
                  },
                }),
              },
            };

            return item;
          }),
        }
      : null;

  useJsonLd(schema);

  return null;
}
