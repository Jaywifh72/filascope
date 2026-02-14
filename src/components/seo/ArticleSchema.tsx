import { useJsonLd } from './useJsonLd';

const BASE_URL = 'https://filascope.com';

interface ArticleSchemaProps {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  imageUrl?: string;
}

export function ArticleSchema({
  headline,
  description,
  datePublished,
  dateModified,
  url,
  imageUrl,
}: ArticleSchemaProps) {
  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    datePublished,
    ...(dateModified && { dateModified }),
    url: `${BASE_URL}${url}`,
    ...(imageUrl && { image: imageUrl }),
    author: { '@type': 'Organization', name: 'FilaScope', url: BASE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'FilaScope',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/favicon.ico` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}${url}` },
  });

  return null;
}
