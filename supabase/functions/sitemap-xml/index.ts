/**
 * sitemap-xml edge function
 *
 * Returns a sitemap INDEX pointing to 6 sub-sitemaps, all hosted at
 * https://filascope.com/ so Google accepts them as same-domain.
 *
 * Each <sitemap> entry includes a <lastmod> reflecting the most recent
 * content change in that sub-sitemap (queried from the database).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://filascope.com";

/** Convert a timestamp string to YYYY-MM-DD, falling back to today */
function w3c(v: string | null | undefined): string {
  if (!v) return new Date().toISOString().split("T")[0];
  try {
    return new Date(v).toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

// Guide dates — keep in sync with prerender/index.ts GUIDE_DATES
const GUIDE_DATES: Record<string, string> = {
  "best-pla-filaments": "2026-02-28",
  "best-petg-filaments": "2026-02-28",
  "best-abs-filaments": "2026-02-28",
  "pla-vs-petg": "2026-02-28",
  "best-filaments-hueforge": "2026-02-28",
  "best-filaments-hueforge-lithophanes": "2026-02-28",
  "complete-beginners-guide-filaments": "2026-02-28",
  "pla-plus-vs-pla-pro": "2026-02-28",
  "best-filaments-bambu-lab-p1s": "2026-02-28",
  "best-silk-pla-filaments": "2026-02-28",
  "asa-vs-abs-outdoor-printing": "2026-02-28",
  "strongest-3d-printer-filament": "2026-02-28",
  "how-to-store-filament": "2026-02-28",
  "how-to-dry-filament": "2026-02-28",
  "food-safe-filament": "2026-02-28",
  "best-white-filaments": "2026-03-03",
  "filament-temperature-guide": "2026-03-03",
  "hueforge-guide": "2026-03-03",
  "hueforge-what-is-td": "2026-03-03",
  "how-to-measure-filament-td": "2026-03-03",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Query latest update dates from DB in parallel
    const [fUpdatedR, fScrapedR, bUpdatedR, bScrapedR, pR] = await Promise.all([
      sb
        .from("filaments")
        .select("updated_at")
        .not("updated_at", "is", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single(),
      sb
        .from("filaments")
        .select("last_scraped_at")
        .not("last_scraped_at", "is", null)
        .order("last_scraped_at", { ascending: false })
        .limit(1)
        .single(),
      sb
        .from("automated_brands")
        .select("updated_at")
        .eq("is_visible", true)
        .not("updated_at", "is", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single(),
      sb
        .from("automated_brands")
        .select("last_scrape_at")
        .eq("is_visible", true)
        .not("last_scrape_at", "is", null)
        .order("last_scrape_at", { ascending: false })
        .limit(1)
        .single(),
      sb
        .from("printers")
        .select("updated_at")
        .not("updated_at", "is", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    const filamentDate = w3c(
      [fUpdatedR.data?.updated_at, fScrapedR.data?.last_scraped_at]
        .filter(Boolean)
        .sort()
        .pop() as string | undefined
    );
    const brandDate = w3c(
      [bUpdatedR.data?.updated_at, bScrapedR.data?.last_scrape_at]
        .filter(Boolean)
        .sort()
        .pop() as string | undefined
    );
    const printerDate = w3c(pR.data?.updated_at);
    const guideDate =
      Object.values(GUIDE_DATES).filter(Boolean).sort().pop() || today;

    const subs: [string, string][] = [
      ["sitemap-pages.xml", today],
      ["sitemap-filaments.xml", filamentDate],
      ["sitemap-brands.xml", brandDate],
      ["sitemap-printers.xml", printerDate],
      ["sitemap-guides.xml", guideDate],
      ["sitemap-colors.xml", today],
    ];

    const items = subs
      .map(
        ([s, d]) =>
          `  <sitemap>\n    <loc>${BASE_URL}/${s}</loc>\n    <lastmod>${d}</lastmod>\n  </sitemap>`
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("Sitemap index error:", err);
    return new Response("Internal Server Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
