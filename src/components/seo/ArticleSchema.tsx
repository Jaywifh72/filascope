import { useJsonLd } from './useJsonLd';

const BASE_URL = 'https://filascope.com';

interface AboutThing {
  '@type': string;
  name: string;
}

interface ArticleSchemaProps {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  imageUrl?: string;
  articleType?: 'Article' | 'TechArticle';
  about?: AboutThing;
  proficiencyLevel?: string;
}

export function ArticleSchema({
  headline,
  description,
  datePublished,
  dateModified,
  url,
  imageUrl,
  articleType = 'Article',
  about,
  proficiencyLevel,
}: ArticleSchemaProps) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

  useJsonLd({
    '@context': 'https://schema.org',
    '@type': articleType,
    headline,
    description,
    datePublished,
    ...(dateModified && { dateModified }),
    url: fullUrl,
    ...(imageUrl && { image: imageUrl }),
    author: { '@type': 'Organization', name: 'FilaScope', url: BASE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'FilaScope',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/og-image.png` },
    },
    mainEntityOfPage: fullUrl,
    ...(about && { about }),
    ...(proficiencyLevel && { proficiencyLevel }),
  });

  return null;
}
