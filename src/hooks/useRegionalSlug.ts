/**
 * React hook for fetching regional slug mappings
 */

import { useQuery } from '@tanstack/react-query';
import { RegionCode } from '@/types/regional';
import { fetchRegionalSlug, RegionalSlugData } from '@/utils/regionalSlugResolver';

interface UseRegionalSlugOptions {
  /** Filament ID to look up */
  filamentId: string | null | undefined;
  /** Region code to get slug for */
  regionCode: RegionCode;
  /** Whether to enable the query */
  enabled?: boolean;
}

interface UseRegionalSlugResult {
  /** The regional slug data if found */
  slugData: RegionalSlugData | null;
  /** Whether the query is loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * Hook to fetch a verified regional slug for a product
 * 
 * @example
 * const { slugData, isLoading } = useRegionalSlug({
 *   filamentId: 'abc-123',
 *   regionCode: 'CA',
 * });
 * 
 * if (slugData?.verified) {
 *   console.log('Use verified slug:', slugData.slug);
 * }
 */
export function useRegionalSlug({
  filamentId,
  regionCode,
  enabled = true,
}: UseRegionalSlugOptions): UseRegionalSlugResult {
  const {
    data: slugData = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['regional-slug', filamentId, regionCode],
    queryFn: () => fetchRegionalSlug(filamentId!, regionCode),
    enabled: enabled && !!filamentId && !!regionCode,
    staleTime: 30 * 60 * 1000, // 30 minutes - slugs don't change often
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });

  return {
    slugData,
    isLoading,
    error: error as Error | null,
  };
}

export type { UseRegionalSlugOptions, UseRegionalSlugResult };
