import { useState, useEffect, useCallback, useRef } from "react";

const SEARCH_PLACEHOLDERS = [
  "Try 'flexible TPU'",
  "Search 1,073+ filaments",
  "Find 'Bambu Lab filament'",
  "Try 'high temp PETG'",
  "Search by color: 'Galaxy Blue'",
  "Find 'eSun filament'",
  "Try 'silk PLA'",
  "Search 'high speed printing'",
];

const FOCUSED_PLACEHOLDERS: Record<string, string> = {
  "/": "Search filaments by name, brand, or material...",
  "/printers": "Search printers by brand or model...",
  "/brands": "Search brands...",
  "/deals": "Search deals...",
};

const DEFAULT_FOCUSED = "Search filaments, printers, or brands...";

interface UseRotatingPlaceholderOptions {
  intervalMs?: number;
  pathname?: string;
}

export function useRotatingPlaceholder(options: UseRotatingPlaceholderOptions = {}) {
  const { intervalMs = 3000, pathname = "/" } = options;
  const [index, setIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasValue = useRef(false);

  useEffect(() => {
    if (isFocused || isHovered || hasValue.current) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      // After fade-out, change text
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        setIsAnimating(false);
      }, 200);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isFocused, isHovered, intervalMs]);

  const placeholder = isFocused
    ? (FOCUSED_PLACEHOLDERS[pathname] || DEFAULT_FOCUSED)
    : SEARCH_PLACEHOLDERS[index];

  const onFocus = useCallback(() => setIsFocused(true), []);
  const onBlur = useCallback(() => setIsFocused(false), []);
  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);
  const setHasValue = useCallback((v: boolean) => { hasValue.current = v; }, []);

  return {
    placeholder,
    isAnimating,
    isFocused,
    handlers: { onFocus, onBlur, onMouseEnter, onMouseLeave },
    setHasValue,
  };
}
