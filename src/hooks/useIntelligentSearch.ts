import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FilamentSearchResult, SearchIntent } from "@/types/intelligentSearch";

const INTELLIGENT_KEYWORDS = [
  "what", "which", "is there", "can i", "best", "good for",
  "work for", "suitable", "recommend",
];

export function useIntelligentSearch(region?: string) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FilamentSearchResult[]>([]);
  const [intent, setIntent] = useState<SearchIntent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const isIntelligentMode =
    query.length > 15 ||
    INTELLIGENT_KEYWORDS.some((kw) => query.toLowerCase().includes(kw));

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setIntent(null);
    setError(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      setResults([]);
      setIntent(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      // Cancel previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "intelligent-filament-search",
          {
            body: { query: trimmed, region: region ?? "US" },
          }
        );

        if (controller.signal.aborted || !mountedRef.current) return;

        if (fnError) {
          setError(fnError.message ?? "Search failed");
          setResults([]);
          setIntent(null);
        } else {
          setResults(data?.results ?? []);
          setIntent(data?.intent ?? null);
        }
      } catch (err) {
        if (controller.signal.aborted || !mountedRef.current) return;
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
        setIntent(null);
      } finally {
        if (!controller.signal.aborted && mountedRef.current) {
          setIsLoading(false);
        }
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [query, region]);

  return {
    query,
    setQuery,
    results,
    intent,
    isLoading,
    isIntelligentMode,
    error,
    clearSearch,
  };
}
