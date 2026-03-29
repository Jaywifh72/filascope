import { useEffect, useRef } from 'react';
import React from 'react';

/**
 * Renders a single JSON-LD <script type="application/ld+json"> tag inline in the
 * component tree, ensuring the schema appears in the static HTML output (SSR/SSG).
 * suppressHydrationWarning prevents React from complaining if the serialised JSON
 * differs slightly between server and client renders.
 */
export function JsonLd({ jsonLd }: { jsonLd: Record<string, unknown> | null }) {
  if (!jsonLd) return null;
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      suppressHydrationWarning
    />
  );
}

/**
 * Renders multiple JSON-LD <script type="application/ld+json"> tags inline in the
 * component tree, one per non-null schema.
 */
export function JsonLdMultiple({ schemas }: { schemas: (Record<string, unknown> | null)[] }) {
  const filtered = schemas.filter(Boolean) as Record<string, unknown>[];
  if (filtered.length === 0) return null;
  return (
    <>
      {filtered.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          suppressHydrationWarning
        />
      ))}
    </>
  );
}

/**
 * Injects a JSON-LD <script> tag directly into <head>, bypassing react-helmet-async.
 * Helmet deduplicates <script type="application/ld+json"> tags, keeping only the last one.
 * This hook allows multiple JSON-LD blocks to coexist on the same page.
 */
export function useJsonLd(jsonLd: Record<string, unknown> | null) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!jsonLd) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-jsonld', 'true');
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [JSON.stringify(jsonLd)]);
}

/**
 * Injects multiple JSON-LD <script> tags at once.
 */
export function useJsonLdMultiple(schemas: (Record<string, unknown> | null)[]) {
  const scriptsRef = useRef<HTMLScriptElement[]>([]);

  useEffect(() => {
    // Clean up previous
    scriptsRef.current.forEach((s) => s.remove());
    scriptsRef.current = [];

    const filtered = schemas.filter(Boolean) as Record<string, unknown>[];
    for (const jsonLd of filtered) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-jsonld', 'true');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
      scriptsRef.current.push(script);
    }

    return () => {
      scriptsRef.current.forEach((s) => s.remove());
      scriptsRef.current = [];
    };
  }, [JSON.stringify(schemas)]);
}
