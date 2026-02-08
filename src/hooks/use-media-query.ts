import * as React from "react";

/**
 * Hook that tracks whether a CSS media query matches.
 * @param query - A valid CSS media query string, e.g. "(min-width: 1024px)"
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
