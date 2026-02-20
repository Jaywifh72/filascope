import { supabase } from "@/integrations/supabase/client";
import type {
  AffiliateProgram,
  GenerateAffiliateLinkRequest,
  GenerateAffiliateLinkResponse,
} from "@/types/affiliate";

/**
 * Calls the generate-affiliate-link edge function to build an affiliate URL
 * and log a click in one request.
 */
export async function generateAffiliateLink(
  brandName: string,
  regionCode: string,
  path?: string,
  options?: {
    productName?: string;
    sourcePage?: string;
    sourceComponent?: string;
    utmCampaign?: string;
  }
): Promise<GenerateAffiliateLinkResponse> {
  const body: GenerateAffiliateLinkRequest = {
    brand_name: brandName,
    region_code: regionCode,
    path,
    product_name: options?.productName,
    source_page: options?.sourcePage,
    source_component: options?.sourceComponent,
    utm_campaign: options?.utmCampaign,
  };

  const { data, error } = await supabase.functions.invoke(
    "generate-affiliate-link",
    { body }
  );

  if (error) {
    console.error("generateAffiliateLink error:", error);
    return { affiliate_url: null, has_affiliate: false };
  }

  return data as GenerateAffiliateLinkResponse;
}

/**
 * Synchronous client-side link builder from a cached program object.
 * Does NOT log a click — use for display/preview in admin UI.
 */
export function buildAffiliateLinkLocal(
  program: AffiliateProgram,
  path: string = ""
): string {
  // For redirect_link programs, return the default tracking link directly
  if (program.link_generation_method === "redirect_link" && program.default_tracking_link) {
    let url = program.default_tracking_link;
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}utm_source=filascope&utm_medium=affiliate`;
    if (program.source_parameter && program.source_value) {
      url += `&${program.source_parameter}=${program.source_value}`;
    }
    return url;
  }

  // For Awin redirect programs, construct cread.php link with encoded destination
  if (program.link_generation_method === "awin_redirect" && program.awin_merchant_id && program.awin_publisher_id) {
    // If path is a full URL (starts with http), use it directly as the destination
    const destinationUrl = path && (path.startsWith("http://") || path.startsWith("https://"))
      ? path
      : path
        ? `${program.store_base_url}${path}`
        : program.store_base_url;
    let url = `https://www.awin1.com/cread.php?awinmid=${program.awin_merchant_id}&awinaffid=${program.awin_publisher_id}&ued=${encodeURIComponent(destinationUrl)}`;
    if (program.source_value) {
      url += `&clickref=${program.source_value}`;
    }
    return url;
  }

  let url = program.link_template
    .replace("{store_url}", program.store_base_url)
    .replace("{path}", path)
    .replace("{tracking_value}", program.tracking_value || "");

  // Handle {source_value} placeholder
  if (program.source_value) {
    url = url.replace("{source_value}", program.source_value);
  } else {
    // Remove &source={source_value} or ?source={source_value} if no source_value
    url = url.replace(/[?&]source=\{source_value\}/g, "");
  }

  const separator = url.includes("?") ? "&" : "?";
  url += `${separator}utm_source=filascope&utm_medium=affiliate`;

  return url;
}

/**
 * Directly inserts into affiliate_clicks via the Supabase client.
 * Use when you want to track a click without calling the edge function
 * (e.g., the URL is already built client-side).
 * Fire-and-forget — does not block the redirect.
 */
export async function trackAffiliateClick(
  programId: string,
  destinationUrl: string,
  metadata: {
    brandName: string;
    regionCode: string;
    productName?: string;
    productSlug?: string;
    /** UUID of the product (filament or printer id) */
    productId?: string;
    /** 'filament' | 'printer' | 'accessory' */
    productType?: string;
    sourcePage?: string;
    sourceComponent?: string;
    price?: number;
    currency?: string;
  }
): Promise<void> {
  const sessionId = sessionStorage.getItem('analytics_session_id') || crypto.randomUUID();
  const referrer = typeof document !== 'undefined' ? document.referrer || null : null;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

  // Ensure session ID is persisted for funnel attribution
  try { sessionStorage.setItem('analytics_session_id', sessionId); } catch { /* ignore */ }

  const { error } = await supabase.from("affiliate_clicks").insert({
    program_id: programId,
    destination_url: destinationUrl,
    brand_name: metadata.brandName,
    region_code: metadata.regionCode,
    product_id: metadata.productId || null,
    product_name: metadata.productName || null,
    product_slug: metadata.productSlug || null,
    product_type: metadata.productType || null,
    source_page: metadata.sourcePage || (typeof window !== 'undefined' ? window.location.pathname : "unknown"),
    source_component: metadata.sourceComponent || null,
    session_id: sessionId,
    utm_source: "filascope",
    utm_medium: "affiliate",
    price: metadata.price ?? null,
    currency: metadata.currency || null,
    referrer: referrer,
    user_agent: userAgent,
  });

  if (error) {
    console.error("trackAffiliateClick error:", error);
  }
}
