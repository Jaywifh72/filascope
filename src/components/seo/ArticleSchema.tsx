import { useJsonLd, JsonLd } from './useJsonLd';

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
  speakableCssSelectors?: string[];
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
  speakableCssSelectors,
}: ArticleSchemaProps) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': articleType,
    headline,
    description,
    datePublished,
    ...(dateModified && { dateModified }),
    url: fullUrl,
    image: [imageUrl || `${BASE_URL}/og-image.png`],
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
    ...(speakableCssSelectors && speakableCssSelectors.length > 0 && {
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: speakableCssSelectors,
      },
    }),
  };

  useJsonLd(jsonLd);

  return <JsonLd jsonLd={jsonLd} />;
}
