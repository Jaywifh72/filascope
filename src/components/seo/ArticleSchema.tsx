import { Helmet } from 'react-helmet-async';

interface ArticleSchemaProps {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  imageUrl?: string;
}

const BASE_URL = 'https://filascope.com';

/**
 * Article Schema.org structured data for guide/editorial pages.
 * Helps Google display article-rich results with publish date, author, etc.
 */
export function ArticleSchema({
  headline,
  description,
  datePublished,
  dateModified,
  url,
  imageUrl,
}: ArticleSchemaProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    datePublished,
    ...(dateModified && { dateModified }),
    url: `${BASE_URL}${url}`,
    ...(imageUrl && { image: imageUrl }),
    author: {
      '@type': 'Organization',
      name: 'FilaScope',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'FilaScope',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/favicon.ico`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}${url}`,
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
