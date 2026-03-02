import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AffiliateClickParams {
  brandName: string;
  regionCode: string;
  affiliateUrl: string;
  productId?: string;
  productName?: string;
  productType?: "printer" | "filament" | "general";
  discountCode?: string;
  sourceComponent?: string;
}

function getSessionId(): string {
  const key = "filascope_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function useAffiliateClick() {
  const trackAndOpen = useCallback((params: AffiliateClickParams) => {
    // Open immediately — never block navigation
    window.open(params.affiliateUrl, "_blank", "noopener,noreferrer");

    // Fire-and-forget insert
    supabase
      .from("affiliate_clicks")
      .insert({
        brand_name: params.brandName,
        region_code: params.regionCode,
        destination_url: params.affiliateUrl,
        product_id: params.productId ?? null,
        product_name: params.productName ?? null,
        product_type: params.productType ?? "general",
        source_page: window.location.href,
        source_component: params.sourceComponent ?? null,
        session_id: getSessionId(),
      })
      .then(({ error }) => {
        if (error) console.warn("[affiliate-click] tracking failed:", error.message);
      });
  }, []);

  return { trackAndOpen };
}
