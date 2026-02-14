import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildAffiliateUrl(
  program: Record<string, unknown>,
  path: string,
  utmCampaign?: string
): string {
  const linkGenerationMethod = program.link_generation_method as string | null;
  const defaultTrackingLink = program.default_tracking_link as string | null;
  const sourceParameter = program.source_parameter as string | null;
  const sourceValue = program.source_value as string | null;

  // For redirect_link programs (Impact.com), return the default tracking link directly
  if (linkGenerationMethod === "redirect_link" && defaultTrackingLink) {
    let url = defaultTrackingLink;
    const separator = url.includes("?") ? "&" : "?";
    url += `${separator}utm_source=filascope&utm_medium=affiliate`;
    if (sourceParameter && sourceValue) {
      url += `&${sourceParameter}=${encodeURIComponent(sourceValue)}`;
    }
    if (utmCampaign) {
      url += `&utm_campaign=${encodeURIComponent(utmCampaign)}`;
    }
    return url;
  }

  // For Awin redirect programs, construct cread.php link with encoded destination
  const awinMerchantId = program.awin_merchant_id as string | null;
  const awinPublisherId = program.awin_publisher_id as string | null;
  if (linkGenerationMethod === "awin_redirect" && awinMerchantId && awinPublisherId) {
    const storeBaseUrl = program.store_base_url as string;
    const destinationUrl = path ? `${storeBaseUrl}${path}` : storeBaseUrl;
    let url = `https://www.awin1.com/cread.php?awinmid=${awinMerchantId}&awinaffid=${awinPublisherId}&ued=${encodeURIComponent(destinationUrl)}`;
    if (sourceValue) {
      url += `&clickref=${encodeURIComponent(sourceValue)}`;
    }
    if (utmCampaign) {
      url += `&clickref2=${encodeURIComponent(utmCampaign)}`;
    }
    return url;
  }

  // URL parameter mode
  const linkTemplate = program.link_template as string;
  const storeBaseUrl = program.store_base_url as string;
  const trackingValue = (program.tracking_value as string) || "";

  let url = linkTemplate
    .replace("{store_url}", storeBaseUrl)
    .replace("{path}", path)
    .replace("{tracking_value}", trackingValue);

  // Handle {source_value} placeholder
  if (sourceValue) {
    url = url.replace("{source_value}", sourceValue);
  } else {
    url = url.replace(/[?&]source=\{source_value\}/g, "");
  }

  // Determine separator for UTM params
  const separator = url.includes("?") ? "&" : "?";
  url += `${separator}utm_source=filascope&utm_medium=affiliate`;

  if (utmCampaign) {
    url += `&utm_campaign=${encodeURIComponent(utmCampaign)}`;
  }

  return url;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      brand_name,
      region_code,
      path = "",
      product_name,
      source_page,
      source_component,
      utm_campaign,
    } = await req.json();

    if (!brand_name || !region_code) {
      return new Response(
        JSON.stringify({ error: "brand_name and region_code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up active program
    const { data: program, error: programError } = await supabase
      .from("affiliate_programs")
      .select("*")
      .eq("brand_name", brand_name)
      .eq("region_code", region_code)
      .eq("is_active", true)
      .maybeSingle();

    if (programError) {
      console.error("Program lookup error:", programError);
      return new Response(
        JSON.stringify({ affiliate_url: null, has_affiliate: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!program) {
      return new Response(
        JSON.stringify({ affiliate_url: null, has_affiliate: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build affiliate URL
    const affiliateUrl = buildAffiliateUrl(program, path, utm_campaign);

    // Log click
    const clickData = {
      program_id: program.id,
      brand_name,
      region_code,
      product_name: product_name || null,
      source_page: source_page || "unknown",
      source_component: source_component || null,
      destination_url: affiliateUrl,
      session_id: crypto.randomUUID(),
      user_agent: req.headers.get("user-agent") || null,
      utm_source: "filascope",
      utm_medium: "affiliate",
      utm_campaign: utm_campaign || null,
    };

    // Fire-and-forget insert
    supabase.from("affiliate_clicks").insert(clickData).then(({ error }) => {
      if (error) console.error("Click logging error:", error);
    });

    // Fetch active assigned discount codes
    const { data: codes } = await supabase
      .from("affiliate_discount_codes")
      .select("code, display_text, valid_until")
      .eq("program_id", program.id)
      .eq("is_active", true)
      .eq("is_assigned", true)
      .or("valid_until.is.null,valid_until.gt.now()");

    return new Response(
      JSON.stringify({
        affiliate_url: affiliateUrl,
        has_affiliate: true,
        program_status: program.account_status,
        discount_codes: codes || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
