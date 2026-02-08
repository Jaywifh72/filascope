import { useLocation } from "react-router-dom";
import { useMemo } from "react";

export type CompareTrayMode = "full" | "pill" | "hidden";

/**
 * Filament-related routes where the full compare tray should display.
 * All other routes show a minimal pill instead.
 * The tray is fully hidden on the active comparison page (/compare?ids=...).
 */
const FILAMENT_ROUTE_PATTERNS = [
  /^\/$/,                // Homepage / Finder
  /^\/filaments?\b/,     // /filament/* and /filaments/*
  /^\/finder\b/,         // /finder
  /^\/brands\b/,         // /brands and /brands/*
  /^\/compare\b/,        // /compare (without ids — handled separately)
  /^\/matrix\b/,         // /matrix (material matrix)
  /^\/hueforgefinder\b/, // HueForge finder
  /^\/td-database\b/,    // TD database
];

export function useCompareTrayMode(): CompareTrayMode {
  const location = useLocation();

  return useMemo(() => {
    const pathname = location.pathname;
    const searchParams = new URLSearchParams(location.search);

    // Hide entirely on active comparison pages (filament or printer)
    if (pathname === "/compare" && searchParams.has("ids")) {
      return "hidden";
    }
    if (pathname === "/printers/compare") {
      return "hidden";
    }

    // Full tray on filament-related pages
    const isFilamentPage = FILAMENT_ROUTE_PATTERNS.some((pattern) =>
      pattern.test(pathname)
    );

    return isFilamentPage ? "full" : "pill";
  }, [location.pathname, location.search]);
}
