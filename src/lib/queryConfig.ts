/**
 * Centralized React Query cache configuration
 * Provides standardized staleTime and gcTime for different data types
 */

export const QUERY_CONFIG = {
  // Product data (filaments) - moderate staleness acceptable
  products: {
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 30,    // 30 minutes
  },
  
  // Printer data - changes less frequently
  printers: {
    staleTime: 1000 * 60 * 10, // 10 minutes
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
  
  // Static reference data - rarely changes
  static: {
    staleTime: Infinity,
    gcTime: Infinity,
  },
  
  // User-specific data
  user: {
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 30,    // 30 minutes
  },
  
  // Brands - infrequent updates
  brands: {
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60,    // 1 hour
  },
} as const;

/**
 * Default query client options
 */
export const DEFAULT_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 2,    // 2 minutes default
  gcTime: 1000 * 60 * 10,      // 10 minutes default
  refetchOnWindowFocus: false,
  retry: 1,
};
