import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegion } from "@/contexts/RegionContext";
import { buildAffiliateLinkLocal, trackAffiliateClick } from "@/utils/affiliateLinks";
import type { AffiliateProgram, AffiliateDiscountCode } from "@/types/affiliate";

export interface ClickMetadata {
  productName?: string;
  sourcePage?: string;
  sourceComponent?: string;
}

interface UseAffiliateLinkResult {
  program: AffiliateProgram | null;
  buildLink: (url: string) => string;
  trackAndOpen: (url: string, metadata: ClickMetadata) => void;
  discountCodes: AffiliateDiscountCode[];
  isLoading: boolean;
  hasAffiliate: boolean;
}

/**
 * Hook that looks up an affiliate_programs record for a given brand+region.
 * Returns helpers to build tracked affiliate links and open them.
 * Falls back gracefully when no program exists (returns original URLs).
 */
export function useAffiliateLink(brandName: string | null | undefined): UseAffiliateLinkResult {
  const { region } = useRegion();

  const { data: program = null, isLoading: programLoading } = useQuery({
    queryKey: ["affiliate-program-lookup", brandName, region],
    enabled: !!brandName,
    staleTime: 5 * 60_000, // cache 5 min
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_programs")
        .select("*")
        .eq("brand_name", brandName!)
        .eq("region_code", region)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("[useAffiliateLink] lookup error:", error);
        return null;
      }
      return data as AffiliateProgram | null;
    },
  });

  const { data: discountCodes = [] } = useQuery({
    queryKey: ["affiliate-discount-codes-active", program?.id],
    enabled: !!program?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_discount_codes")
        .select("*")
        .eq("program_id", program!.id)
        .eq("is_active", true)
        .eq("is_assigned", true);
      if (error) return [];
      // Filter out expired codes client-side
      const now = new Date().toISOString();
      return (data || []).filter(
        (c) => !c.valid_until || c.valid_until > now
      ) as AffiliateDiscountCode[];
    },
  });

  /**
   * Build an affiliate link synchronously from a destination URL.
   * If we have a program, applies the link template.
   * Otherwise returns the original URL unchanged.
   */
  const buildLink = useCallback(
    (url: string): string => {
      if (!program) return url;
      try {
        // Extract path from the URL relative to store_base_url
        const urlObj = new URL(url);
        const basePath = urlObj.pathname + urlObj.search;
        return buildAffiliateLinkLocal(program, basePath);
      } catch {
        // If url isn't a valid URL, treat it as a path
        return buildAffiliateLinkLocal(program, url);
      }
    },
    [program]
  );

  /**
   * Track the click and open the affiliate URL in a new tab.
   */
  const trackAndOpen = useCallback(
    (url: string, metadata: ClickMetadata) => {
      const finalUrl = buildLink(url);

      if (program) {
        // Fire-and-forget tracking
        trackAffiliateClick(program.id, finalUrl, {
          brandName: program.brand_name,
          regionCode: program.region_code,
          productName: metadata.productName,
          sourcePage: metadata.sourcePage || window.location.pathname,
          sourceComponent: metadata.sourceComponent,
        }).catch(() => {});
      }

      window.open(finalUrl, "_blank", "noopener,noreferrer");
    },
    [program, buildLink]
  );

  return {
    program,
    buildLink,
    trackAndOpen,
    discountCodes,
    isLoading: programLoading,
    hasAffiliate: !!program,
  };
}
