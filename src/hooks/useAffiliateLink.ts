import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRegion } from "@/contexts/RegionContext";
import { buildAffiliateLinkLocal, trackAffiliateClick } from "@/utils/affiliateLinks";
import { trackAffiliateClick as trackGA4AffiliateClick, trackEcommerceSelectItem } from "@/lib/analytics";
import type { AffiliateProgram, AffiliateDiscountCode } from "@/types/affiliate";

export interface ClickMetadata {
  productName?: string;
  productSlug?: string;
  sourcePage?: string;
  sourceComponent?: string;
  price?: number;
  currency?: string;
  /** item_category for GA4 select_item — filament material type (PLA, PETG…) */
  material?: string;
  /** UpPromote source tracking (appended as sca_source) */
  source?: string;
}

interface UseAffiliateLinkResult {
  program: AffiliateProgram | null;
  inactiveProgram: AffiliateProgram | null;
  buildLink: (url: string) => string;
  trackAndOpen: (url: string, metadata: ClickMetadata) => void;
  discountCodes: AffiliateDiscountCode[];
  isLoading: boolean;
  hasAffiliate: boolean;
  /** The region_code that was actually matched ('GLOBAL', 'AU', 'UK', etc.) */
  resolvedRegion: string | null;
}

/**
 * Local fallback affiliate configs for brands not yet in the affiliate_programs DB.
 * Structured as partial AffiliateProgram objects so buildAffiliateLinkLocal() works.
 * These are the safety net — the canonical source of truth is the DB.
 */
const LOCAL_FALLBACK_PROGRAMS: Record<string, Partial<AffiliateProgram>> = {
  polymaker: {
    id: "local-polymaker",
    brand_name: "Polymaker",
    region_code: "GLOBAL",
    affiliate_network: "Affiliatly",
    store_base_url: "https://us.polymaker.com",
    tracking_parameter: "aff",
    tracking_value: "99",
    link_generation_method: "url_parameter",
    is_active: true,
  },
};

/**
 * Hook that looks up an affiliate_programs record for a given brand+region.
 * Returns helpers to build tracked affiliate links and open them.
 * Falls back to LOCAL_FALLBACK_PROGRAMS when no DB entry exists.
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

      // Fallback: prefer GLOBAL program, then any active program
      const { data: globalMatch, error: globalError } = await supabase
        .from("affiliate_programs")
        .select("*")
        .ilike("brand_name", resolvedBrandName!)
        .eq("region_code", "GLOBAL")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (globalError) {
        console.error("[useAffiliateLink] global lookup error:", globalError);
      }
      if (globalMatch) return globalMatch as AffiliateProgram;

      // Last resort: any active program in the DB
      const { data: fallback, error: fallbackError } = await supabase
        .from("affiliate_programs")
        .select("*")
        .ilike("brand_name", resolvedBrandName!)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (fallbackError) {
        console.error("[useAffiliateLink] fallback lookup error:", fallbackError);
      }
      if (fallback) return fallback as AffiliateProgram;

      // Final fallback: check local hardcoded configs for brands not yet in DB
      const localKey = resolvedBrandName!.toLowerCase();
      const localFallback = LOCAL_FALLBACK_PROGRAMS[localKey];
      if (localFallback) {
        console.info(`[useAffiliateLink] Using local fallback for "${resolvedBrandName}"`);
        return localFallback as AffiliateProgram;
      }

      return null;
    },
  });

  // Fetch inactive program for admin preview (only when no active program found)
  const { data: inactiveProgram = null } = useQuery({
    queryKey: ["affiliate-program-inactive", resolvedBrandName, region],
    enabled: !!resolvedBrandName && !aliasLoading && !program,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_programs")
        .select("*")
        .ilike("brand_name", resolvedBrandName!)
        .eq("region_code", region)
        .eq("is_active", false)
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      return data as AffiliateProgram;
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
   * Automatically appends sca_source=filascope-web for UpPromote programs.
   */
  const buildLink = useCallback(
    (url: string, source: string = 'filascope-web'): string => {
      if (!program) return url;
      try {
        // For awin_redirect: pass the full URL so Awin can redirect regardless of domain
        if (program.link_generation_method === "awin_redirect") {
          return buildAffiliateLinkLocal(program, url, source);
        }

        // For redirect_link: no deep linking, just return the default tracking link
        if (program.link_generation_method === "redirect_link") {
          return buildAffiliateLinkLocal(program, "", source);
        }

        // For url_parameter and others: extract path and combine with store_base_url
        const urlObj = new URL(url);
        const basePath = urlObj.pathname;
        return buildAffiliateLinkLocal(program, basePath, source);
      } catch {
        // If url isn't a valid URL, treat it as a path
        return buildAffiliateLinkLocal(program, url, source);
      }
    },
    [program]
  );

  /**
   * Track the click and open the affiliate URL in a new tab.
   */
  const trackAndOpen = useCallback(
    (url: string, metadata: ClickMetadata) => {
      const source = metadata.source || 'filascope-web';
      const finalUrl = buildLink(url, source);

      // GA4 tracking — param names match configured custom dimensions
      trackGA4AffiliateClick({
        brand: program?.brand_name || brandName || '',
        productName: metadata.productName || '',
        productId: metadata.sourceComponent || '',
        affiliateProgram: program?.affiliate_network,
        region: program?.region_code || region,
        price: metadata.price,
        currency: metadata.currency,
        linkType: 'product_page',
      });

      // GA4 Enhanced E-commerce: select_item — feeds built-in Monetization funnel
      trackEcommerceSelectItem({
        slug: metadata.productSlug || metadata.productName?.toLowerCase().replace(/\s+/g, '-') || '',
        name: metadata.productName || '',
        brand: program?.brand_name || brandName || '',
        material: metadata.material || 'Filament',
        storeName: program?.brand_name || brandName || 'Store',
        price: metadata.price,
        currency: metadata.currency,
      });

      if (program) {
        // Track the original product URL, NOT the Awin-wrapped URL.
        // The affiliate link (finalUrl) is opened in the browser; we log where it leads.
        trackAffiliateClick(program.id, url, {
          brandName: program.brand_name,
          regionCode: program.region_code,
          productName: metadata.productName,
          productSlug: metadata.productSlug,
          sourcePage: metadata.sourcePage || window.location.pathname,
          sourceComponent: metadata.sourceComponent,
          price: metadata.price,
          currency: metadata.currency,
        }).catch(() => {});
      }

      window.open(finalUrl, "_blank", "noopener,noreferrer");
    },
    [program, buildLink, brandName, region]
  );

  return {
    program,
    inactiveProgram,
    buildLink,
    trackAndOpen,
    discountCodes,
    isLoading: aliasLoading || programLoading,
    hasAffiliate: !!program,
    resolvedRegion: program?.region_code ?? null,
  };
}
