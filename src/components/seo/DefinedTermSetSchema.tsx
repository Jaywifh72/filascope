import { useJsonLd, JsonLd } from './useJsonLd';

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

export function DefinedTermSetSchema({ name, description, terms }: DefinedTermSetSchemaProps) {
  const jsonLd = terms && terms.length > 0
    ? {
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
      }
    : null;

  useJsonLd(jsonLd);

  return <JsonLd jsonLd={jsonLd} />;
}
