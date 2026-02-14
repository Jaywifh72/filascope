import { useEffect, useRef } from 'react';

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
