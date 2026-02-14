import { Helmet } from 'react-helmet-async';

interface DefinedTermItem {
  name: string;
  description: string;
  url: string;
}

interface DefinedTermSetSchemaProps {
  name: string;
  description?: string;
  terms: DefinedTermItem[];
}

/**
 * DefinedTermSet Schema.org structured data component.
 * Used for glossary / encyclopedia pages to help search engines
 * understand the terms defined on the page.
 */
export function DefinedTermSetSchema({ name, description, terms }: DefinedTermSetSchemaProps) {
  if (!terms || terms.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name,
    ...(description && { description }),
    hasDefinedTerm: terms.map((term) => ({
      '@type': 'DefinedTerm',
      name: term.name,
      description: term.description,
      url: term.url,
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
