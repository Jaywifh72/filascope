import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegion } from "@/contexts/RegionContext";
import { buildAffiliateLinkLocal, trackAffiliateClick } from "@/utils/affiliateLinks";
import { trackAffiliateClick as trackGA4AffiliateClick } from "@/lib/analytics";
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

  // Step 1: Look up alias for the brand name
  const { data: resolvedBrandName, isLoading: aliasLoading } = useQuery({
    queryKey: ["brand-affiliate-alias", brandName],
    enabled: !!brandName,
    staleTime: 10 * 60_000, // 10 min - rarely changes
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_affiliate_aliases")
        .select("affiliate_brand_name")
        .ilike("product_vendor_name", brandName!)
        .limit(1)
        .maybeSingle();
      if (error || !data) return brandName!;
      return data.affiliate_brand_name;
    },
  });

  // Step 2: Look up the affiliate program using resolved name + ilike (with region fallback)
  const { data: program = null, isLoading: programLoading } = useQuery({
    queryKey: ["affiliate-program-lookup", resolvedBrandName, region],
    enabled: !!resolvedBrandName && !aliasLoading,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      // Try exact region match first
      const { data: exactMatch, error: exactError } = await supabase
        .from("affiliate_programs")
        .select("*")
        .ilike("brand_name", resolvedBrandName!)
        .eq("region_code", region)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (exactError) {
        console.error("[useAffiliateLink] lookup error:", exactError);
        return null;
      }
      if (exactMatch) return exactMatch as AffiliateProgram;

      // Fallback: any active program for this brand (regardless of region)
      const { data: fallback, error: fallbackError } = await supabase
        .from("affiliate_programs")
        .select("*")
        .ilike("brand_name", resolvedBrandName!)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (fallbackError) {
        console.error("[useAffiliateLink] fallback lookup error:", fallbackError);
        return null;
      }
      return (fallback as AffiliateProgram) ?? null;
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
      const now = new Date().toISOString();
      return (data || []).filter(
        (c) => !c.valid_until || c.valid_until > now
      ) as AffiliateDiscountCode[];
    },
  });

  /**
   * Build an affiliate link synchronously from a destination URL.
   * Handles domain mismatches between product URLs and affiliate store URLs.
   */
  const buildLink = useCallback(
    (url: string): string => {
      if (!program) return url;
      try {
        // For awin_redirect: pass the full URL so Awin can redirect regardless of domain
        if (program.link_generation_method === "awin_redirect") {
          return buildAffiliateLinkLocal(program, url);
        }

        // For redirect_link: no deep linking, just return the default tracking link
        if (program.link_generation_method === "redirect_link") {
          return buildAffiliateLinkLocal(program, "");
        }

        // For url_parameter and others: extract path and combine with store_base_url
        const urlObj = new URL(url);
        const basePath = urlObj.pathname;
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

      // GA4 tracking
      trackGA4AffiliateClick({
        brand: program?.brand_name || brandName || '',
        productName: metadata.productName || '',
        productId: metadata.sourceComponent || '',
        affiliateProgram: program?.affiliate_network,
        region: program?.region_code || region,
        linkType: program ? 'affiliate' : 'direct',
      });

      if (program) {
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
    [program, buildLink, brandName, region]
  );

  return {
    program,
    buildLink,
    trackAndOpen,
    discountCodes,
    isLoading: aliasLoading || programLoading,
    hasAffiliate: !!program,
  };
}
