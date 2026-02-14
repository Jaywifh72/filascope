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
  let url = program.link_template
    .replace("{store_url}", program.store_base_url)
    .replace("{path}", path)
    .replace("{tracking_value}", program.tracking_value);

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
 */
export async function trackAffiliateClick(
  programId: string,
  destinationUrl: string,
  metadata: {
    brandName: string;
    regionCode: string;
    productName?: string;
    sourcePage?: string;
    sourceComponent?: string;
  }
): Promise<void> {
  const { error } = await supabase.from("affiliate_clicks").insert({
    program_id: programId,
    destination_url: destinationUrl,
    brand_name: metadata.brandName,
    region_code: metadata.regionCode,
    product_name: metadata.productName || null,
    source_page: metadata.sourcePage || "unknown",
    source_component: metadata.sourceComponent || null,
    session_id: crypto.randomUUID(),
    utm_source: "filascope",
    utm_medium: "affiliate",
  });

  if (error) {
    console.error("trackAffiliateClick error:", error);
  }
}
