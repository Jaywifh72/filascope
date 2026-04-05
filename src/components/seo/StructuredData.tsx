import React from 'react';

interface StructuredDataProps {
  data: object;
}

/**
 * Renders JSON-LD structured data as a script tag
 * Used for SEO rich snippets and AI model citation
 */
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
