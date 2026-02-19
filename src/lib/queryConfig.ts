/**
 * Centralized React Query cache configuration
 * Provides standardized staleTime and gcTime for different data types
 *
 * Stale-While-Revalidate strategy:
 * - staleTime: How long data is considered "fresh" (served from cache without refetch)
 * - gcTime: How long unused data stays in memory (garbage collection timeout)
 * Long staleTime = serve from cache immediately, refresh in background = SWR behaviour
 */

export const QUERY_CONFIG = {
  // Product data (filaments) - moderate staleness acceptable
  products: {
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 30,    // 30 minutes
  },
  
  // Printer data - changes less frequently; long SWR window
  printers: {
    staleTime: 1000 * 60 * 15, // 15 minutes (SWR: serve stale, refresh in bg)
    gcTime: 1000 * 60 * 60,    // 1 hour
  },
  
  // Price data - needs fresher updates
  prices: {
    staleTime: 1000 * 60 * 2,  // 2 minutes
    gcTime: 1000 * 60 * 10,    // 10 minutes
  },
  
  // Deals - price-sensitive, needs fresh data
  deals: {
    staleTime: 1000 * 60 * 3,  // 3 minutes
    gcTime: 1000 * 60 * 15,    // 15 minutes
  },
  
  // Static reference data - rarely changes; aggressive SWR caching
  static: {
    staleTime: Infinity,
    gcTime: Infinity,
  },
  
  // User-specific data
  user: {
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 30,    // 30 minutes
  },
  
  // Brands - infrequent updates; long SWR window for fast listing renders
  brands: {
    staleTime: 1000 * 60 * 20, // 20 minutes SWR (was 15min)
    gcTime: 1000 * 60 * 90,    // 90 minutes (was 60min)
  },

  // Material reference data (specs, guides, hub pages) - rarely changes
  materials: {
    staleTime: 1000 * 60 * 30, // 30 minutes SWR
    gcTime: 1000 * 60 * 120,   // 2 hours
  },

  // Printer specs / compatibility matrices - stable reference data
  printerSpecs: {
    staleTime: 1000 * 60 * 30, // 30 minutes SWR
    gcTime: 1000 * 60 * 120,   // 2 hours
  },
} as const;

/**
 * Default query client options
 * Uses stale-while-revalidate: return stale data immediately, refetch in background
 */
export const DEFAULT_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 2,    // 2 minutes default
  gcTime: 1000 * 60 * 10,      // 10 minutes default
  refetchOnWindowFocus: false,
  retry: 1,
};
